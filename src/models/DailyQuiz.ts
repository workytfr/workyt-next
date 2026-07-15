import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Quiz du jour — une seule question QCM par date.
 *
 * Rien à voir avec le modèle Quiz (quiz de cours, rattaché à une section/leçon).
 * Celui-ci est déposé par les bénévoles depuis le dashboard, publié sur Discord
 * par le bot, et joué sur le site pour débloquer la récompense du calendrier.
 */
export interface IDailyQuiz extends Document {
    date: Date; // Jour de publication, normalisé à minuit (unique)
    question: string;
    answers: string[]; // Exactement 4 propositions
    correctAnswer: number; // Index dans answers (0-3)
    explanation?: string; // Affiché après la réponse sur le site
    author: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DailyQuizSchema = new Schema<IDailyQuiz>({
    date: {
        type: Date,
        required: true,
        unique: true // crée déjà l'index : pas de `index: true` en plus
    },
    question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500 // Tient dans la description d'un embed Discord
    },
    answers: {
        type: [String],
        required: true,
        validate: [
            {
                validator: (v: string[]) => v.length === 4,
                message: 'Un quiz du jour doit avoir exactement 4 propositions'
            },
            {
                validator: (v: string[]) => v.every(a => a.trim().length > 0 && a.length <= 80),
                message: 'Chaque proposition doit être non vide et faire 80 caractères maximum'
            },
            {
                validator: (v: string[]) => new Set(v.map(a => a.trim())).size === v.length,
                message: 'Les propositions doivent être différentes les unes des autres'
            }
        ]
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    explanation: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

DailyQuizSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const DailyQuiz: Model<IDailyQuiz> =
    mongoose.models.DailyQuiz || mongoose.model<IDailyQuiz>('DailyQuiz', DailyQuizSchema);

export default DailyQuiz;
