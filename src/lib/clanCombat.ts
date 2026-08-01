import type { GateName } from '@/models/Clan';
import type { ClanRole } from '@/models/ClanMember';

/**
 * Cœur de calcul d'une journée de guerre.
 *
 * ⚠️ CE FICHIER NE TOUCHE PAS À MONGO. Toutes les fonctions y sont pures :
 * mêmes entrées → mêmes sorties, aucun effet de bord. C'est ce qui les rend
 * testables (voir scripts/test-clan-combat.mjs), et une erreur de calcul ici
 * corromprait une semaine entière de jeu pour tout le monde.
 */

export const GATES: GateName[] = ['nord', 'est', 'sud'];

/** Un défenseur blessé par tranche de débordement — jamais tous d'un coup. */
export const WOUND_THRESHOLD = 50;
/** Points de soin nécessaires pour relever un coéquipier. */
export const HEAL_COST = 40;
/** Un blessé se remet tout seul au bout de 48 h : un clan sans soigneur
 *  est handicapé, jamais condamné. */
export const AUTO_HEAL_HOURS = 48;
/** Sursaut d'honneur : le clan mené de 3 journées frappe 25 % plus fort. */
export const RALLY_DEFICIT = 3;
export const RALLY_BONUS = 1.25;

export interface CombatMember {
  userId: string;
  role: ClanRole;
  dailyPoints: number;
  /** Issu du classement de rôle de la veille */
  multiplier: number;
  wounded: boolean;
  woundedAt?: Date | null;
  /** Porte choisie ; à défaut on suit l'ordre du capitaine */
  gate?: GateName | null;
}

export interface CombatGate {
  name: GateName;
  hp: number;
  hpMax: number;
  fallen: boolean;
}

export interface CombatSide {
  clanId: string;
  members: CombatMember[];
  gates: CombatGate[];
  /** Porte désignée par le capitaine pour la journée */
  dailyOrder?: GateName | null;
  buildings: string[];
  daysWon: number;
  /** Garnison déployée — absente au jalon 5, présente au jalon 6 */
  soldiers?: CombatSoldier[];
}

/**
 * Contribution effective d'un membre.
 *
 * L'ordre des facteurs est fixé : points bruts, puis puissance héritée du
 * classement, puis pénalité de blessure, puis bonus de coordination, puis
 * sursaut collectif.
 */
export function contribution(
  m: CombatMember,
  followsOrder: boolean,
  rallyBonus: number
): number {
  let v = m.dailyPoints * (m.multiplier || 1);
  if (m.wounded) v *= 0.5;
  if (followsOrder) v *= 1.2;
  return v * rallyBonus;
}

/** Porte effectivement visée : choix explicite, sinon ordre du capitaine,
 *  sinon la porte adverse la plus faible encore debout. */
export function targetGate(
  m: CombatMember,
  order: GateName | null | undefined,
  enemyGates: CombatGate[]
): GateName {
  if (m.gate) return m.gate;
  if (order) return order;
  const standing = enemyGates.filter((g) => !g.fallen);
  // Plus aucune porte debout : on s'engouffre par la première brèche, et les
  // dégâts iront au donjon (voir GateOutcome.keepDamage).
  const pool = standing.length ? standing : enemyGates;
  return pool.reduce((a, b) => (a.hp <= b.hp ? a : b)).name;
}

/** Une unité déployée, telle que le calcul la voit. */
export interface CombatSoldier {
  id: string;
  type: string;
  atk: number;
  def: number;
  wear: number;
  gate: GateName | null;
  stance: 'assaut' | 'garnison' | null;
  gatesOnly?: boolean;
  sapper?: boolean;
  /** Porte-étendard : +10 % aux unités de sa porte */
  banner?: boolean;
  /** Effet des unités de soutien, repris du catalogue */
  effect?: 'reveal' | 'heal_player' | 'heal_soldier' | 'repair' | 'banner';
}

/** PV de porte réparés par un Forgeron chaque nuit, sur la porte où il est posté. */
export const FORGERON_REPAIR = 40;

export interface SupportEffects {
  /** Blessés relevés d'office par les Infirmiers, en plus de la réserve de soin */
  playerHeals: number;
  /** Unités de la garnison remises à 100 % par les Médecins de camp */
  soldierHeals: number;
  /** PV rendus par les Forgerons, porte par porte */
  repairByGate: Record<GateName, number>;
  /** Nombre d'Éclaireurs : au-delà de 0, l'ordre du jour adverse est visible */
  scouts: number;
}

