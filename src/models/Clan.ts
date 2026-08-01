import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Un clan pour une semaine de Guerre des Clans.
 *
 * Les clans sont recréés chaque semaine : ils ne persistent pas. Ce qui
 * persiste, c'est le rang du joueur (voir UserLeague).
 */

export type GateName = 'nord' | 'est' | 'sud';

export interface IGate {
  name: GateName;
  hp: number;
  hpMax: number;
  fallen: boolean;
}

export interface IClan extends Document {
  /** Semaine ISO, ex. '2026-W31' — clé de regroupement */
  season: string;
  /** Rang 1..6 (voir TIERS) */
  tier: number;
  name: string;
  /** Graine du blason — l'identifiant du document, figé à la création */
  bannerSeed: string;
  /** Clan adverse de la semaine */
  rival?: Types.ObjectId;

  gates: IGate[];
  keepHp: number;
  keepHpMax: number;

  /** Journées remportées sur les 7 */
  daysWon: number;
  /** Trésor ⚒️ courant */
  resources: number;
  /** Bâtiments construits (clés du catalogue) */
  buildings: string[];

  captain?: Types.ObjectId;
  /** Porte désignée par l'ordre du jour, si publié */
  dailyOrder?: GateName;
  dailyOrderAt?: Date;

  memberCount: number;
  /** true dès que la guerre de la semaine est résolue */
  resolved: boolean;

  createdAt: Date;
}

/** Rangs, du plus bas au plus haut. L'index + 1 est le `tier`. */
export const TIERS = [
  'Hameau de Bronze',
  "Bourg d'Argent",
  "Cité d'Or",
  'Forteresse de Saphir',
  "Citadelle d'Émeraude",
  'Trône de Diamant'
] as const;

/**
 * PV d'une porte — proportionnels à l'effectif.
 *
 * ⚠️ Repli uniquement. L'effectif n'est qu'un indicateur indirect de ce qu'un
 * clan produit : quinze inscrits qui marquent 2 points par jour n'entament
 * jamais 525 PV. Voir gateHpForOutput, qui calibre sur la contribution réelle.
 */
export const GATE_HP_PER_MEMBER = 35;

export function gateHpFor(memberCount: number): number {
  return Math.max(70, GATE_HP_PER_MEMBER * memberCount);
}

/** PV plancher : en dessous, une porte tomberait dans la première heure. */
export const GATE_HP_MIN = 70;

/**
 * Combien de PV pour un point produit par jour.
 *
 * Calibré pour qu'une forteresse entière — 3 portes + un donjon à 2× — tombe
 * en 5 à 6 journées de domination franche, et une porte isolée en un peu plus
 * d'une journée d'assaut concentré.
 *
 * Le calcul : sur une journée, environ 60 % des présents attaquent et 30 %
 * défendent, avec ~1,4 de bonus moyen (classement de rôle + ordre du jour).
 * Les dégâts nets valent donc à peu près (0,6 − 0,3) × 1,4 ≈ 0,42 fois la
 * production du clan. À 0,6 PV par point quotidien, la forteresse fait
 * 5 × 0,6 = 3 fois la production journalière, soit ≈ 7 jours pour la raser en
 * frappant toujours au bon endroit. Un clan qui éparpille ses assauts met plus
 * longtemps : c'est exactement la décision tactique qu'on veut préserver.
 */
export const HP_PAR_POINT_QUOTIDIEN = 0.6;

/**
 * PV d'une porte d'après la production QUOTIDIENNE d'un clan.
 *
 * ⚠️ À n'appeler qu'avec la moyenne des DEUX clans d'une paire. Donner à
 * chacun des murs taillés sur sa propre production amplifierait l'écart au
 * lieu de le corriger : la journée se joue au POURCENTAGE de forteresse
 * détruite, donc le clan faible frapperait des murs épais — ratio minuscule —
 * pendant que le fort frapperait des murs fins. Le fort gagnerait encore plus
 * largement. Murs identiques des deux côtés, toujours.
 *
 * Effet de bord heureux : personne ne gagne à se saborder la semaine d'avant
 * pour obtenir des murs fins, puisque des murs fins profitent d'abord à
 * l'adversaire.
 */
export function gateHpForOutput(dailyPoints: number): number {
  return Math.max(GATE_HP_MIN, Math.round(HP_PAR_POINT_QUOTIDIEN * dailyPoints));
}

const GateSchema = new Schema<IGate>(
  {
    name: { type: String, enum: ['nord', 'est', 'sud'], required: true },
    hp: { type: Number, required: true, min: 0 },
    hpMax: { type: Number, required: true, min: 1 },
    fallen: { type: Boolean, default: false }
  },
  { _id: false }
);

const ClanSchema = new Schema<IClan>({
  season: { type: String, required: true },
  tier: { type: Number, required: true, min: 1, max: 6 },
  name: { type: String, required: true },
  bannerSeed: { type: String, required: true },
  rival: { type: Schema.Types.ObjectId, ref: 'Clan' },

  gates: { type: [GateSchema], required: true },
  keepHp: { type: Number, required: true },
  keepHpMax: { type: Number, required: true },

  daysWon: { type: Number, default: 0, min: 0 },
  resources: { type: Number, default: 0, min: 0 },
  buildings: { type: [String], default: [] },

  captain: { type: Schema.Types.ObjectId, ref: 'User' },
  dailyOrder: { type: String, enum: ['nord', 'est', 'sud'] },
  dailyOrderAt: { type: Date },

  memberCount: { type: Number, required: true, min: 1 },
  resolved: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

// « Les clans de la semaine », et le classement par rang
ClanSchema.index({ season: 1, tier: 1 });
// Une seule fois par nom et par saison (le tirage évite déjà les doublons)
ClanSchema.index({ season: 1, name: 1 }, { unique: true });

const Clan = mongoose.models.Clan || mongoose.model<IClan>('Clan', ClanSchema);

export default Clan;
