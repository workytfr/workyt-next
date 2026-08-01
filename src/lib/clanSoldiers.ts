import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Clan from '@/models/Clan';
import ClanMember from '@/models/ClanMember';
import ClanSoldier from '@/models/ClanSoldier';
import {
  SOLDIER_BY_KEY,
  GARRISON_PER_MEMBER,
  CATEGORY_CAP,
  CATEGORY_FREE_UNITS,
  CANCELLABLE_ABOVE,
  CANCEL_WINDOW_MS
} from '@/lib/clanSoldierCatalog';
import type { GateName } from '@/models/Clan';
import { seasonKey, parisDay } from '@/lib/clanService';

/**
 * La garnison : catalogue, recrutement, déploiement.
 *
 * Les garde-fous retenus après simulation (§7.4 du CDC) :
 *  - PAS de plafond de dépense quotidien — il coûtait 15 à 20 points de
 *    gaspillage aux clans honnêtes pour n'économiser que 400 ⚒️ face à un troll
 *  - plafond de GARNISON à 2 unités par joueur — le vrai régulateur
 *  - plafond par CATÉGORIE : 50 % des achats du jour sur un même type
 *  - fenêtre d'ANNULATION de 12 h sur tout achat de plus de 150 ⚒️
 */

export {
  SOLDIER_CATALOG,
  SOLDIER_BY_KEY,
  GARRISON_PER_MEMBER,
  CATEGORY_CAP,
  CATEGORY_FREE_UNITS,
  CANCELLABLE_ABOVE,
  CANCEL_WINDOW_MS,
  type SoldierDef
} from '@/lib/clanSoldierCatalog';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

/**
 * Début de la journée de jeu, en heure de Paris.
 *
 * Le plafond par catégorie porte sur « les achats du jour » : ce jour doit être
 * celui que voient les élèves, pas celui du fuseau du serveur — sinon la remise
 * à zéro tombe à 1 h ou 2 h du matin.
 */
function startOfDay(d = new Date()) {
  // Décalage de Paris à cet instant (+1 h ou +2 h selon l'heure d'été). Les
  // deux dates sont analysées dans le fuseau du serveur, qui s'annule donc.
  const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
  const paris = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const offsetMs = paris.getTime() - utc.getTime();

  // parisDay donne le jour civil parisien à minuit UTC ; on retranche le
  // décalage pour obtenir l'instant réel de minuit à Paris.
  return new Date(parisDay(d).getTime() - offsetMs);
}

/* ----------------------------------------------------------- lecture */

export async function getGarrison(clanId: string) {
  await dbConnect();
  const soldiers = await ClanSoldier.find({ clan: oid(clanId), cancelled: false })
    .sort({ purchasedAt: 1 })
    .lean<any[]>();

  const now = Date.now();
  return soldiers.map((s) => {
    const def = SOLDIER_BY_KEY.get(s.type);
    return {
      id: s._id.toString(),
      type: s.type,
      name: def?.name ?? s.type,
      emoji: def?.emoji ?? '⬜',
      image: def?.image ?? null,
      kind: def?.kind ?? 'combat',
      atk: Math.round(((def?.atk ?? 0) * s.wear) / 100),
      def: Math.round(((def?.def ?? 0) * s.wear) / 100),
      wear: s.wear,
      gate: s.gate ?? null,
      stance: s.stance ?? null,
      cost: s.cost,
      /** Annulable tant que la fenêtre de 12 h n'est pas écoulée */
      cancellable: s.cost > CANCELLABLE_ABOVE && now - new Date(s.purchasedAt).getTime() < CANCEL_WINDOW_MS
    };
  });
}

/* --------------------------------------------------------- recrutement */

export interface BuyResult {
  success: boolean;
  message?: string;
  soldierId?: string;
  resourcesLeft?: number;
}

export async function buySoldier(
  userId: string,
  type: string,
  now: Date = new Date()
): Promise<BuyResult> {
  await dbConnect();

  const def = SOLDIER_BY_KEY.get(type);
  if (!def) return { success: false, message: 'Unité inconnue' };

  const season = seasonKey(now);
  const membership = await ClanMember.findOne({ user: oid(userId), season })
    .select('clan')
    .lean<any>();
  if (!membership) return { success: false, message: "Tu n'es pas enrôlé cette semaine" };

  const clan = await Clan.findById(membership.clan).lean<any>();
  if (!clan) return { success: false, message: 'Clan introuvable' };
  if (clan.captain?.toString() !== userId) {
    return { success: false, message: 'Seul le capitaine recrute' };
  }

  // --- plafond de garnison ---
  const garrisonMax = clan.memberCount * GARRISON_PER_MEMBER;
  const current = await ClanSoldier.countDocuments({ clan: clan._id, cancelled: false });
  if (current >= garrisonMax) {
    return { success: false, message: `Garnison pleine (${garrisonMax} unités maximum)` };
  }

  // --- plafond par catégorie : 50 % des UNITÉS du jour sur un même type ---
  const todays = await ClanSoldier.find({
    clan: clan._id,
    cancelled: false,
    purchasedAt: { $gte: startOfDay(now) }
  })
    .select('type')
    .lean<any[]>();

  const sameTypeAfter = todays.filter((x) => x.type === type).length + 1;
  const totalAfter = todays.length + 1;
  if (sameTypeAfter > CATEGORY_FREE_UNITS && sameTypeAfter / totalAfter > CATEGORY_CAP) {
    return {
      success: false,
      message:
        `Tu as déjà ${sameTypeAfter - 1} ${def.name}(s) aujourd'hui. ` +
        `Au-delà de ${CATEGORY_FREE_UNITS}, il faut varier : recrute autre chose d'abord.`
    };
  }

  // --- débit atomique : la condition fait partie de l'écriture ---
  const debited = await Clan.findOneAndUpdate(
    { _id: clan._id, resources: { $gte: def.cost } },
    { $inc: { resources: -def.cost } },
    { new: true, projection: { resources: 1 } }
  ).lean<any>();
  if (!debited) return { success: false, message: 'Trésor insuffisant' };

  const soldier = await ClanSoldier.create({
    clan: clan._id,
    season,
    type,
    wear: 100,
    purchasedBy: oid(userId),
    purchasedAt: now,
    cost: def.cost
  });

  return { success: true, soldierId: soldier._id.toString(), resourcesLeft: debited.resources };
}