/**
 * Effets des unités de soutien.
 *
 * Ces quatre unités étaient achetables — de 90 à 160 ⚒️ — et ne faisaient
 * RIEN : seul le Porte-étendard était lu par le calcul. C'est aussi la réponse
 * au clan dont un rôle est vide : un Infirmier relève un blessé par jour même
 * sans le moindre soigneur actif.
 *
 * Le Forgeron doit être POSTÉ sur une porte, c'est la sienne qu'il répare — il
 * s'use donc si elle est attaquée. Les autres travaillent depuis le camp.
 */
export function supportEffects(soldiers: CombatSoldier[]): SupportEffects {
  const repairByGate = emptyGates();
  let playerHeals = 0;
  let soldierHeals = 0;
  let scouts = 0;

  for (const s of soldiers) {
    switch (s.effect) {
      case 'heal_player':
        playerHeals++;
        break;
      case 'heal_soldier':
        soldierHeals++;
        break;
      case 'repair':
        if (s.gate) repairByGate[s.gate] += FORGERON_REPAIR;
        break;
      case 'reveal':
        scouts++;
        break;
    }
  }

  return { playerHeals, soldierHeals, repairByGate, scouts };
}

/** Usure infligée à une unité engagée dans un assaut. */
export const WEAR_PER_ASSAULT = 25;

export interface AssaultBreakdown {
  /** Force d'assaut par porte adverse — unités normales */
  byGate: Record<GateName, number>;
  /** Part des sapeurs, résolue séparément : ils ignorent la moitié de la défense */
  sapperByGate: Record<GateName, number>;
  /** Part des béliers : elle frappe la porte, jamais le donjon derrière */
  ramByGate: Record<GateName, number>;
  /** Réserve de soin accumulée par les soigneurs */
  healPool: number;
  total: number;
}

const emptyGates = (): Record<GateName, number> => ({ nord: 0, est: 0, sud: 0 });

/**
 * Bonus de porte-étendard : +10 % aux unités postées sur la même porte.
 *
 * L'étendard doit être ENGAGÉ pour compter. Sans la condition sur la posture,
 * il suffisait de lui assigner une porte sans le mettre en assaut ni en
 * garnison : il donnait son bonus tout en échappant à l'usure, qui ne frappe
 * que les unités engagées.
 */
function bannerBonus(soldiers: CombatSoldier[], gate: GateName): number {
  return soldiers.some((s) => s.banner && s.gate === gate && s.stance !== null) ? 1.1 : 1;
}

/**
 * Force apportée par les unités affectées à l'assaut, par porte visée.
 *
 * Trois flux séparés, car ils ne se résolvent pas de la même façon : les
 * sapeurs ignorent la moitié de la défense, et les béliers ne franchissent
 * jamais une brèche — « c'est une clé, pas une arme ».
 */
export function soldierAssault(soldiers: CombatSoldier[]): {
  normal: Record<GateName, number>;
  sapper: Record<GateName, number>;
  ram: Record<GateName, number>;
} {
  const normal = emptyGates();
  const sapper = emptyGates();
  const ram = emptyGates();

  for (const s of soldiers) {
    if (s.stance !== 'assaut' || !s.gate || s.atk <= 0) continue;
    const value = s.atk * bannerBonus(soldiers, s.gate);
    if (s.gatesOnly) ram[s.gate] += value;
    else if (s.sapper) sapper[s.gate] += value;
    else normal[s.gate] += value;
  }

  for (const g of GATES) {
    normal[g] = Math.round(normal[g]);
    sapper[g] = Math.round(sapper[g]);
    ram[g] = Math.round(ram[g]);
  }
  return { normal, sapper, ram };
}

/** Défense apportée par les unités de garnison, par porte tenue. */
export function soldierDefense(soldiers: CombatSoldier[]): Record<GateName, number> {
  const out = emptyGates();
  for (const s of soldiers) {
    if (s.stance !== 'garnison' || !s.gate || s.def <= 0) continue;
    out[s.gate] += s.def * bannerBonus(soldiers, s.gate);
  }
  for (const g of GATES) out[g] = Math.round(out[g]);
  return out;
}

/**
 * Dégâts sur une porte, en séparant les deux flux d'assaut.
 *
 * Les sapeurs ignorent la moitié de la défense : on ne peut donc pas tout
 * additionner d'un bloc, il faut résoudre chaque flux contre son propre seuil
 * puis sommer.
 */
export function gateDamage(
  normal: number,
  sapper: number,
  defense: number,
  ram = 0
): number {
  return Math.max(0, normal + ram - defense) + Math.max(0, sapper - defense / 2);
}

