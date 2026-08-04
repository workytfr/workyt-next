import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Clan, { TIERS, gateHpFor, gateHpForOutput, type GateName } from '@/models/Clan';
import ClanMember, { ROLES, type ClanRole } from '@/models/ClanMember';
import UserLeague from '@/models/UserLeague';
import PointTransaction from '@/models/PointTransaction';
import Calendar from '@/models/Calendar';
import { pickClanNames } from '@/lib/clanNames';
// clanCombat ne dépend d'aucun modèle : l'importer ici ne crée pas de cycle.
import { multiplierFor } from '@/lib/clanCombat';

/**
 * Formation des clans de la Guerre des Clans.
 *
 * Principe directeur : LE RANG EST UN TITRE, PAS UNE FILE D'ATTENTE.
 * Chercher les adversaires *dans* le rang d'un joueur condamne les petites
 * populations — quelqu'un se retrouve seul dans son rang. On trie donc tous
 * les actifs par rang, on découpe la liste en clans égaux, et on apparie les
 * clans voisins. Les clans sont ainsi toujours pleins et toujours appariés.
 */

const DOTATION_DEPART = 300;
const GATES: GateName[] = ['nord', 'est', 'sud'];
const MIN_ACTIFS = 4;
const TAILLE_CIBLE = 15;

const oid = (id: string) => new mongoose.Types.ObjectId(id);

/* ---------------------------------------------------------------- saison */

/**
 * Jour civil PARISIEN d'un instant, matérialisé à minuit UTC.
 *
 * ⚠️ Ne jamais revenir à `new Date()` + `getDate()` ici. Les crons de la guerre
 * tirent en `Europe/Paris` (voir instrumentation.ts) alors que le process tourne
 * en UTC sur le VPS. Avec les dates locales, le cron de formation du lundi
 * 00 h 05 Paris s'exécutait le dimanche 22 h 05 UTC : `seasonKey` renvoyait
 * encore la semaine écoulée, `formClans` trouvait ses propres clans et répondait
 * « already_formed ». Plus aucun clan n'était créé, sans la moindre erreur dans
 * les logs.
 *
 * Le repère est en UTC pour que les soustractions de jours soient exactes :
 * deux minuits UTC sont toujours séparés d'un multiple de 86 400 000 ms, ce que
 * l'heure d'été casserait si on manipulait des minuits parisiens.
 */