/**
 * Annulation d'un achat — n'importe quel membre, pendant 12 h.
 *
 * Remplace le plafond de dépense quotidien : liberté tactique totale, mais
 * rien d'irréversible. Un capitaine compétent peut monter une grosse garnison
 * d'un coup ; un troll voit ses achats annulés dans la demi-journée.
 */
export async function cancelPurchase(
  userId: string,
  soldierId: string,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string }> {
  await dbConnect();

  const season = seasonKey(now);
  const membership = await ClanMember.findOne({ user: oid(userId), season })
    .select('clan')
    .lean<any>();
  if (!membership) return { success: false, message: "Tu n'es pas enrôlé" };

  if (!mongoose.isValidObjectId(soldierId)) {
    return { success: false, message: 'Achat introuvable' };
  }

  // Diagnostic d'abord, pour un message utile — mais il ne décide de rien.
  const soldier = await ClanSoldier.findOne({
    _id: oid(soldierId),
    clan: membership.clan,
    cancelled: false
  })
    .select('cost purchasedAt wear')
    .lean<any>();
  if (!soldier) return { success: false, message: 'Achat introuvable' };

  if (soldier.cost <= CANCELLABLE_ABOVE) {
    return { success: false, message: 'Cet achat est trop modeste pour être contesté' };
  }
  if (now.getTime() - new Date(soldier.purchasedAt).getTime() > CANCEL_WINDOW_MS) {
    return { success: false, message: "La fenêtre d'annulation de 12 h est écoulée" };
  }
  if (soldier.wear < 100) {
    return { success: false, message: 'Cette unité a déjà combattu' };
  }

  // L'annulation est ATOMIQUE : `cancelled: false` fait partie de la condition
  // d'écriture. Deux membres qui contestent le même achat en même temps ne
  // peuvent donc pas le rembourser deux fois — le second ne modifie rien.
  const cancelled = await ClanSoldier.findOneAndUpdate(
    { _id: oid(soldierId), clan: membership.clan, cancelled: false, wear: 100 },
    { $set: { cancelled: true } }
  ).lean<any>();
  if (!cancelled) return { success: false, message: 'Achat déjà annulé' };

  await Clan.updateOne({ _id: membership.clan }, { $inc: { resources: cancelled.cost } });

  return { success: true };
}

/* --------------------------------------------------------- déploiement */

export async function deploySoldiers(
  userId: string,
  assignments: Array<{ soldierId: string; gate: GateName | null; stance: 'assaut' | 'garnison' | null }>,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string; updated?: number }> {
  await dbConnect();

  const season = seasonKey(now);
  const membership = await ClanMember.findOne({ user: oid(userId), season })
    .select('clan')
    .lean<any>();
  if (!membership) return { success: false, message: "Tu n'es pas enrôlé" };

  const clan = await Clan.findById(membership.clan).select('captain').lean<any>();
  if (clan?.captain?.toString() !== userId) {
    return { success: false, message: 'Seul le capitaine déploie la garnison' };
  }

  const ops = assignments
    .filter((a) => mongoose.isValidObjectId(a.soldierId))
    .map((a) => {
      // Porte ET posture, ou rien. Une porte sans posture créait une unité
      // fantôme : postée, mais ignorée par l'usure et par les pertes.
      const gate = a.gate && a.stance ? a.gate : null;
      return {
        updateOne: {
          filter: { _id: oid(a.soldierId), clan: membership.clan, cancelled: false },
          // gate null = caserne : l'unité ne s'use pas
          update: { $set: { gate, stance: gate ? a.stance : null } }
        }
      };
    });

  if (!ops.length) return { success: true, updated: 0 };
  const r = await ClanSoldier.bulkWrite(ops);
  return { success: true, updated: r.modifiedCount };
}

/** Ordre du jour du capitaine — les membres qui le suivent gagnent +20 %. */
export async function setDailyOrder(
  userId: string,
  gate: GateName | null,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string }> {
  await dbConnect();

  const season = seasonKey(now);
  const membership = await ClanMember.findOne({ user: oid(userId), season })
    .select('clan')
    .lean<any>();
  if (!membership) return { success: false, message: "Tu n'es pas enrôlé" };

  const clan = await Clan.findById(membership.clan).select('captain').lean<any>();
  if (clan?.captain?.toString() !== userId) {
    return { success: false, message: 'Seul le capitaine donne les ordres' };
  }

  await Clan.updateOne(
    { _id: membership.clan },
    { $set: { dailyOrder: gate, dailyOrderAt: now } }
  );
  return { success: true };
}

/** Porte visée (attaquant) ou tenue (défenseur) par un joueur. */
export async function setMyGate(
  userId: string,
  gate: GateName | null,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string }> {
  await dbConnect();

  const updated = await ClanMember.findOneAndUpdate(
    { user: oid(userId), season: seasonKey(now) },
    { $set: { gate } },
    { new: true }
  );
  if (!updated) return { success: false, message: "Tu n'es pas enrôlé cette semaine" };
  return { success: true };
}