/** Unités engagées sur une porte donnée — ce sont les seules qui s'usent. */
export function engagedOn(soldiers: CombatSoldier[], gate: GateName): CombatSoldier[] {
  return soldiers.filter((s) => s.gate === gate && s.stance !== null);
}

/** Force d'attaque et réserve de soin d'un camp. */
export function computeAssault(
  side: CombatSide,
  enemyGates: CombatGate[],
  rallyBonus = 1
): AssaultBreakdown {
  const byGate: Record<GateName, number> = { nord: 0, est: 0, sud: 0 };
  let healPool = 0;

  for (const m of side.members) {
    if (m.role === 'soigneur') {
      healPool += contribution(m, false, rallyBonus);
      continue;
    }
    if (m.role !== 'attaquant') continue;

    const g = targetGate(m, side.dailyOrder, enemyGates);
    const follows = !!side.dailyOrder && g === side.dailyOrder;
    byGate[g] += contribution(m, follows, rallyBonus);
  }

  const forge = side.buildings.includes('forge') ? 1.15 : 1;
  const fromSoldiers = soldierAssault(side.soldiers ?? []);
  const sapperByGate = emptyGates();
  const ramByGate = emptyGates();

  for (const g of GATES) {
    byGate[g] = Math.round((byGate[g] + fromSoldiers.normal[g]) * forge);
    sapperByGate[g] = Math.round(fromSoldiers.sapper[g] * forge);
    ramByGate[g] = Math.round(fromSoldiers.ram[g] * forge);
  }

  return {
    byGate,
    sapperByGate,
    ramByGate,
    healPool,
    total: GATES.reduce((s, g) => s + byGate[g] + sapperByGate[g] + ramByGate[g], 0)
  };
}

/** Force de défense par porte. */
export function computeDefense(side: CombatSide, rallyBonus = 1): Record<GateName, number> {
  const byGate: Record<GateName, number> = { nord: 0, est: 0, sud: 0 };

  for (const m of side.members) {
    if (m.role !== 'defenseur') continue;
    const g = m.gate ?? side.dailyOrder ?? weakestGate(side.gates);
    const follows = !!side.dailyOrder && g === side.dailyOrder;
    byGate[g] += contribution(m, follows, rallyBonus);
  }

  const fromSoldiers = soldierDefense(side.soldiers ?? []);
  for (const g of GATES) byGate[g] = Math.round(byGate[g] + fromSoldiers[g]);
  return byGate;
}

export function weakestGate(gates: CombatGate[]): GateName {
  const standing = gates.filter((g) => !g.fallen);
  const pool = standing.length ? standing : gates;
  return pool.reduce((a, b) => (a.hp <= b.hp ? a : b)).name;
}

export interface GateOutcome {
  gate: GateName;
  assault: number;
  defense: number;
  damage: number;
  /**
   * Dégâts qui PASSENT à travers une porte déjà tombée et frappent le donjon.
   *
   * Sans ce report, un clan ayant enfoncé les trois portes n'infligerait plus
   * rien : son ratio tomberait à zéro et il perdrait toutes les journées
   * restantes. Le camp dominant serait puni de sa domination.
   */
  keepDamage: number;
  overflow: number;
  hpBefore: number;
  hpAfter: number;
  justFell: boolean;
  woundedUserIds: string[];
}

/**
 * Applique l'assaut d'un camp sur les portes de l'autre.
 *
 * Les blessés sont **plafonnés** : un défenseur par tranche de 50 de
 * débordement, et jamais le dernier debout. Sans ce plafond, un clan de 4
 * perdait toute sa défense en une seule journée et ne s'en relevait pas.
 */
