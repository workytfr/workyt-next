import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Clan, { type IGate } from '@/models/Clan';
import ClanMember from '@/models/ClanMember';
import ClanDailyResult, { type IWarEvent } from '@/models/ClanDailyResult';
import { seasonKey, weekStart, parisDay } from '@/lib/clanService';
import ClanSoldier from '@/models/ClanSoldier';
import { SOLDIER_BY_KEY } from '@/lib/clanSoldiers';
import {
  WEAR_PER_ASSAULT,
  computeAssault,
  computeDefense,
  resolveGates,
  applyHealing,
  dayOutcome,
  rallyBonusFor,
  computeMultipliers,
  autoHealed,
  phantomSupport,
  phantomSplit,
  weakestGate,
  emptyRoles,
  supportEffects,
  type CombatMember,
  type CombatSide,
  type CombatSoldier,
  type GateOutcome,
  type PhantomSupport
} from '@/lib/clanCombat';
import type { GateName } from '@/models/Clan';

/**
 * Résolution d'une journée de guerre.
 *
 * Tout le CALCUL vit dans clanCombat.ts (fonctions pures, testées par
 * scripts/test-clan-combat.mjs). Ce fichier ne fait que lire l'état, appeler
 * le calcul, et écrire le résultat.
 *
 * Le résultat est FIGÉ dans ClanDailyResult : la page ne recalcule jamais une
 * bataille à l'affichage.
 */

const BONUS_JOURNEE = 100;
const BONUS_PORTE = 150;
/** Ressources gagnées en abattant le donjon adverse. */
const BONUS_DONJON = 400;
/**
 * Journées offertes à qui abat le donjon adverse.
 *
 * On ne termine PAS la guerre : une victoire anticipée le mercredi laisserait
 * quatre jours vides au milieu de la semaine — exactement le problème que la
 * Guerre des Clans est censée résoudre. Trois journées d'un coup rendent
 * l'avance quasi insurmontable sans priver personne de sa fin de semaine.
 */
const DONJON_DAYS = 3;

/** Jour de guerre 1..7 depuis le lundi, en jours civils parisiens. */
export function warDay(now: Date = new Date()): number {
  const start = weekStart(now);
  // Deux repères à minuit UTC : la différence est un nombre entier de jours,
  // insensible au passage à l'heure d'été.
  const diff = Math.round((parisDay(now).getTime() - start.getTime()) / 86400000);
  return Math.min(7, Math.max(1, diff + 1));
}

function toCombatMember(m: any): CombatMember {
  return {
    userId: m.user.toString(),
    role: m.role,
    dailyPoints: m.dailyPoints ?? 0,
    multiplier: m.multiplier ?? 1,
    wounded: !!m.wounded,
    woundedAt: m.woundedAt ?? null,
    gate: m.gate ?? null
  };
}

/**
 * Exporté pour l'Éclaireur : clanService reconstruit le camp ADVERSE avec la
 * même fonction que la résolution, plutôt qu'avec une approximation maison.
 * Une unité de reconnaissance qui mentirait sur la pression réelle vaudrait
 * moins que pas d'unité du tout.
 */
export async function loadSide(clan: any): Promise<CombatSide> {
  const [members, soldierDocs] = await Promise.all([
    ClanMember.find({ clan: clan._id })
      .select('user role dailyPoints multiplier wounded woundedAt gate')
      .lean<any[]>(),
    ClanSoldier.find({ clan: clan._id, cancelled: false })
      .select('type wear gate stance')
      .lean<any[]>()
  ]);

  // Les statistiques sont pondérées par l'usure : une unité à 50 % ne vaut
  // que la moitié de sa fiche.
  const soldiers: CombatSoldier[] = soldierDocs.map((d) => {
    const def = SOLDIER_BY_KEY.get(d.type);
    return {
      id: d._id.toString(),
      type: d.type,
      atk: Math.round(((def?.atk ?? 0) * d.wear) / 100),
      def: Math.round(((def?.def ?? 0) * d.wear) / 100),
      wear: d.wear,
      gate: d.gate ?? null,
      stance: d.stance ?? null,
      gatesOnly: def?.gatesOnly,
      sapper: def?.sapper,
      banner: def?.effect === 'banner',
      effect: def?.effect as CombatSoldier['effect']
    };
  });

  return {
    soldiers,
    clanId: clan._id.toString(),
    members: members.map(toCombatMember),
    gates: clan.gates.map((g: IGate) => ({ ...g })),
    dailyOrder: clan.dailyOrder ?? null,
    buildings: clan.buildings ?? [],
    daysWon: clan.daysWon ?? 0
  };
}

