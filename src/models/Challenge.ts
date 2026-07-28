import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Défi au quiz entre deux amis.
 *
 * ⚠️ Les questions sont FIGÉES à la création (snapshot), pas référencées.
 * Trois raisons :
 *  1. les deux joueurs affrontent exactement les mêmes questions, même si un
 *     admin édite le quiz source entre-temps ;
 *  2. on lit un seul document au lieu de N quiz à chaque tour ;
 *  3. le second joueur ne peut pas aller lire les réponses dans le quiz source.
 *
 * `correctAnswer` ne doit JAMAIS sortir vers le client avant que le joueur ait
 * répondu — voir la projection dans challengeService.getPlayableChallenge.
 */
export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'declined' | 'expired';

export interface IChallengeQuestion {
  question: string;
  answers: string[];
  correctAnswer: number;
  point: number;
}

export interface IChallengeAnswer {
  index: number;
  answerIndex: number;
  isCorrect: boolean;
  timeMs: number;
}

export interface IChallengeSide {
  answers: IChallengeAnswer[];
  score: number;
  totalTimeMs: number;
  finishedAt?: Date;
}

export interface IChallenge extends Document {
  challenger: Types.ObjectId;
  opponent: Types.ObjectId;
  status: ChallengeStatus;
  matiere?: string | null;
  /** Niveau de calibrage : moyenne des niveaux de héros des deux joueurs */
  level: number;
  secondsPerQuestion: number;
  questions: IChallengeQuestion[];
  results: {
    challenger: IChallengeSide;
    opponent: IChallengeSide;
  };
  /** null = égalité ; défini seulement quand status === 'completed' */
  winner?: Types.ObjectId | null;
  xpAwarded: boolean;
  startedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const emptySide = () => ({ answers: [], score: 0, totalTimeMs: 0 });

const AnswerSchema = new Schema<IChallengeAnswer>(
  {
    index: { type: Number, required: true },
    answerIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    timeMs: { type: Number, default: 0 }
  },
  { _id: false }
);

const SideSchema = new Schema<IChallengeSide>(
  {
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    totalTimeMs: { type: Number, default: 0 },
    finishedAt: { type: Date }
  },
  { _id: false }
);

const QuestionSchema = new Schema<IChallengeQuestion>(
  {
    question: { type: String, required: true },
    answers: { type: [String], required: true },
    correctAnswer: { type: Number, required: true },
    point: { type: Number, default: 1 }
  },
  { _id: false }
);

const ChallengeSchema = new Schema<IChallenge>({
  challenger: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'declined', 'expired'],
    default: 'pending',
    required: true
  },
  matiere: { type: String, default: null },
  level: { type: Number, default: 1 },
  secondsPerQuestion: { type: Number, default: 30 },
  questions: { type: [QuestionSchema], required: true },
  results: {
    challenger: { type: SideSchema, default: emptySide },
    opponent: { type: SideSchema, default: emptySide }
  },
  winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  xpAwarded: { type: Boolean, default: false },
  startedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// « Mes défis » dans les deux sens
ChallengeSchema.index({ challenger: 1, status: 1, createdAt: -1 });
ChallengeSchema.index({ opponent: 1, status: 1, createdAt: -1 });
// Nettoyage automatique par Mongo : aucun cron à écrire
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Challenge =
  mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);

export default Challenge;