export function resolveGates(
  assault: Record<GateName, number>,
  defense: Record<GateName, number>,
  gates: CombatGate[],
  defenders: CombatMember[],
  defenderOrder: GateName | null | undefined,
  sapperAssault?: Record<GateName, number>,
  ramAssault?: Record<GateName, number>
): GateOutcome[] {
  return gates.map((g) => {
    const a = assault[g.name] ?? 0;
    const sap = sapperAssault?.[g.name] ?? 0;
    const ram = ramAssault?.[g.name] ?? 0;
    const d = defense[g.name] ?? 0;

    // Porte debout : elle encaisse, béliers compris.
    // Porte tombée : l'assaut s'engouffre dans la brèche et frappe le donjon,
    // MAIS sans les béliers — une porte déjà ouverte ne se défonce pas deux
    // fois. C'est le défaut annoncé sur la fiche de l'unité, et il se paie :
    // un clan tout en béliers ne finit jamais un donjon.
    const raw = gateDamage(a, sap, d, ram);
    const damage = g.fallen ? 0 : raw;
    const keepDamage = g.fallen ? gateDamage(a, sap, d, 0) : 0;
    const overflow = raw;

    const hpAfter = Math.max(0, g.hp - damage);
    const justFell = !g.fallen && hpAfter === 0;

    let woundedUserIds: string[] = [];
    if (overflow > 0 && !g.fallen) {
      const onGate = defenders.filter(
        (m) =>
          m.role === 'defenseur' &&
          !m.wounded &&
          (m.gate ?? defenderOrder ?? weakestGate(gates)) === g.name
      );
      // Toujours laisser au moins un défenseur valide
      const count = Math.min(
        Math.max(0, onGate.length - 1),
        Math.ceil(overflow / WOUND_THRESHOLD)
      );
      woundedUserIds = onGate.slice(0, count).map((m) => m.userId);
    }

    return {
      gate: g.name,
      assault: a,
      defense: d,
      damage,
      keepDamage,
      overflow,
      hpBefore: g.hp,
      hpAfter,
      justFell,
      woundedUserIds
    };
  });
}

/**
 * Emploi de la réserve de soin : relever les blessés d'abord, le surplus
 * part en réparation de porte. Un soigneur d'un clan épargné n'a jamais
 * joué pour rien.
 */
export function applyHealing(
  healPool: number,
  wounded: CombatMember[],
  infirmerie: boolean
): { healedUserIds: string[]; repairLeft: number } {
  const cost = infirmerie ? HEAL_COST / 2 : HEAL_COST;
  let pool = healPool;
  const healedUserIds: string[] = [];

  // Les plus anciennement blessés d'abord
  const ordered = [...wounded].sort(
    (a, b) => (a.woundedAt?.getTime() ?? 0) - (b.woundedAt?.getTime() ?? 0)
  );

  for (const m of ordered) {
    if (pool < cost) break;
    pool -= cost;
    healedUserIds.push(m.userId);
  }

  return { healedUserIds, repairLeft: Math.round(pool) };
}

/**
 * Vainqueur de la journée, au POURCENTAGE de mur détruit.
 *
 * Comparer les dégâts bruts donnerait un avantage mécanique au clan le plus
 * nombreux : il produit plus de points, mais ses murs sont aussi plus épais.
 * Le ratio annule exactement l'effet de taille.
 */
export function dayOutcome(
  ratioA: number,
  ratioB: number
): { a: 'win' | 'loss' | 'draw'; b: 'win' | 'loss' | 'draw' } {
  if (Math.abs(ratioA - ratioB) < 1e-9) return { a: 'draw', b: 'draw' };
  return ratioA > ratioB ? { a: 'win', b: 'loss' } : { a: 'loss', b: 'win' };
}

/** Le clan mené d'au moins 3 journées frappe 25 % plus fort. */
export function rallyBonusFor(myDaysWon: number, rivalDaysWon: number): number {
  return rivalDaysWon - myDaysWon >= RALLY_DEFICIT ? RALLY_BONUS : 1;
}

export interface PhantomSupport {
  /** Nombre de places à combler */
  count: number;
  /** Ce que vaut chacune */
  each: number;
  /** Force totale apportée */
  total: number;
  /** Places dues à un effectif inscrit plus petit que celui d'en face */
  fromRoster: number;
  /** Places dues aux membres inscrits qui n'ont rien marqué aujourd'hui */
  fromAbsent: number;
}

/**
 * Renforts fantômes : les places vides sont tenues par un combattant moyen.
 *
 * ── Pourquoi pas un multiplicateur ──
 * Multiplier la contribution des présents amplifie ce qu'ils produisent déjà :
 * un clan fort touchait une compensation énorme, un clan faible presque rien,
 * alors que le handicap est le même. Pire, la compensation grossissait avec
 * les multiplicateurs de classement, si bien qu'un clan avait intérêt à
 * concentrer son activité sur une seule tête. Un remplaçant à valeur FIXE
 * n'a aucun de ces défauts.
 *
 * ── Ce que vaut un fantôme ──
 * La moyenne par membre du camp ADVERSE : la place vide est tenue par
 * quelqu'un d'aussi ordinaire que ceux d'en face, ce qui annule exactement
 * l'écart d'effectif, ni plus ni moins.
 *
 * ── L'anti-triche ──
 * ⚠️ Sans plafond, ce serait exploitable : un clan faible opposé à un clan
 * fort gagnerait à se saborder, puisque chaque absent serait remplacé par
 * meilleur que lui. Le fantôme est donc plafonné à la moyenne de MES propres
 * présents. Un absent rapporte alors au mieux ce qu'il aurait produit, jamais
 * davantage — se saborder est neutre dans le meilleur des cas, perdant dans
 * tous les autres.
 *
 * @param enrolled       effectif inscrit de mon clan
 * @param rivalEnrolled  effectif inscrit adverse
 * @param myActive       mes membres ayant marqué au moins un point
 * @param rivalDailyTotal points bruts marqués aujourd'hui par tout le camp adverse
 */