export interface DayResolution {
  resolved: boolean;
  reason?: 'no_clans' | 'already_resolved' | 'no_rival';
  season: string;
  day: number;
  pairs: number;
}

/**
 * Résout la journée écoulée pour tous les clans de la saison.
 * Idempotent : l'index unique {clan, day} empêche un double passage du cron.
 */
export async function resolveDay(now: Date = new Date()): Promise<DayResolution> {
  await dbConnect();

  // On résout la journée qui vient de s'achever : on se replace une minute
  // avant l'instant courant, et la SAISON comme le JOUR se lisent à ce
  // moment-là. Les lire à deux instants différents faisait qu'un passage du
  // lundi 00 h 01 cherchait le jour 7 dans la saison de la semaine qui commence.
  const at = new Date(now.getTime() - 60_000);
  const season = seasonKey(at);
  const day = Math.max(1, warDay(at));
  const base = { season, day, pairs: 0 };

  const clans = await Clan.find({ season, resolved: false }).lean<any[]>();
  if (clans.length === 0) return { resolved: false, reason: 'no_clans', ...base };

  const already = await ClanDailyResult.countDocuments({ season, day });
  if (already > 0) return { resolved: false, reason: 'already_resolved', ...base };

  const byId = new Map(clans.map((c) => [c._id.toString(), c]));
  const done = new Set<string>();
  let pairs = 0;

  for (const clan of clans) {
    const id = clan._id.toString();
    if (done.has(id) || !clan.rival) continue;

    const rival = byId.get(clan.rival.toString());
    if (!rival) continue;

    done.add(id);
    done.add(rival._id.toString());
    await resolvePair(clan, rival, season, day, now);
    pairs++;
  }

  return { resolved: true, season, day, pairs };
}

/* ------------------------------------------------------ un affrontement */

