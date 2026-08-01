import mongoose, { Schema, Document, Types } from 'mongoose';
import type { GateName } from './Clan';

/**
 * Résultat figé d'une journée de guerre.
 *
 * ⚠️ La bataille est calculée UNE FOIS, à minuit, et stockée ici. La page ne
 * la recalcule jamais à l'affichage : sans ça, deux joueurs ouvrant la page
 * verraient des chiffres différents, et le rapport du matin changerait à
 * chaque rafraîchissement.
 */

export type WarEventType =
  | 'gate_damage'
  | 'gate_fallen'
  | 'player_wounded'
  | 'player_healed'
  | 'gate_repaired'
  | 'day_won'
  | 'day_lost'
  | 'day_draw'
  | 'rally';

export interface IWarEvent {
  type: WarEventType;
  /** Texte prêt à afficher dans le fil de guerre */
  message: string;
  gate?: GateName;
  amount?: number;
  user?: Types.ObjectId;
}

export interface IClanDailyResult extends Document {
  clan: Types.ObjectId;
  season: string;
  /** Jour de la guerre, 1 à 7 */
  day: number;
  /** Minuit du jour résolu */
  date: Date;

  damageDealt: number;
  damageTaken: number;
  /** Part du mur adverse détruite ce jour — c'est ELLE qui décide du vainqueur,
   *  et non les dégâts bruts : sinon le clan le plus nombreux gagne d'office. */
  ratioDealt: number;
  ratioTaken: number;

  outcome: 'win' | 'loss' | 'draw';
  /** Bonus de sursaut d'honneur appliqué ce jour (1 ou 1.25) */
  rallyBonus: number;

  woundedCount: number;
  healedCount: number;

  events: IWarEvent[];
  createdAt: Date;
}

const WarEventSchema = new Schema<IWarEvent>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    gate: { type: String, enum: ['nord', 'est', 'sud'] },
    amount: { type: Number },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const ClanDailyResultSchema = new Schema<IClanDailyResult>({
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  season: { type: String, required: true },
  day: { type: Number, required: true, min: 1, max: 7 },
  date: { type: Date, required: true },

  damageDealt: { type: Number, default: 0 },
  damageTaken: { type: Number, default: 0 },
  ratioDealt: { type: Number, default: 0 },
  ratioTaken: { type: Number, default: 0 },

  outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true },
  rallyBonus: { type: Number, default: 1 },

  woundedCount: { type: Number, default: 0 },
  healedCount: { type: Number, default: 0 },

  events: { type: [WarEventSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Une seule résolution par clan et par jour — protège d'un double passage du cron
ClanDailyResultSchema.index({ clan: 1, day: 1 }, { unique: true });
ClanDailyResultSchema.index({ season: 1, day: 1 });

const ClanDailyResult =
  mongoose.models.ClanDailyResult ||
  mongoose.model<IClanDailyResult>('ClanDailyResult', ClanDailyResultSchema);

export default ClanDailyResult;