export function phantomSupport(
  enrolled: number,
  rivalEnrolled: number,
  myActive: CombatMember[],
  rivalDailyTotal: number
): PhantomSupport {
  const vide: PhantomSupport = { count: 0, each: 0, total: 0, fromRoster: 0, fromAbsent: 0 };

  // Personne pour tenir la ligne : rien à renforcer, zéro reste zéro.
  if (myActive.length === 0) return vide;

  const fromAbsent = Math.max(0, enrolled - myActive.length);
  const fromRoster = Math.max(0, rivalEnrolled - enrolled);
  const count = fromAbsent + fromRoster;
  if (count === 0) return vide;

  const moyenneAdverse = rivalEnrolled > 0 ? rivalDailyTotal / rivalEnrolled : 0;
  const maMoyenne = myActive.reduce((s, m) => s + m.dailyPoints, 0) / myActive.length;

  // Le plafond par ma propre moyenne est TOUT l'anti-triche : voir plus haut.
  const each = Math.max(0, Math.min(moyenneAdverse, maMoyenne));

  return { count, each, total: count * each, fromRoster, fromAbsent };
}

/**
 * Répartition d'un renfort fantôme entre assaut et défense.
 *
 * Un remplaçant se range là où le clan a mis ses forces : on suit la
 * proportion réelle des points marqués par les attaquants et les défenseurs
 * du jour. Un clan sans aucune posture affichée partage moitié-moitié.
 */
export function phantomSplit(
  members: CombatMember[],
  total: number
): { assault: number; defense: number } {
  const somme = (role: ClanRole) =>
    members.filter((m) => m.role === role).reduce((s, m) => s + m.dailyPoints, 0);

  const att = somme('attaquant');
  const def = somme('defenseur');
  const base = att + def;
  const partAtt = base > 0 ? att / base : 0.5;

  // La défense se déduit du reste plutôt que de (1 − part) : la somme des deux
  // vaut alors exactement `total`, sans dérive de virgule flottante.
  const assault = total * partAtt;
  return { assault, defense: total - assault };
}

/**
 * Rôles sans un seul joueur actif dans la journée.
 *
 * Sert à prévenir le clan : un soigneur absent, et personne ne relève les
 * blessés — sauf si la garnison compte un Infirmier. Le trou se comble donc
 * soit en changeant de rôle, soit en recrutant, et le rapport doit le dire.
 */
export function emptyRoles(members: CombatMember[]): ClanRole[] {
  const roles: ClanRole[] = ['attaquant', 'defenseur', 'soigneur'];
  return roles.filter((r) => !members.some((m) => m.role === r && m.dailyPoints > 0));
}

/**
 * Multiplicateur du lendemain selon la place dans le classement de son rôle.
 *
 * Le barème dépend du NOMBRE de joueurs du rôle : seul de son rôle, on est
 * premier d'office — il ne doit donc y avoir aucun bonus.
 */
export function multiplierFor(rank: number, roleSize: number): number {
  if (roleSize <= 1) return 1;
  if (roleSize === 2) return rank === 0 ? 1.3 : 1;
  return [2, 1.6, 1.3][rank] ?? 1;
}

/** Classement par rôle sur les points du jour → multiplicateur du lendemain. */
export function computeMultipliers(members: CombatMember[]): Map<string, number> {
  const out = new Map<string, number>();
  const roles: ClanRole[] = ['attaquant', 'defenseur', 'soigneur'];

  for (const role of roles) {
    const inRole = members
      .filter((m) => m.role === role)
      .sort((a, b) => b.dailyPoints - a.dailyPoints);
    inRole.forEach((m, i) => out.set(m.userId, multiplierFor(i, inRole.length)));
  }
  return out;
}

/** Un blessé depuis plus de 48 h se remet seul. */
export function autoHealed(members: CombatMember[], now: Date): string[] {
  const limit = now.getTime() - AUTO_HEAL_HOURS * 3600_000;
  return members
    .filter((m) => m.wounded && m.woundedAt && m.woundedAt.getTime() <= limit)
    .map((m) => m.userId);
}
