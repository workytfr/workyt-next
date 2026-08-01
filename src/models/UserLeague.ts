import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Rang persistant d'un joueur entre les saisons.
 *
 * C'est la seule donnée de la Guerre des Clans qui survit d'une semaine à
 * l'autre : les clans, eux, sont recréés chaque lundi.
 */
export interface IUserLeague extends Document {
  user: Types.ObjectId;
  /** 1..6 — voir TIERS dans Clan.ts */
  tier: number;
  bestTier: number;
  wins: number;
  losses: number;
  /** Semaines où le joueur a été le meilleur contributeur de son clan */
  mvpCount: number;
  lastSeason?: string;
  updatedAt: Date;
}

const UserLeagueSchema = new Schema<IUserLeague>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tier: { type: Number, default: 1, min: 1, max: 6 },
  bestTier: { type: Number, default: 1, min: 1, max: 6 },
  wins: { type: Number, default: 0, min: 0 },
  losses: { type: Number, default: 0, min: 0 },
  mvpCount: { type: Number, default: 0, min: 0 },
  lastSeason: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

// Tri par rang décroissant lors de la formation des clans
UserLeagueSchema.index({ tier: -1 });

const UserLeague =
  mongoose.models.UserLeague || mongoose.model<IUserLeague>('UserLeague', UserLeagueSchema);

export default UserLeague;
