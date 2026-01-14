import mongoose, { Schema, Document, ObjectId } from 'mongoose';

/**
 * Interface représentant une réclamation de récompense du calendrier
 */
export interface ICalendarClaim extends Document {
  _id: ObjectId;
  user: ObjectId; // Référence à l'utilisateur
  calendar: ObjectId; // Référence au jour du calendrier
  date: Date; // Date de la réclamation (sans heure)
  rewardType: 'points' | 'gems' | 'chest';
  rewardAmount?: number; // Optionnel pour les coffres car ils donnent des récompenses variables
  claimedAt: Date;
  createdAt: Date;
}

const CalendarClaimSchema = new Schema<ICalendarClaim>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calendar: {
    type: Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  rewardType: {
    type: String,
    enum: ['points', 'gems', 'chest'],
    required: true
  },
  rewardAmount: {
    type: Number,
    min: 0
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les requêtes - un utilisateur ne peut réclamer qu'une fois par jour
CalendarClaimSchema.index({ user: 1, date: 1 }, { unique: true });
CalendarClaimSchema.index({ user: 1, calendar: 1 });
CalendarClaimSchema.index({ date: 1 });

const CalendarClaim = mongoose.models.CalendarClaim || mongoose.model<ICalendarClaim>('CalendarClaim', CalendarClaimSchema);

export default CalendarClaim;

