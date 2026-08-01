import mongoose, { Schema, Document, Types } from 'mongoose';
import type { GateName } from './Clan';

/**
 * Une unité de la garnison d'un clan.
 *
 * Les unités appartiennent au CLAN, pas à un joueur. Elles survivent d'un jour
 * à l'autre pendant toute la semaine, et sont détruites par l'usure ou par la
 * chute de leur porte.
 */

export type SoldierKind = 'combat' | 'soutien';

export interface IClanSoldier extends Document {
  clan: Types.ObjectId;
  season: string;
  /** Clé du catalogue (voir SOLDIER_CATALOG) */
  type: string;
  /** Statistiques restantes, en pourcentage — 100 à la sortie de la caserne */
  wear: number;
  /** Affectation du jour. `null` = à la caserne : l'unité ne s'use pas. */
  gate?: GateName | null;
  /** 'assaut' frappe les portes adverses, 'garnison' défend les siennes */
  stance: 'assaut' | 'garnison' | null;

  /** Qui a acheté, et quand — support de la fenêtre d'annulation de 12 h */
  purchasedBy: Types.ObjectId;
  purchasedAt: Date;
  cost: number;
  cancelled: boolean;
}

const ClanSoldierSchema = new Schema<IClanSoldier>({
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  season: { type: String, required: true },
  type: { type: String, required: true },
  wear: { type: Number, default: 100, min: 0, max: 100 },
  gate: { type: String, enum: ['nord', 'est', 'sud', null], default: null },
  stance: { type: String, enum: ['assaut', 'garnison', null], default: null },

  purchasedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purchasedAt: { type: Date, default: Date.now },
  cost: { type: Number, required: true },
  cancelled: { type: Boolean, default: false }
});

// La garnison d'un clan, et le plafond par catégorie sur la journée
ClanSoldierSchema.index({ clan: 1, cancelled: 1 });
ClanSoldierSchema.index({ clan: 1, purchasedAt: -1 });

const ClanSoldier =
  mongoose.models.ClanSoldier || mongoose.model<IClanSoldier>('ClanSoldier', ClanSoldierSchema);

export default ClanSoldier;
