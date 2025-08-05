import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Interface représentant une completion de quiz
 */
export interface IQuizCompletion extends Document {
    userId: ObjectId;
    quizId: ObjectId;
    courseId: ObjectId;
    sectionId: ObjectId;
    score: number; // Score obtenu (points gagnés)
    maxScore: number; // Score maximum possible
    answers: {
        questionIndex: number;
        userAnswer: any; // Réponse de l'utilisateur
        isCorrect: boolean;
        pointsEarned: number;
    }[];
    completedAt: Date;
    timeSpent?: number; // Temps passé en secondes (optionnel)
}

/**
 * Schéma de completion de quiz
 */
const QuizCompletionSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    answers: [{
        questionIndex: { type: Number, required: true },
        userAnswer: { type: Schema.Types.Mixed, required: true },
        isCorrect: { type: Boolean, required: true },
        pointsEarned: { type: Number, required: true, min: 0 }
    }],
    completedAt: { type: Date, default: Date.now },
    timeSpent: { type: Number, min: 0 } // Temps en secondes
});

// Index pour éviter les doublons et optimiser les requêtes
QuizCompletionSchema.index({ userId: 1, quizId: 1 }, { unique: true });
QuizCompletionSchema.index({ userId: 1, courseId: 1 });
QuizCompletionSchema.index({ userId: 1, sectionId: 1 });

const QuizCompletion: Model<IQuizCompletion> = 
    mongoose.models.QuizCompletion || mongoose.model<IQuizCompletion>('QuizCompletion', QuizCompletionSchema);

export default QuizCompletion; 