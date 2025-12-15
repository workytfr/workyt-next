import mongoose, { Schema, Document, ObjectId } from 'mongoose';

/**
 * Types de quêtes
 */
export type QuestType = 'daily' | 'weekly' | 'monthly';

/**
 * Types d'actions pour les conditions de quête
 */
export type QuestActionType = 
  | 'forum_answer'           // Répondre sur le forum
  | 'forum_answer_validated' // Réponse validée sur le forum
  | 'quiz_complete'          // Compléter un quiz
  | 'quiz_score'             // Obtenir un score minimum dans un quiz
  | 'course_complete'        // Terminer un cours
  | 'fiche_create'           // Créer une fiche
  | 'fiche_like_received';   // Recevoir un like sur une fiche

/**
 * Types de récompenses
 */
export type RewardType = 'chest' | 'points' | 'gems';

/**
 * Interface représentant une quête
 */
export interface IQuest extends Document {
  _id: ObjectId;
  slug: string; // Identifiant unique
  name: string; // Nom de la quête
  description: string; // Description de la quête
  type: QuestType; // Type de quête (journalière, hebdomadaire, mensuelle)
  condition: {
    action: QuestActionType; // Type d'action requise
    target: number; // Nombre cible (ex: 3 réponses, 1 cours terminé)
    metadata?: {
      minScore?: number; // Pour les quiz, score minimum requis
      subject?: string; // Pour les fiches, matière spécifique (optionnel)
    };
  };
  rewards: {
    type: RewardType;
    amount?: number; // Pour points et gems
    chestType?: 'common' | 'rare' | 'epic' | 'legendary'; // Pour les coffres
  }[];
  isActive: boolean; // Si la quête est active
  startDate?: Date; // Date de début (pour les quêtes spéciales)
  endDate?: Date; // Date de fin (pour les quêtes spéciales)
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema = new Schema<IQuest>({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  condition: {
    action: {
      type: String,
      enum: [
        'forum_answer',
        'forum_answer_validated',
        'quiz_complete',
        'quiz_score',
        'course_complete',
        'fiche_create',
        'fiche_like_received'
      ],
      required: true
    },
    target: {
      type: Number,
      required: true,
      min: 1
    },
    metadata: {
      minScore: Number,
      subject: String
    }
  },
  rewards: [{
    type: {
      type: String,
      enum: ['chest', 'points', 'gems'],
      required: true
    },
    amount: {
      type: Number,
      min: 0
    },
    chestType: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: Date,
  endDate: Date,
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
QuestSchema.index({ type: 1, isActive: 1 });
QuestSchema.index({ slug: 1 });

// Middleware pour mettre à jour updatedAt
QuestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Quest = mongoose.models.Quest || mongoose.model<IQuest>('Quest', QuestSchema);

export default Quest;