export function parisDay(date: Date = new Date()): Date {
  // en-CA formate en AAAA-MM-JJ, ce qui évite tout analyse d'un mois en lettres
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Semaine ISO : '2026-W31'. Le lundi ouvre la semaine, heure de Paris. */
export function seasonKey(date: Date = new Date()): string {
  const d = parisDay(date);
  // Jeudi de la semaine courante → détermine l'année ISO
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Lundi de la semaine contenant `date`, en jour civil parisien. */
export function weekStart(date: Date = new Date()): Date {
  const d = parisDay(date);
  const day = d.getUTCDay() || 7; // dimanche = 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

/* ------------------------------------------------------ déclenchement */

/**
 * Un événement est-il programmé dans les 7 jours à venir ?
 * Si oui, pas de guerre : l'événement prend le dessus.
 */
export async function isEventWeek(from: Date = new Date()): Promise<boolean> {
  await dbConnect();

  const start = weekStart(from);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const special = await Calendar.exists({
    date: { $gte: start, $lt: end },
    isSpecial: true
  });
  return !!special;
}

/* ---------------------------------------------------------- actifs */

export interface ActivePlayer {
  userId: string;
  points: number;
  tier: number;
}

/**
 * Joueurs actifs : au moins 1 point gagné dans les 7 derniers jours.
 *
 * Un inactif n'est pas enrôlé du tout — il ne plombe aucun clan et ne
 * descend pas de rang.
 */
export async function getActivePlayers(now: Date = new Date()): Promise<ActivePlayer[]> {
  await dbConnect();

  const since = new Date(now);
  since.setDate(since.getDate() - 7);

  // Seuls les GAINS comptent : un retrait de like ne doit pas pouvoir
  // faire baisser la puissance de quelqu'un (vecteur de sabotage).
  const rows = await PointTransaction.aggregate([
    { $match: { type: 'gain', createdAt: { $gte: since } } },
    { $group: { _id: '$user', points: { $sum: '$points' } } },
    { $match: { points: { $gt: 0 } } }
  ]);

  if (rows.length === 0) return [];

  const ids = rows.map((r: any) => r._id);
  const leagues = await UserLeague.find({ user: { $in: ids } })
    .select('user tier')
    .lean();
  const tierByUser = new Map(
    (leagues as any[]).map((l) => [l.user.toString(), l.tier as number])
  );

  return rows.map((r: any) => ({
    userId: r._id.toString(),
    points: r.points,
    tier: tierByUser.get(r._id.toString()) ?? 1
  }));
}

/* -------------------------------------------------------- répartition */

export interface ClanPlan {
  members: ActivePlayer[];
  tier: number;
}

/**
 * Découpe la liste triée en clans, puis ÉQUILIBRE chaque affrontement.
 *
 * `nbClans` est TOUJOURS PAIR par construction : aucun clan ne peut se
 * retrouver sans adversaire.
 *
 * ⚠️ Deux découpages différents, à ne pas confondre :
 *
 *  1. ENTRE PAIRES, on découpe la liste triée en blocs consécutifs. C'est ce
 *     qui fait qu'on affronte des gens de son niveau, et c'est voulu.
 *
 *  2. DANS une paire, on répartit en SERPENTIN (A, B, B, A, A, B…) au lieu de
 *     couper le bloc en deux. Couper en deux donnait au premier clan les
 *     meilleurs joueurs du bloc et au second les autres : l'affrontement était
 *     joué d'avance, avant même que la semaine commence. Le serpentin fait
 *     alterner les premiers choix, ce qui égalise les deux camps — c'est la
 *     méthode des drafts sportifs, et elle tient en trois lignes.
 */
export function planClans(actives: ActivePlayer[]): ClanPlan[] {
  const n = actives.length;
  if (n < MIN_ACTIFS) return [];

  // Trié par rang décroissant, puis par activité — les meilleurs en tête
  const sorted = [...actives].sort((a, b) => b.tier - a.tier || b.points - a.points);

  const nbClans = Math.max(2, 2 * Math.ceil(n / (2 * TAILLE_CIBLE)));
  const base = Math.floor(n / nbClans);
  const reste = n % nbClans;

  // Taille visée de chaque clan — les `reste` premiers en prennent un de plus
  const tailles = Array.from({ length: nbClans }, (_, i) => base + (i < reste ? 1 : 0));

  const plans: ClanPlan[] = [];
  let cursor = 0;

  for (let i = 0; i < nbClans; i += 2) {
    const tailleA = tailles[i];
    const tailleB = tailles[i + 1] ?? 0;
    const bloc = sorted.slice(cursor, cursor + tailleA + tailleB);
    cursor += tailleA + tailleB;

    const membresA: ActivePlayer[] = [];
    const membresB: ActivePlayer[] = [];

    bloc.forEach((joueur, idx) => {
      // Serpentin : le tour pair sert A puis B, le tour impair sert B puis A.
      const tourPair = Math.floor(idx / 2) % 2 === 0;
      const versA = tourPair ? idx % 2 === 0 : idx % 2 === 1;
      // Si le camp visé est plein, l'autre prend — les tailles restent tenues
      const cible =
        versA
          ? membresA.length < tailleA ? membresA : membresB
          : membresB.length < tailleB ? membresB : membresA;
      cible.push(joueur);
    });

    // Le rang du clan = celui de la paire (deux clans par rang), plafonné à 6
    const tier = Math.min(TIERS.length, Math.floor(i / 2) + 1);
    plans.push({ members: membresA, tier });
    if (tailleB > 0) plans.push({ members: membresB, tier });
  }

  // Les rangs sont numérotés du plus haut au plus bas dans la liste triée :
  // le clan 0 contient les meilleurs joueurs, il doit donc avoir le rang le
  // plus élevé disponible.
  const maxTier = plans[plans.length - 1].tier;
  for (const p of plans) p.tier = maxTier - p.tier + 1;

  return plans;
}

/* ------------------------------------------------------------ formation */

export interface FormationResult {
  created: boolean;
  reason?: 'event_week' | 'truce' | 'already_formed';
  season: string;
  clans: number;
  players: number;
}

/**
 * Crée les clans de la semaine et les apparie.
 * Idempotent : ne fait rien si la saison est déjà formée.
 */
export async function formClans(now: Date = new Date()): Promise<FormationResult> {
  await dbConnect();

  const season = seasonKey(now);
  const base = { season, clans: 0, players: 0 };

  const existing = await Clan.countDocuments({ season });
  if (existing > 0) {
    return { created: false, reason: 'already_formed', ...base, clans: existing };
  }

  if (await isEventWeek(now)) {
    return { created: false, reason: 'event_week', ...base };
  }

  const actives = await getActivePlayers(now);
  const plans = planClans(actives);

  // Moins de 4 actifs : trêve. Pas de bots, pas d'adversaire fantôme.
  if (plans.length === 0) {
    return { created: false, reason: 'truce', ...base, players: actives.length };
  }

  const names = pickClanNames(plans.length);

  // Épaisseur des murs, calibrée sur ce que la PAIRE produit réellement.
  //
  // `points` est le total des 7 derniers jours (getActivePlayers), on le ramène
  // au jour. Les deux adversaires reçoivent la MÊME épaisseur : la journée se
  // joue au pourcentage de forteresse détruite, des murs asymétriques
  // fausseraient la comparaison au profit du clan le plus fort.
  const productionQuotidienne = (p: ClanPlan) =>
    p.members.reduce((s, m) => s + m.points, 0) / 7;

  const hpParPlan: number[] = [];
  for (let i = 0; i < plans.length; i += 2) {
    const a = plans[i];
    const b = plans[i + 1];
    const moyenne = b
      ? (productionQuotidienne(a) + productionQuotidienne(b)) / 2
      : productionQuotidienne(a);
    const hp = gateHpForOutput(moyenne);
    hpParPlan[i] = hp;
    if (b) hpParPlan[i + 1] = hp;
  }

  // 1. Créer les clans
  const docs = await Clan.insertMany(
    plans.map((p, i) => {
      const hp = hpParPlan[i] ?? gateHpFor(p.members.length);
      return {
        season,
        tier: p.tier,
        name: names[i],
        bannerSeed: `${season}-${names[i]}`,
        gates: GATES.map((name) => ({ name, hp, hpMax: hp, fallen: false })),
        keepHp: hp * 2,
        keepHpMax: hp * 2,
        resources: DOTATION_DEPART,
        memberCount: p.members.length
      };
    })
  );

  // 2. Apparier deux à deux — l'ordre garantit des forces comparables
  const pairing: any[] = [];
  for (let i = 0; i < docs.length; i += 2) {
    const a = docs[i], b = docs[i + 1];
    if (!b) break; // impossible, nbClans est pair — garde de sécurité
    pairing.push(
      { updateOne: { filter: { _id: a._id }, update: { $set: { rival: b._id } } } },
      { updateOne: { filter: { _id: b._id }, update: { $set: { rival: a._id } } } }
    );
  }
  if (pairing.length) await Clan.bulkWrite(pairing);

  // 3. Enrôler les membres — une seule écriture
  const members = plans.flatMap((p, i) =>
    p.members.map((m) => ({
      clan: docs[i]._id,
      user: oid(m.userId),
      season,
      role: 'attaquant' as const,
      dailyPoints: 0,
      totalPoints: 0,
      multiplier: 1
    }))
  );
  await ClanMember.insertMany(members, { ordered: false });

  // 4. Capitaine : le meilleur contributeur de la semaine écoulée
  const captains = plans.map((p, i) => {
    const best = [...p.members].sort((a, b) => b.points - a.points)[0];
    return {
      updateOne: {
        filter: { _id: docs[i]._id },
        update: { $set: { captain: oid(best.userId) } }
      }
    };
  });
  await Clan.bulkWrite(captains);

  return { created: true, season, clans: docs.length, players: actives.length };
}

/* ------------------------------------------------- carburant : les points */

/**
 * Crédite les points d'un joueur à son clan.
 *
 * Appelé depuis addPointsWithBoost — donc à CHAQUE gain de point du site.
 * Deux `$inc`, aucune lecture : c'est un chemin très chaud, il doit rester
 * quasi gratuit.
 *
 * « Chaque point compte deux fois » : une fois pour l'assaut du joueur
 * (ClanMember.dailyPoints), une fois pour le trésor du clan (Clan.resources).
 *
 * Ne throw jamais : un échec ici ne doit pas empêcher l'attribution des points.
 */
export async function creditClanPoints(userId: string, points: number): Promise<void> {
  if (points <= 0) return;

  try {
    await dbConnect();
    const season = seasonKey();

    const member = await ClanMember.findOneAndUpdate(
      { user: oid(userId), season },
      { $inc: { dailyPoints: points, totalPoints: points } },
      { new: false, projection: { clan: 1 } }
    ).lean<{ clan: mongoose.Types.ObjectId }>();

    // Joueur non enrôlé (inactif la semaine passée, trêve, semaine d'événement)
    if (!member) return;

    // 1 point = 1 ⚒️ pour le trésor du clan
    await Clan.updateOne({ _id: member.clan }, { $inc: { resources: points } });
  } catch (err) {
    console.error('Erreur creditClanPoints:', err);
  }
}

/* ------------------------------------------------- classements par rôle */

/**
 * Multiplicateur selon la place dans le classement de son rôle.
 *
 * ⚠️ UNE SEULE implémentation, dans clanCombat.ts — le barème y est appliqué à
 * la résolution de minuit, et il est affiché ici sur la page du clan. Les deux
 * doivent dire la même chose : une copie locale finirait par diverger, et
 * l'écart entre le multiplicateur promis et celui reçu serait invisible.
 */
export { multiplierFor };

export interface RoleRanking {
  role: ClanRole;
  entries: Array<{
    userId: string;
    username: string;
    dailyPoints: number;
    totalPoints: number;
    rank: number;
    nextMultiplier: number;
    wounded: boolean;
  }>;
}

/**
 * Classements par rôle d'un clan, sur les points du JOUR.
 *
 * C'est ce classement qui déterminera le multiplicateur du lendemain
 * (appliqué à la résolution de minuit, jalon 3).
 */
export async function getRoleRankings(clanId: string): Promise<RoleRanking[]> {
  await dbConnect();

  const members = await ClanMember.find({ clan: oid(clanId) })
    .populate('user', 'username')
    .select('user role dailyPoints totalPoints wounded')
    .sort({ dailyPoints: -1, totalPoints: -1 })
    .lean<any[]>();

  return ROLES.map((role) => {
    const inRole = members.filter((m) => m.role === role);
    return {
      role,
      entries: inRole.map((m, i) => ({
        userId: m.user?._id?.toString() ?? '',
        username: m.user?.username ?? '—',
        dailyPoints: m.dailyPoints,
        totalPoints: m.totalPoints,
        rank: i,
        nextMultiplier: multiplierFor(i, inRole.length),
        wounded: m.wounded
      }))
    };
  });
}

/* ------------------------------------------------------------- rôle */

/**
 * Change le rôle du joueur pour la journée.
 *
 * ⚠️ Le rôle se FIGE dès le premier point marqué dans la journée.
 *
 * Le classement par rôle est calculé à la résolution de minuit, sur le rôle
 * porté À CET INSTANT et avec les points accumulés depuis le matin. Sans ce
 * gel, la stratégie optimale consistait à marquer ses points sans se soucier
 * du rôle, à regarder les classements vers 23 h 55, puis à basculer vers celui
 * où l'on serait premier pour rafler le ×2. Toute la contribution de la
 * journée suivait le changement.
 *
 * On peut donc changer de rôle autant qu'on veut tant qu'on n'a rien marqué,
 * et le lendemain matin le compteur repart à zéro.
 */
export async function setRole(
  userId: string,
  role: ClanRole,
  now: Date = new Date()
): Promise<{ success: boolean; message?: string }> {
  await dbConnect();

  if (!ROLES.includes(role)) {
    return { success: false, message: 'Rôle invalide' };
  }

  const membership = await ClanMember.findOne({ user: oid(userId), season: seasonKey(now) })
    .select('role dailyPoints')
    .lean<any>();
  if (!membership) return { success: false, message: "Tu n'es pas enrôlé cette semaine" };

  if (membership.role === role) return { success: true };

  if ((membership.dailyPoints ?? 0) > 0) {
    return {
      success: false,
      message:
        'Tu as déjà combattu aujourd\'hui : ton rôle est figé jusqu\'à minuit. ' +
        'Tu pourras en changer demain matin, avant de marquer tes premiers points.'
    };
  }

  await ClanMember.updateOne(
    { user: oid(userId), season: seasonKey(now), dailyPoints: 0 },
    { $set: { role } }
  );
  return { success: true };
}

/* ------------------------------------------------------------- lecture */

/** Le clan du joueur pour la semaine en cours, avec son adversaire. */
export async function getMyClan(userId: string, now: Date = new Date()) {
  await dbConnect();

  const season = seasonKey(now);
  const membership = await ClanMember.findOne({ user: oid(userId), season }).lean<any>();
  if (!membership) return null;

  const clan = await Clan.findById(membership.clan).lean<any>();
  if (!clan) return null;

  const rival = clan.rival ? await Clan.findById(clan.rival).lean<any>() : null;

  const { warDay } = await import('@/lib/clanResolution');
  const { default: ClanDailyResult } = await import('@/models/ClanDailyResult');
  const { default: ClanSoldier } = await import('@/models/ClanSoldier');
  // Import dynamique : clanWeekly importe clanService (seasonKey), un import
  // statique créerait un cycle. Le barème n'est PAS recopié ici — la page doit
  // afficher exactement ce que la résolution du dimanche distribuera.
  const { REWARDS_BY_TIER } = await import('@/lib/clanWeekly');
  const { default: Chest } = await import('@/models/Chest');
  const { withOdds } = await import('@/lib/chestOdds');

  const tierRewards = REWARDS_BY_TIER[clan.tier] ?? REWARDS_BY_TIER[1];

  // Les VRAIS coffres, avec leur table de butin. On ne charge que les types
  // effectivement distribués à ce rang, et on filtre sur `isActive` comme le
  // fait grantChest : un coffre désactivé ne serait pas remis, l'annoncer
  // serait une promesse en l'air.
  const chestTypes = [...new Set([...tierRewards.mvp, ...tierRewards.winner])];
  const chestDocs = await Chest.find({ type: { $in: chestTypes }, isActive: true }).lean<any[]>();
  const chestsByType = new Map(chestDocs.map((c) => [c.type, withOdds(c)]));

  // Éclaireur : c'est lui qui révèle l'ordre du jour adverse. Sans lui, la
  // porte visée par l'ennemi reste inconnue jusqu'au rapport du lendemain.
  const hasScout = !!(await ClanSoldier.exists({
    clan: clan._id,
    type: 'eclaireur',
    cancelled: false
  }));

  const [members, rankings, lastResult] = await Promise.all([
    ClanMember.find({ clan: clan._id })
      .populate('user', 'username')
      .select('user role dailyPoints totalPoints multiplier wounded')
      .sort({ totalPoints: -1 })
      .lean<any[]>(),
    getRoleRankings(clan._id.toString()),
    ClanDailyResult.findOne({ clan: clan._id }).sort({ day: -1 }).select('events day').lean<any>()
  ]);

  // Ma place dans le classement de mon rôle — ce qui décidera de mon
  // multiplicateur demain.
  const myRole = rankings.find((r) => r.role === membership.role);
  const myEntry = myRole?.entries.find((e) => e.userId === userId);

  return {
    season,
    day: warDay(now),
    feed: lastResult?.events ?? [],
    me: {
      role: membership.role,
      dailyPoints: membership.dailyPoints,
      totalPoints: membership.totalPoints,
      /** Multiplicateur ACTIF aujourd'hui (issu du classement d'hier) */
      multiplier: membership.multiplier,
      /** Multiplicateur que je décrocherais si la journée s'arrêtait maintenant */
      nextMultiplier: myEntry?.nextMultiplier ?? 1,
      roleRank: myEntry ? myEntry.rank + 1 : null,
      roleSize: myRole?.entries.length ?? 0,
      wounded: membership.wounded,
      gate: membership.gate ?? null
    },
    rankings,
    clan: {
      id: clan._id.toString(),
      name: clan.name,
      bannerSeed: clan.bannerSeed,
      tier: clan.tier,
      tierName: TIERS[clan.tier - 1],
      gates: clan.gates,
      keepHp: clan.keepHp,
      keepHpMax: clan.keepHpMax,
      daysWon: clan.daysWon,
      resources: clan.resources,
      buildings: clan.buildings,
      memberCount: clan.memberCount,
      dailyOrder: clan.dailyOrder ?? null,
      isCaptain: clan.captain?.toString() === userId
    },
    /**
     * Ce que cette guerre paiera dimanche, au rang ACTUEL du clan.
     * Monter de rang change le butin : l'afficher est ce qui donne un sens
     * matériel à la progression (§10 du CDC).
     *
     * `chests` porte les coffres réels (nom, description, table de butin avec
     * probabilités) ; un type absent de la Map = coffre non seedé ou désactivé,
     * l'UI le signale plutôt que d'inventer un contenu.
     */
    rewards: {
      ...tierRewards,
      chests: Object.fromEntries(chestsByType)
    },
    rival: rival && {
      id: rival._id.toString(),
      name: rival.name,
      bannerSeed: rival.bannerSeed,
      gates: rival.gates,
      keepHp: rival.keepHp,
      keepHpMax: rival.keepHpMax,
      daysWon: rival.daysWon,
      memberCount: rival.memberCount,
      /** Renseigné uniquement si un Éclaireur est en garnison */
      dailyOrder: hasScout ? rival.dailyOrder ?? null : null,
      scouted: hasScout
    },
    members: members.map((m) => ({
      userId: m.user?._id?.toString(),
      username: m.user?.username ?? '—',
      role: m.role,
      dailyPoints: m.dailyPoints,
      totalPoints: m.totalPoints,
      multiplier: m.multiplier,
      wounded: m.wounded
    }))
  };
}