async function resolvePair(clanA: any, clanB: any, season: string, day: number, now: Date) {
  const [sideA, sideB] = await Promise.all([loadSide(clanA), loadSide(clanB)]);

  // Sursaut d'honneur : le clan mené de 3 journées frappe 25 % plus fort
  const rallyA = rallyBonusFor(sideA.daysWon, sideB.daysWon);
  const rallyB = rallyBonusFor(sideB.daysWon, sideA.daysWon);

  // Renfort de sous-effectif : les présents encaissent pour les absents.
  // L'effectif de référence est celui INSCRIT — c'est lui qui a dimensionné
  // les murs — et non le nombre de membres restants.
  const assaultA = computeAssault(sideA, sideB.gates, rallyA);
  const assaultB = computeAssault(sideB, sideA.gates, rallyB);
  const defenseA = computeDefense(sideA, rallyA);
  const defenseB = computeDefense(sideB, rallyB);

  // --- renforts fantômes ---
  //
  // Les places vides — effectif inscrit plus petit qu'en face, ou membres qui
  // n'ont rien marqué — sont tenues par un combattant moyen valorisé sur la
  // moyenne ADVERSE, et plafonné à la moyenne de ses propres présents.
  // Contrairement à un multiplicateur, cet apport est FIXE : il ne grossit pas
  // avec la force du clan, et se saborder ne rapporte jamais rien.
  const effectifA = clanA.memberCount ?? sideA.members.length;
  const effectifB = clanB.memberCount ?? sideB.members.length;
  const actifsA = sideA.members.filter((m) => m.dailyPoints > 0);
  const actifsB = sideB.members.filter((m) => m.dailyPoints > 0);
  const totalA = sideA.members.reduce((s, m) => s + m.dailyPoints, 0);
  const totalB = sideB.members.reduce((s, m) => s + m.dailyPoints, 0);

  const phantomA = phantomSupport(effectifA, effectifB, actifsA, totalB);
  const phantomB = phantomSupport(effectifB, effectifA, actifsB, totalA);

  // Les renforts se rangent où le clan a mis ses forces, et frappent la porte
  // désignée par l'ordre du jour — à défaut, la plus faible encore debout.
  const applique = (
    phantom: { total: number },
    side: CombatSide,
    assault: typeof assaultA,
    defense: Record<GateName, number>,
    enemyGates: typeof sideA.gates,
    rally: number
  ) => {
    if (phantom.total <= 0) return;
    const part = phantomSplit(side.members, phantom.total * rally);
    const cible = side.dailyOrder ?? weakestGate(enemyGates);
    const maPorte = side.dailyOrder ?? weakestGate(side.gates);
    assault.byGate[cible] = Math.round(assault.byGate[cible] + part.assault);
    defense[maPorte] = Math.round(defense[maPorte] + part.defense);
  };

  applique(phantomA, sideA, assaultA, defenseA, sideB.gates, rallyA);
  applique(phantomB, sideB, assaultB, defenseB, sideA.gates, rallyB);

  // A frappe les portes de B, et réciproquement
  const outcomesOnB = resolveGates(assaultA.byGate, defenseB, sideB.gates, sideB.members, sideB.dailyOrder, assaultA.sapperByGate, assaultA.ramByGate);
  const outcomesOnA = resolveGates(assaultB.byGate, defenseA, sideA.gates, sideA.members, sideA.dailyOrder, assaultB.sapperByGate, assaultB.ramByGate);

  // Dégâts sur les portes ENCORE DEBOUT
  const gateDealtA = outcomesOnB.reduce((s, o) => s + o.damage, 0);
  const gateDealtB = outcomesOnA.reduce((s, o) => s + o.damage, 0);

  // Dégâts qui passent par les brèches et frappent le donjon.
  // Sans ce report, un clan ayant enfoncé les trois portes n'infligerait plus
  // rien et perdrait toutes les journées restantes.
  const keepDealtA = outcomesOnB.reduce((s, o) => s + o.keepDamage, 0);
  const keepDealtB = outcomesOnA.reduce((s, o) => s + o.keepDamage, 0);

  const dealtA = gateDealtA + keepDealtA;
  const dealtB = gateDealtB + keepDealtB;

  // Vainqueur au POURCENTAGE de forteresse détruite — annule l'effet de taille.
  // Le donjon entre dans le dénominateur : sinon le ratio exploserait une fois
  // les portes tombées.
  const wallB = sideB.gates.reduce((s, g) => s + g.hpMax, 0) + (clanB.keepHpMax ?? 0) || 1;
  const wallA = sideA.gates.reduce((s, g) => s + g.hpMax, 0) + (clanA.keepHpMax ?? 0) || 1;
  const ratioA = dealtA / wallB;
  const ratioB = dealtB / wallA;
  const verdict = dayOutcome(ratioA, ratioB);

  // Chute des donjons — calculée ici, car le bonus revient à l'ASSAILLANT
  // alors que la perte est encaissée par le défenseur.
  const keepAfterA = Math.max(0, (clanA.keepHp ?? 0) - keepDealtB);
  const keepAfterB = Math.max(0, (clanB.keepHp ?? 0) - keepDealtA);
  const keepFellA = (clanA.keepHp ?? 0) > 0 && keepAfterA === 0;
  const keepFellB = (clanB.keepHp ?? 0) > 0 && keepAfterB === 0;

  await Promise.all([
    persistSide(clanA, sideA, outcomesOnA, assaultA, dealtA, dealtB, ratioA, ratioB,
                verdict.a, rallyA, outcomesOnB, season, day, now,
                keepDealtB, keepDealtA, keepAfterA, keepFellA, keepFellB, phantomA),
    persistSide(clanB, sideB, outcomesOnB, assaultB, dealtB, dealtA, ratioB, ratioA,
                verdict.b, rallyB, outcomesOnA, season, day, now,
                keepDealtA, keepDealtB, keepAfterB, keepFellB, keepFellA, phantomB)
  ]);

  // Le tchat ne survit pas à la journée : les deux fils repartent vierges, et
  // le quota de messages de chacun avec eux. Import dynamique — clanChat
  // importe clanResolution (warDay), un import statique créerait un cycle.
  const { purgeChat } = await import('@/lib/clanChat');
  await Promise.all([purgeChat(clanA._id), purgeChat(clanB._id)]);
}

