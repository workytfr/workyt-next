import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import ClanMember from '@/models/ClanMember';
import ClanMessage from '@/models/ClanMessage';
import { seasonKey } from '@/lib/clanService';
import { warDay } from '@/lib/clanResolution';
import { SOLDIER_BY_KEY } from '@/lib/clanSoldierCatalog';
import {
  GATE_VALUES,
  ROLE_VALUES,
  TEMPLATE_BY_KEY,
  renderChatMessage,
  type ChatSlots
} from '@/lib/clanChatTemplates';

/**
 * Le tchat de clan — éphémère et sans saisie libre.
 *
 * Il sert à une seule chose : permettre à un clan de se coordonner dans la
 * journée. Rien n'est conservé au-delà de la journée de guerre en cours, donc
 * rien ne se relit, rien ne s'exporte, rien ne se modère après coup.
 *
 * Ce choix impose ses garde-fous, et il y en a trois :
 *   1. Aucun texte rédigé. Un joueur choisit une phrase du catalogue et
 *      remplit ses emplacements avec des valeurs fermées (voir
 *      clanChatTemplates). C'est ici que ça se VALIDE — le client ne fait que
 *      proposer, il ne décide de rien.
 *   2. Le membre visé doit appartenir au MÊME clan. Sans cette vérification,
 *      le tchat deviendrait un moyen de désigner n'importe quel compte du
 *      site depuis un fil qu'aucun modérateur ne relira.
 *   3. Un quota de messages par jour et par joueur, plus un anti-rafale sur
 *      la route.
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
  /** Phrase déjà rendue — le client n'a rien à recomposer */
  text: string;
  /** Membre visé, pour le mettre en avant s'il s'agit de moi */
  targetUserId: string | null;
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
      .select('user username template targetUser targetUsername gate soldier soldierName role createdAt')
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
      // Le texte est RECONSTRUIT ici, jamais lu depuis la base : même une
      // ligne écrite avant ce catalogue ne peut afficher que ce qu'il permet.
      text: renderChatMessage(d.template, {
        memberName: d.targetUsername,
        gate: d.gate,
        soldierName: d.soldierName,
        role: d.role
      }),
      targetUserId: d.targetUser ? d.targetUser.toString() : null,
      createdAt: new Date(d.createdAt).toISOString(),
      mine: d.user.toString() === userId
    })),
    day,
    remaining: Math.max(0, MESSAGES_PAR_JOUR - used),
    max: MESSAGES_PAR_JOUR
  };
}

/** Ce que le client propose — rien n'est repris sans être revérifié. */
export interface SendInput {
  template: string;
  memberId?: string | null;
  gate?: string | null;
  soldier?: string | null;
  role?: string | null;
}

/**
 * Poster un message dans le tchat de mon clan.
 *
 * Toute la sûreté du tchat tient dans cette fonction : elle n'accepte qu'une
 * clé du catalogue, exige EXACTEMENT les emplacements que la phrase déclare,
 * et résout chaque valeur contre une source de vérité (les membres du clan,
 * les portes, le catalogue d'unités). Un client modifié ne peut rien faire
 * passer de plus qu'un client normal.
 */
export async function sendMessage(
  userId: string,
  username: string,
  input: SendInput,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string; remaining?: number }> {
  const def = TEMPLATE_BY_KEY.get(String(input?.template ?? ''));
  if (!def) return { success: false, message: 'Message inconnu' };

  const me = await membership(userId, now);
  if (!me) return { success: false, message: "Tu n'es pas enrôlé cette semaine" };

  const season = seasonKey(now);
  const day = warDay(now);

  // --- Résolution des emplacements, un par un ---
  const slots: ChatSlots = {};

  if (def.slots.includes('member')) {
    // Le membre visé doit être dans MON clan. C'est la vérification qui
    // empêche de désigner un compte quelconque du site.
    const target = await ClanMember.findOne({
      clan: me.clan,
      user: oid(String(input.memberId ?? '')),
      season
    })
      .populate('user', 'username')
      .select('user')
      .lean<any>();

    if (!target?.user) {
      return { success: false, message: "Ce membre n'est pas dans ton clan" };
    }
    slots.memberId = target.user._id.toString();
    slots.memberName = target.user.username ?? '—';
  }

  if (def.slots.includes('gate')) {
    if (!GATE_VALUES.includes(input.gate as any)) {
      return { success: false, message: 'Porte invalide' };
    }
    slots.gate = input.gate;
  }

  if (def.slots.includes('soldier')) {
    const unit = SOLDIER_BY_KEY.get(String(input.soldier ?? ''));
    if (!unit) return { success: false, message: 'Unité inconnue' };
    slots.soldier = unit.key;
    slots.soldierName = unit.name;
  }

  if (def.slots.includes('role')) {
    if (!ROLE_VALUES.includes(input.role as any)) {
      return { success: false, message: 'Rôle invalide' };
    }
    slots.role = input.role;
  }

  /**
   * Anti-répétition : la MÊME phrase avec les MÊMES valeurs, une seule fois
   * par journée et par joueur.
   *
   * Le catalogue fermé empêche d'écrire quoi que ce soit de blessant, mais pas
   * de marteler vingt-cinq fois « Bravo @X » jusqu'à épuisement du quota — ce
   * qui reste du harcèlement, avec des phrases aimables. La comparaison porte
   * sur les emplacements résolus, donc « Je vise la porte nord » puis « Je vise
   * la porte sud » passent : c'est bien une information nouvelle. Répéter
   * l'identique, non.
   *
   * Les deux vérifications partent ensemble : elles sont indépendantes, et
   * l'envoi ne doit pas payer deux allers-retours.
   */
  const doublonFilter: any = {
    user: oid(userId),
    season,
    day,
    template: def.key,
    // `null` couvre l'absence du champ ET sa valeur nulle : un emplacement non
    // utilisé par la phrase ne doit pas faire échouer la comparaison.
    targetUser: slots.memberId ? oid(slots.memberId) : null,
    gate: slots.gate ?? null,
    soldier: slots.soldier ?? null,
    role: slots.role ?? null
  };

  const [used, doublon] = await Promise.all([
    ClanMessage.countDocuments({ user: oid(userId), season, day }),
    ClanMessage.exists(doublonFilter)
  ]);

  if (used >= MESSAGES_PAR_JOUR) {
    return {
      success: false,
      message: `Quota atteint : ${MESSAGES_PAR_JOUR} messages par journée de guerre. Le compteur repart à minuit.`
    };
  }

  if (doublon) {
    return {
      success: false,
      message: 'Tu as déjà envoyé ce message aujourd’hui.'
    };
  }

  await ClanMessage.create({
    clan: me.clan,
    season,
    day,
    user: oid(userId),
    username,
    template: def.key,
    targetUser: slots.memberId ? oid(slots.memberId) : undefined,
    targetUsername: slots.memberName ?? undefined,
    gate: slots.gate ?? undefined,
    soldier: slots.soldier ?? undefined,
    soldierName: slots.soldierName ?? undefined,
    role: slots.role ?? undefined,
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
