import mongoose, { Schema, Document, ObjectId } from 'mongoose';

/**
 * Statuts de progression d'une quête
 */
export type QuestProgressStatus = 'in_progress' | 'completed' | 'claimed';

/**
 * Interface représentant la progression d'un utilisateur sur une quête
 */
export interface IQuestProgress extends Document {
  _id: ObjectId;
  user: ObjectId; // Référence à l'utilisateur
  quest: ObjectId; // Référence à la quête
  progress: number; // Progression actuelle (ex: 2/5)
  status: QuestProgressStatus; // Statut de la quête
  periodStart: Date; // Début de la période (jour/semaine/mois)
  periodEnd: Date; // Fin de la période
  completedAt?: Date; // Date de complétion
  claimedAt?: Date; // Date de réclamation des récompenses
  createdAt: Date;
  updatedAt: Date;
}

const QuestProgressSchema = new Schema<IQuestProgress>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quest: {
    type: Schema.Types.ObjectId,
    ref: 'Quest',
    required: true
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'claimed'],
    default: 'in_progress'
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  completedAt: Date,
  claimedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les requêtes
QuestProgressSchema.index({ user: 1, quest: 1, periodStart: 1 }, { unique: true });
QuestProgressSchema.index({ user: 1, status: 1 });
QuestProgressSchema.index({ periodEnd: 1 }); // Pour nettoyer les quêtes expirées

// Middleware pour mettre à jour updatedAt
QuestProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const QuestProgress = mongoose.models.QuestProgress || mongoose.model<IQuestProgress>('QuestProgress', QuestProgressSchema);

export default QuestProgress;