/* -------------------------------------------------------- persistance */

async function persistSide(
  clan: any,
  side: CombatSide,
  outcomesOnMe: GateOutcome[],
  myAssault: { healPool: number },
  dealt: number,
  taken: number,
  ratioDealt: number,
  ratioTaken: number,
  outcome: 'win' | 'loss' | 'draw',
  rallyBonus: number,
  outcomesOnEnemy: GateOutcome[],
  season: string,
  day: number,
  now: Date,
  /** Dégâts encaissés par MON donjon */
  keepTaken = 0,
  /** Dégâts que j'ai infligés au donjon adverse */
  keepDealt = 0,
  /** PV restants de MON donjon après l'assaut */
  keepHpAfter = 0,
  /** MON donjon est-il tombé aujourd'hui ? */
  myKeepFell = false,
  /** Ai-je abattu le donjon adverse aujourd'hui ? */
  enemyKeepFell = false,
  /** Renforts fantômes accordés à mon camp */
  phantom: PhantomSupport = { count: 0, each: 0, total: 0, fromRoster: 0, fromAbsent: 0 }
) {
  const events: IWarEvent[] = [];
  const support = supportEffects(side.soldiers ?? []);

  if (rallyBonus > 1) {
    events.push({ type: 'rally', message: "Sursaut d'honneur : ton clan frappe 25 % plus fort." });
  }

  if (phantom.count > 0 && phantom.total > 0) {
    const raisons: string[] = [];
    if (phantom.fromAbsent > 0) raisons.push(`${phantom.fromAbsent} absent(s)`);
    if (phantom.fromRoster > 0) raisons.push(`${phantom.fromRoster} place(s) de moins qu'en face`);
    events.push({
      type: 'rally',
      message:
        `Renfort : ${phantom.count} combattant(s) de fortune tiennent les places ` +
        `vides (${raisons.join(', ')}), pour ${Math.round(phantom.total)} de puissance. ` +
        `Ils valent un joueur ordinaire, jamais plus.`
    });
  }

  // Rôles désertés : le clan doit savoir POURQUOI il n'a rien encaissé ni soigné
  const vides = emptyRoles(side.members);
  if (vides.length) {
    const noms: Record<string, string> = {
      attaquant: 'attaquant',
      defenseur: 'défenseur',
      soigneur: 'soigneur'
    };
    events.push({
      type: 'rally',
      message:
        `Aucun ${vides.map((r) => noms[r] ?? r).join(' ni ')} actif aujourd'hui. ` +
        `Changez de rôle, ou recrutez du soutien : un Infirmier relève un blessé chaque nuit.`
    });
  }

  // Ce que mon clan a infligé
  for (const o of outcomesOnEnemy) {
    if (o.damage > 0) {
      events.push({
        type: 'gate_damage',
        gate: o.gate,
        amount: o.damage,
        message: `Ton clan inflige ${o.damage} dégâts à la Porte ${o.gate} adverse.`
      });
    }
    if (o.justFell) {
      events.push({
        type: 'gate_fallen',
        gate: o.gate,
        message: `💥 La Porte ${o.gate} adverse est tombée ! La brèche est ouverte.`
      });
    }
  }

  // Mes portes et mes blessés
  const woundedIds = outcomesOnMe.flatMap((o) => o.woundedUserIds);
  for (const o of outcomesOnMe) {
    if (o.justFell) {
      events.push({
        type: 'gate_fallen',
        gate: o.gate,
        message: `Ta Porte ${o.gate} est tombée.`
      });
    }
  }

  // Soins : les blessés d'abord, le surplus en réparation
  const woundedNow = side.members.filter((m) => m.wounded || woundedIds.includes(m.userId));
  const { healedUserIds, repairLeft } = applyHealing(
    myAssault.healPool,
    woundedNow,
    clan.buildings?.includes('infirmerie')
  );

  // Guérison automatique au bout de 48 h — un clan sans soigneur n'est
  // pas condamné, seulement handicapé.
  const autoIds = autoHealed(side.members, now);

  // Infirmiers de la garnison : un blessé relevé chacun, les plus anciens
  // d'abord. C'est ce qui permet à un clan sans soigneur actif de tenir : le
  // trou laissé par un absent se comble en recrutant.
  const infirmierIds: string[] = [];
  if (support.playerHeals > 0) {
    const dejaSoignes = new Set([...healedUserIds, ...autoIds]);
    const restants = woundedNow
      .filter((m) => !dejaSoignes.has(m.userId))
      .sort((a, b) => (a.woundedAt?.getTime() ?? 0) - (b.woundedAt?.getTime() ?? 0));
    for (const m of restants.slice(0, support.playerHeals)) infirmierIds.push(m.userId);
    if (infirmierIds.length) {
      events.push({
        type: 'player_healed',
        amount: infirmierIds.length,
        message: `⛑️ L'infirmerie de campagne remet ${infirmierIds.length} combattant(s) sur pied.`
      });
    }
  }

  const allHealed = [...new Set([...healedUserIds, ...autoIds, ...infirmierIds])];

  if (woundedIds.length) {
    events.push({
      type: 'player_wounded',
      amount: woundedIds.length,
      message: `${woundedIds.length} défenseur(s) blessé(s) sur les remparts.`
    });
  }
  if (allHealed.length) {
    events.push({
      type: 'player_healed',
      amount: allHealed.length,
      message: `${allHealed.length} coéquipier(s) remis d'aplomb.`
    });
  }

  if (keepDealt > 0) {
    events.push({
      type: 'gate_damage',
      amount: keepDealt,
      message: `Par la brèche, ton clan frappe le donjon adverse pour ${keepDealt} dégâts.`
    });
  }
  if (keepTaken > 0) {
    events.push({
      type: 'player_wounded',
      amount: keepTaken,
      message: `L'ennemi s'engouffre dans la brèche : ton donjon encaisse ${keepTaken} dégâts.`
    });
  }

  // Application des dégâts sur MES portes + réparation du surplus de soin
  const gates: IGate[] = outcomesOnMe.map((o) => ({
    name: o.gate,
    hp: o.hpAfter,
    hpMax: side.gates.find((g) => g.name === o.gate)!.hpMax,
    fallen: o.hpAfter === 0
  }));

  // Forgerons : chacun répare SA porte, celle où il est posté. Une porte
  // tombée ne se répare pas — la brèche reste ouverte pour la semaine.
  for (const g of gates) {
    const repair = support.repairByGate[g.name] ?? 0;
    if (repair <= 0 || g.fallen) continue;
    const before = g.hp;
    g.hp = Math.min(g.hpMax, g.hp + repair);
    const gained = g.hp - before;
    if (gained > 0) {
      events.push({
        type: 'gate_repaired',
        gate: g.name,
        amount: gained,
        message: `🔨 Le forgeron consolide la Porte ${g.name} : +${gained} PV.`
      });
    }
  }

  if (repairLeft > 0) {
    const target = gates.filter((g) => !g.fallen).sort((a, b) => a.hp - b.hp)[0];
    if (target) {
      const before = target.hp;
      target.hp = Math.min(target.hpMax, target.hp + repairLeft);
      const gained = target.hp - before;
      if (gained > 0) {
        events.push({
          type: 'gate_repaired',
          gate: target.name,
          amount: gained,
          message: `Les soigneurs réparent ${gained} PV sur la Porte ${target.name}.`
        });
      }
    }
  }

  events.push({
    type: outcome === 'win' ? 'day_won' : outcome === 'loss' ? 'day_lost' : 'day_draw',
    message:
      outcome === 'win' ? '✅ Journée remportée !'
      : outcome === 'loss' ? 'Journée perdue.'
      : 'Journée nulle.'
  });

  // Bonus de ressources
  let resourceGain = 0;
  if (outcome === 'win') resourceGain += BONUS_JOURNEE;
  resourceGain += outcomesOnEnemy.filter((o) => o.justFell).length * BONUS_PORTE;
  if (enemyKeepFell) resourceGain += BONUS_DONJON;

  // Multiplicateurs du lendemain, depuis les points du JOUR
  const multipliers = computeMultipliers(side.members);

  // --- reprise du commandement ---
  //
  // Le capitaine est désigné à la formation sur l'activité de la semaine
  // PRÉCÉDENTE : rien ne garantit qu'il se connectera cette semaine-ci. Or lui
  // seul recrute, déploie et donne les ordres. Une seule journée blanche et le
  // clan est paralysé, sans aucun moyen de reprise.
  //
  // Le seuil est donc d'UNE journée, pas deux : sur une guerre de sept jours,
  // 48 h d'immobilisme se rattrapent rarement.
  let newCaptainId: string | null = null;
  const capitaine = clan.captain?.toString();
  const capitaineAbsent = !capitaine
    || (side.members.find((m) => m.userId === capitaine)?.dailyPoints ?? 0) === 0;

  if (capitaineAbsent) {
    const releve = [...side.members]
      .filter((m) => m.dailyPoints > 0)
      .sort((a, b) => b.dailyPoints - a.dailyPoints)[0];
    if (releve && releve.userId !== capitaine) {
      newCaptainId = releve.userId;
      events.push({
        type: 'rally',
        message:
          `⚔️ Le capitaine est resté silencieux aujourd'hui : le commandement ` +
          `revient au meilleur combattant de la journée.`
      });
    }
  }

  // --- écritures ---
  //
  // Le rapport est créé MAINTENANT, avant les autres écritures : l'index unique
  // {clan, day} en fait le verrou qui empêche un second passage du cron de
  // recréditer ressources et journées gagnées.
  //
  // Ses `events` sont volontairement incomplets à cet instant — la chute des
  // donjons et les pertes de garnison se calculent plus bas. Ils sont réécrits
  // en fin de fonction. Ne PAS remonter ce create après ces blocs : le verrou
  // sauterait.
  const report = await ClanDailyResult.create({
    clan: clan._id,
    season,
    day,
    date: parisDay(now),
    damageDealt: dealt,
    damageTaken: taken,
    ratioDealt,
    ratioTaken,
    outcome,
    rallyBonus,
    woundedCount: woundedIds.length,
    healedCount: allHealed.length,
    events
  });

  // La chute d'un donjon NE TERMINE PAS la semaine : elle offre 3 journées
  // d'un coup. Décisif, mais personne ne se retrouve avec des jours vides.
  if (myKeepFell) {
    events.push({
      type: 'gate_fallen',
      message: "🏰 Ton donjon est tombé ! L'adversaire empoche 3 journées d'un coup."
    });
  }
  if (enemyKeepFell) {
    events.push({
      type: 'day_won',
      amount: DONJON_DAYS,
      message: `🏰 DONJON ABATTU ! Ton clan empoche ${DONJON_DAYS} journées et ${BONUS_DONJON} ⚒️.`
    });
  }

  const clanSet: any = { gates, dailyOrder: null, keepHp: keepHpAfter };
  if (newCaptainId) clanSet.captain = new mongoose.Types.ObjectId(newCaptainId);

  await Clan.updateOne(
    { _id: clan._id },
    {
      $set: clanSet,
      $inc: {
        daysWon: (outcome === 'win' ? 1 : 0) + (enemyKeepFell ? DONJON_DAYS : 0),
        resources: resourceGain
      }
    }
  );

  // Un seul bulkWrite pour tous les membres : multiplicateur, blessures,
  // guérisons, et remise à zéro des points du jour.
  const ops = side.members.map((m) => {
    const set: any = {
      multiplier: multipliers.get(m.userId) ?? 1,
      dailyPoints: 0,
      gate: null
    };
    if (allHealed.includes(m.userId)) {
      set.wounded = false;
      set.woundedAt = null;
    } else if (woundedIds.includes(m.userId)) {
      set.wounded = true;
      set.woundedAt = now;
    }
    return {
      updateOne: {
        filter: { clan: clan._id, user: new mongoose.Types.ObjectId(m.userId) },
        update: { $set: set }
      }
    };
  });
  if (ops.length) await ClanMember.bulkWrite(ops);

  await wearSoldiers(clan._id, side, outcomesOnMe, outcomesOnEnemy, events, support.soldierHeals);

  // Le rapport reçoit enfin la liste COMPLÈTE : chute des donjons et pertes de
  // garnison ont été ajoutées après sa création. Sans cette réécriture, le
  // joueur voyait son donjon à zéro et sa garnison amputée sans un mot
  // d'explication dans le rapport du matin.
  await ClanDailyResult.updateOne({ _id: report._id }, { $set: { events } });
}

