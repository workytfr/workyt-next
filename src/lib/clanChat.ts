import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import ClanMember from '@/models/ClanMember';
import ClanMessage, { MESSAGE_MAX } from '@/models/ClanMessage';
import { seasonKey } from '@/lib/clanService';
import { warDay } from '@/lib/clanResolution';

/**
 * Le tchat de clan — éphémère par construction.
 *
 * Il sert à une seule chose : permettre à un clan de se coordonner dans la
 * journée (« tapez tous la porte sud », « je passe défenseur »). Rien n'est
 * conservé au-delà de la journée de guerre en cours, donc rien ne se relit,
 * rien ne s'exporte, rien ne se modère après coup.
 *
 * Ce choix impose son garde-fou : puisqu'il n'y aura pas de modération a
 * posteriori, le débit est limité en amont — un quota de messages par jour et
 * par joueur, plus un anti-rafale sur la route.
 */

/**
 * Messages qu'un joueur peut écrire dans une journée de guerre.
 *
 * Calibré pour la coordination, pas pour la discussion : 25 messages
 * suffisent largement à annoncer un plan et à répondre à ses camarades, mais
 * ne permettent pas de noyer le fil des vingt autres membres. Le compteur se
 * remet à zéro en même temps que le tchat, à la résolution de minuit.
 */
export const MESSAGES_PAR_JOUR = 25;

/** Messages remontés au client — les plus récents. */
const FENETRE = 100;

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  mine: boolean;
}

/** Mon appartenance de la semaine, ou null si je ne suis pas enrôlé. */
async function membership(userId: string, now: Date) {
  await dbConnect();
  return ClanMember.findOne({ user: oid(userId), season: seasonKey(now) })
    .select('clan')
    .lean<any>();
}

/**
 * Le tchat du jour de mon clan.
 *
 * `since` (date ISO) permet au client de ne demander que ce qu'il n'a pas :
 * une relève toutes les dix secondes ne doit pas retélécharger cent messages.
 */
export async function getChat(
  userId: string,
  since: Date | null = null,
  now: Date = new Date()
): Promise<{
  messages: ChatMessage[];
  day: number;
  remaining: number;
  max: number;
} | null> {
  const me = await membership(userId, now);
  if (!me) return null;

  const season = seasonKey(now);
  const day = warDay(now);

  const filter: any = { clan: me.clan, season, day };
  if (since) filter.createdAt = { $gt: since };

  const [docs, used] = await Promise.all([
    ClanMessage.find(filter)
      .select('user username text createdAt')
      .sort({ createdAt: -1 })
      .limit(FENETRE)
      .lean<any[]>(),
    ClanMessage.countDocuments({ user: oid(userId), season, day })
  ]);

  return {
    // Tri décroissant pour prendre les plus RÉCENTS, remis à l'endroit ici
    messages: docs.reverse().map((d) => ({
      id: d._id.toString(),
      userId: d.user.toString(),
      username: d.username,
      text: d.text,
      createdAt: new Date(d.createdAt).toISOString(),
      mine: d.user.toString() === userId
    })),
    day,
    remaining: Math.max(0, MESSAGES_PAR_JOUR - used),
    max: MESSAGES_PAR_JOUR
  };
}

/** Poster un message dans le tchat de mon clan. */
export async function sendMessage(
  userId: string,
  username: string,
  raw: string,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string; remaining?: number }> {
  const text = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MESSAGE_MAX);

  if (!text) return { success: false, message: 'Message vide' };

  const me = await membership(userId, now);
  if (!me) return { success: false, message: "Tu n'es pas enrôlé cette semaine" };

  const season = seasonKey(now);
  const day = warDay(now);

  const used = await ClanMessage.countDocuments({ user: oid(userId), season, day });
  if (used >= MESSAGES_PAR_JOUR) {
    return {
      success: false,
      message: `Quota atteint : ${MESSAGES_PAR_JOUR} messages par journée de guerre. Le compteur repart à minuit.`
    };
  }

  await ClanMessage.create({
    clan: me.clan,
    season,
    day,
    user: oid(userId),
    username,
    text,
    createdAt: now,
    // Filet de sécurité seulement : la suppression réelle est faite par
    // purgeChat à la résolution de minuit. Ce TTL couvre le cas où la
    // résolution ne tournerait pas — 26 h, soit toujours après le passage
    // du cron, jamais assez pour qu'un message survive à la journée suivante
    // dans l'affichage (qui filtre déjà sur `day`).
    expiresAt: new Date(now.getTime() + 26 * 60 * 60 * 1000)
  });

  return { success: true, remaining: Math.max(0, MESSAGES_PAR_JOUR - used - 1) };
}

/**
 * Efface le tchat d'un clan. Appelé à la résolution de chaque journée : le
 * fil repart vierge tous les matins, et le quota de chacun avec lui.
 */
export async function purgeChat(clanId: mongoose.Types.ObjectId | string) {
  await ClanMessage.deleteMany({ clan: clanId });
}
