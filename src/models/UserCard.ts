import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Carte hebdomadaire à collectionner du Plateau de l'Aventure.
 * Un utilisateur gagne une carte par semaine du mois lorsqu'il a
 * réclamé toutes les cases de cette semaine sur le plateau (calendrier).
 */
export interface IUserCard extends Document {
  user: Types.ObjectId; // Référence à l'utilisateur
  month: string; // Mois du set au format 'YYYY-MM'
  week: number; // Index de la semaine dans le mois (0-based)
  theme: string; // Thème visuel de la carte (thème dominant de la semaine)
  earnedAt: Date; // Date d'obtention
  createdAt: Date;
}

const UserCardSchema = new Schema<IUserCard>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/
  },
  week: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  theme: {
    type: String,
    default: 'default'
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Une seule carte par utilisateur / mois / semaine
UserCardSchema.index({ user: 1, month: 1, week: 1 }, { unique: true });
UserCardSchema.index({ user: 1, month: 1 });

const UserCard = mongoose.models.UserCard || mongoose.model<IUserCard>('UserCard', UserCardSchema);

export default UserCard;