/**
 * Usure de la garnison.
 *
 * Seules les unités ENGAGÉES s'usent — celles restées à la caserne sont
 * intactes. C'est ce qui fait de la réserve une vraie décision : tout
 * déployer chaque jour détruit la garnison en quatre journées.
 */
async function wearSoldiers(
  clanId: any,
  side: CombatSide,
  outcomesOnMe: GateOutcome[],
  outcomesOnEnemy: GateOutcome[],
  events: IWarEvent[],
  /** Unités remises à neuf par les Médecins de camp */
  soldierHeals = 0
) {
  const soldiers = side.soldiers ?? [];
  if (soldiers.length === 0) return;

  // Une porte est « le théâtre d'un assaut » si des dégâts y ont été échangés
  const contested = new Set<string>();
  for (const o of [...outcomesOnMe, ...outcomesOnEnemy]) {
    if (o.assault > 0) contested.add(o.gate);
  }
  // Mes portes tombées : tout ce qui s'y trouvait est perdu, garnison ET soutien
  const lostGates = new Set(outcomesOnMe.filter((o) => o.justFell).map((o) => o.gate));

  const ops: any[] = [];
  /** Unités réellement perdues — c'est d'elles seules qu'on tire la ferraille */
  const destroyedSoldiers: CombatSoldier[] = [];

  for (const s of soldiers) {
    if (!s.gate || s.stance === null) continue; // à la caserne : intacte

    if (lostGates.has(s.gate)) {
      ops.push({ deleteOne: { filter: { _id: new mongoose.Types.ObjectId(s.id) } } });
      destroyedSoldiers.push(s);
      continue;
    }
    if (!contested.has(s.gate)) continue; // déployée mais aucun combat

    const wear = s.wear - WEAR_PER_ASSAULT;
    if (wear <= 0) {
      ops.push({ deleteOne: { filter: { _id: new mongoose.Types.ObjectId(s.id) } } });
      destroyedSoldiers.push(s);
    } else {
      ops.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(s.id) },
          update: { $set: { wear } }
        }
      });
    }
  }

  // Médecins de camp : chacun remet UNE unité à 100 %, la plus abîmée d'abord.
  // Calculé sur l'usure connue en début de nuit — une unité détruite ce soir ne
  // se soigne pas, on l'exclut.
  if (soldierHeals > 0) {
    const perdues = new Set(destroyedSoldiers.map((s) => s.id));
    const soignables = soldiers
      .filter((s) => !perdues.has(s.id) && s.wear < 100)
      .sort((a, b) => a.wear - b.wear)
      .slice(0, soldierHeals);

    for (const s of soignables) {
      ops.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(s.id) },
          update: { $set: { wear: 100 } }
        }
      });
    }
    if (soignables.length) {
      events.push({
        type: 'gate_repaired',
        amount: soignables.length,
        message: `🩺 Le médecin de camp remet ${soignables.length} unité(s) à neuf.`
      });
    }
  }

  // Infirmerie : +10 % à toute la garnison chaque nuit
  if (side.buildings.includes('infirmerie')) {
    ops.push({
      updateMany: {
        filter: { clan: clanId, cancelled: false, wear: { $lt: 100 } },
        update: [{ $set: { wear: { $min: [100, { $add: ['$wear', 10] }] } } }]
      }
    });
  }

  if (ops.length) await ClanSoldier.bulkWrite(ops);

  if (destroyedSoldiers.length > 0) {
    events.push({
      type: 'player_wounded',
      amount: destroyedSoldiers.length,
      message: `${destroyedSoldiers.length} unité(s) de la garnison détruite(s).`
    });
    // Ferraille : 25 % du coût récupéré, une mauvaise décision n'est jamais
    // une perte sèche.
    //
    // ⚠️ Calculée sur les unités RÉELLEMENT détruites. En la calculant sur
    // « tout ce qui portait le nom de la porte tombée », une unité posée sans
    // posture — donc jamais détruite, car ignorée par la boucle ci-dessus —
    // rapportait sa ferraille à chaque chute de porte, indéfiniment.
    const scrap = destroyedSoldiers.reduce(
      (sum, s) => sum + Math.round((SOLDIER_BY_KEY.get(s.type)?.cost ?? 0) * 0.25),
      0
    );
    if (scrap > 0) await Clan.updateOne({ _id: clanId }, { $inc: { resources: scrap } });
  }
}

