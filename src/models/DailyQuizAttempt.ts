import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Tentative d'un utilisateur sur le quiz du jour, côté site.
 *
 * Une seule ligne par utilisateur et par jour : les nouveaux essais mettent à jour
 * la ligne existante. Une fois isCorrect à true, la ligne est figée — c'est elle
 * qui autorise la réclamation de la récompense du calendrier (voir calendarService).
 *
 * Les réponses données sur Discord ne passent pas par ici : le bot gère sa propre
 * économie de points dans sa base MySQL.
 */
export interface IDailyQuizAttempt extends Document {
    user: Types.ObjectId;
    dailyQuiz: Types.ObjectId;
    date: Date; // Normalisée à minuit, dupliquée depuis DailyQuiz pour l'index
    answerIndex: number; // Dernière réponse donnée
    isCorrect: boolean;
    attemptCount: number;
    firstAttemptAt: Date;
    solvedAt?: Date;
}

const DailyQuizAttemptSchema = new Schema<IDailyQuizAttempt>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dailyQuiz: {
        type: Schema.Types.ObjectId,
        ref: 'DailyQuiz',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    answerIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    isCorrect: {
        type: Boolean,
        required: true,
        default: false
    },
    attemptCount: {
        type: Number,
        default: 1,
        min: 1
    },
    firstAttemptAt: {
        type: Date,
        default: Date.now
    },
    solvedAt: {
        type: Date
    }
});

// Un utilisateur n'a qu'une ligne par jour
DailyQuizAttemptSchema.index({ user: 1, date: 1 }, { unique: true });
DailyQuizAttemptSchema.index({ dailyQuiz: 1 });

const DailyQuizAttempt: Model<IDailyQuizAttempt> =
    mongoose.models.DailyQuizAttempt ||
    mongoose.model<IDailyQuizAttempt>('DailyQuizAttempt', DailyQuizAttemptSchema);

export default DailyQuizAttempt;
