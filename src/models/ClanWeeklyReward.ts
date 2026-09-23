import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Ce qu'un joueur a gagné à la fin d'une guerre de clans.
 *
 * Les coffres sont ouverts côté serveur le dimanche à minuit : le gain est
 * appliqué tout de suite, sans quoi un joueur absent perdrait sa récompense.
 * On garde donc ici le RÉSULTAT, pour pouvoir le rejouer — animation comprise —
 * à sa prochaine visite. Sans ça, on gagne une guerre sans jamais voir ce
 * qu'elle a rapporté.
 */

export interface IClanLoot {
  /** Type de coffre ouvert : common, rare, epic, legendary */
  chestType: string;
  rewardType: string;
  amount?: number;
  cosmeticType?: string;
  cosmeticId?: string;
}

export interface IClanWeeklyReward extends Document {
  user: Types.ObjectId;
  clan: Types.ObjectId;
  season: string;
  clanName: string;
  rivalName?: string;
  outcome: 'win' | 'loss' | 'draw';
  isMvp: boolean;
  daysWon: number;
  rivalDaysWon: number;
  tier: number;
  tierName?: string;
  /** Coffres ouverts, dans l'ordre */
  loot: IClanLoot[];
  /** Points de compensation (clan perdant) */
  points: number;
  /** Part du trésor non dépensé, rendue en points */
  leftover: number;
  /** Variation de rang : +1, 0 ou -1 */
  tierDelta: number;
  seenAt?: Date;
  createdAt: Date;
}

const LootSchema = new Schema<IClanLoot>(
  {
    chestType: { type: String, required: true },
    rewardType: { type: String, required: true },
    amount: { type: Number },
    cosmeticType: { type: String },
    cosmeticId: { type: String }
  },
  { _id: false }
);

const ClanWeeklyRewardSchema = new Schema<IClanWeeklyReward>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  season: { type: String, required: true },
  clanName: { type: String, required: true },
  rivalName: { type: String },
  outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true },
  isMvp: { type: Boolean, default: false },
  daysWon: { type: Number, default: 0 },
  rivalDaysWon: { type: Number, default: 0 },
  tier: { type: Number, default: 1 },
  tierName: { type: String },
  loot: { type: [LootSchema], default: [] },
  points: { type: Number, default: 0 },
  leftover: { type: Number, default: 0 },
  tierDelta: { type: Number, default: 0 },
  seenAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Une seule ligne par joueur et par saison : la résolution est idempotente.
ClanWeeklyRewardSchema.index({ user: 1, season: 1 }, { unique: true });
ClanWeeklyRewardSchema.index({ user: 1, seenAt: 1 });

const ClanWeeklyReward =
  mongoose.models.ClanWeeklyReward ||
  mongoose.model<IClanWeeklyReward>('ClanWeeklyReward', ClanWeeklyRewardSchema);

export default ClanWeeklyReward;