/* ------------------------------------------------------------ lecture */

/** Le rapport du jour d'un joueur, pour la modale du matin. */
export async function getLatestReport(userId: string, now: Date = new Date()) {
  await dbConnect();

  const season = seasonKey(now);
  const membership = await ClanMember.findOne({
    user: new mongoose.Types.ObjectId(userId),
    season
  })
    .select('clan multiplier wounded')
    .lean<any>();
  if (!membership) return null;

  const report = await ClanDailyResult.findOne({ clan: membership.clan })
    .sort({ day: -1 })
    .lean<any>();
  if (!report) return null;

  const [clan, rivalDoc] = await Promise.all([
    Clan.findById(membership.clan).select('name bannerSeed daysWon gates rival').lean<any>(),
    Clan.findOne({ rival: membership.clan }).select('name bannerSeed daysWon gates').lean<any>()
  ]);

  return {
    day: report.day,
    date: report.date,
    outcome: report.outcome as 'win' | 'loss' | 'draw',
    damageDealt: report.damageDealt,
    damageTaken: report.damageTaken,
    rallyBonus: report.rallyBonus,
    woundedCount: report.woundedCount,
    healedCount: report.healedCount,
    events: report.events,
    myMultiplier: membership.multiplier,
    iAmWounded: membership.wounded,
    clan: clan && { name: clan.name, bannerSeed: clan.bannerSeed, daysWon: clan.daysWon, gates: clan.gates },
    rival: rivalDoc && {
      name: rivalDoc.name,
      bannerSeed: rivalDoc.bannerSeed,
      daysWon: rivalDoc.daysWon,
      gates: rivalDoc.gates
    }
  };
}
