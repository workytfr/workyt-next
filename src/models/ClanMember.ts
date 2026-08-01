import mongoose, { Schema, Document, Types } from 'mongoose';
import type { GateName } from './Clan';

/**
 * Appartenance d'un joueur à un clan pour une semaine.
 *
 * Porte aussi son compteur de points du jour : c'est cette ligne qui est
 * incrémentée à chaque gain, et non le profil du héros — `HeroProfile.xp` se
 * remet à zéro à chaque montée de niveau et ne peut donc pas servir de score.
 */

export type ClanRole = 'attaquant' | 'defenseur' | 'soigneur';

export const ROLES: ClanRole[] = ['attaquant', 'defenseur', 'soigneur'];

export interface IClanMember extends Document {
  clan: Types.ObjectId;
  user: Types.ObjectId;
  season: string;

  role: ClanRole;
  /** Points gagnés depuis le dernier minuit — remis à zéro à la résolution */
  dailyPoints: number;
  /** Total de la semaine, sert à désigner le MVP */
  totalPoints: number;
  /** Issu du classement de rôle de la veille : 1 · 1,3 · 1,6 · 2 */
  multiplier: number;

  /** Blessé → contribue à 50 % jusqu'à guérison */
  wounded: boolean;
  woundedAt?: Date;

  /** Porte visée (attaquant) ou tenue (défenseur) aujourd'hui */
  gate?: GateName;
  /** Joueur ciblé, uniquement après une brèche */
  focusTarget?: Types.ObjectId;

  createdAt: Date;
}

const ClanMemberSchema = new Schema<IClanMember>({
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  season: { type: String, required: true },

  role: {
    type: String,
    enum: ROLES,
    default: 'attaquant' // ne rien choisir ne doit jamais exclure
  },
  dailyPoints: { type: Number, default: 0, min: 0 },
  totalPoints: { type: Number, default: 0, min: 0 },
  multiplier: { type: Number, default: 1 },

  wounded: { type: Boolean, default: false },
  woundedAt: { type: Date },

  gate: { type: String, enum: ['nord', 'est', 'sud'] },
  focusTarget: { type: Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now }
});

// Un joueur ne peut être que dans un seul clan par semaine
ClanMemberSchema.index({ user: 1, season: 1 }, { unique: true });
// Classement par rôle à l'intérieur d'un clan
ClanMemberSchema.index({ clan: 1, role: 1, dailyPoints: -1 });
// Désignation du MVP
ClanMemberSchema.index({ clan: 1, totalPoints: -1 });

const ClanMember =
  mongoose.models.ClanMember || mongoose.model<IClanMember>('ClanMember', ClanMemberSchema);

export default ClanMember;
