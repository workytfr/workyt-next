import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Types possibles pour une question
 */
export type QuestionType = 'QCM' | 'Réponse courte' | 'Vrai/Faux' | 'Texte à trous' | 'Classement' | 'Glisser-déposer' | 'Slider' | 'Code';

/**
 * Interface pour une question du quiz
 */
export interface IQuestion {
    question: string;
    questionType: QuestionType; // Type de question
    questionPic?: string; // Image associée (optionnel)
    answerSelectionType: 'single' | 'multiple'; // QCM = single, Association = multiple
    answers: string[]; // Options de réponse
    correctAnswer: number | number[] | string; // Index ou réponse texte
    messageForCorrectAnswer?: string; // Message pour bonne réponse
    messageForIncorrectAnswer?: string; // Message pour mauvaise réponse
    explanation?: string; // Explication facultative
    point: number; // Points attribués
}

/**
 * Interface représentant un quizz
 */
/**
 * Configuration du bonus/malus temps (optionnel)
 */
export interface ITimeBonus {
    enabled: boolean;
    targetTime: number;       // Temps cible en secondes (bonus si terminé avant)
    bonusPercent: number;     // % de bonus (ex: 15 = +15%)
}

export interface ITimePenalty {
    enabled: boolean;
    maxTime: number;          // Temps max en secondes (malus si dépassé)
    penaltyPercentPerMin: number; // % de malus par minute de dépassement
    maxPenaltyPercent: number;    // Plafond du malus (ex: 50 = -50% max)
}

export interface IQuiz extends Document {
    sectionId?: ObjectId; // Peut être rattaché à une section
    lessonId?: ObjectId; // Peut être rattaché à une leçon
    title: string; // Titre du quiz
    description?: string; // Brève description du quiz
    questions: IQuestion[]; // Liste des questions
    competencies?: string[]; // Liste des skillIds des compétences validées par ce quiz
    timeBonus?: ITimeBonus;
    timePenalty?: ITimePenalty;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Schéma du quiz
 */
const QuizSchema: Schema = new Schema({
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: false },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: false },
    title: { type: String, required: true },
    description: { type: String },
    competencies: [{ type: String }], // Skill IDs from CurriculumNode
    questions: [
        {
            question: { type: String, required: true },
            questionType: {
                type: String,
                enum: ['QCM', 'Réponse courte', 'Vrai/Faux', 'Texte à trous', 'Classement', 'Glisser-déposer', 'Slider', 'Code'],
                required: true
            },
            questionPic: { type: String },
            answerSelectionType: { type: String, enum: ['single', 'multiple'], required: true },
            answers: [{ type: String, required: true }],
            correctAnswer: { type: Schema.Types.Mixed, required: true }, // Peut être un nombre, une liste ou une string
            messageForCorrectAnswer: { type: String },
            messageForIncorrectAnswer: { type: String },
            explanation: { type: String },
            point: { type: Number, required: true }
        }
    ],
    timeBonus: {
        enabled: { type: Boolean, default: false },
        targetTime: { type: Number, default: 0 },
        bonusPercent: { type: Number, default: 0 }
    },
    timePenalty: {
        enabled: { type: Boolean, default: false },
        maxTime: { type: Number, default: 0 },
        penaltyPercentPerMin: { type: Number, default: 0 },
        maxPenaltyPercent: { type: Number, default: 50 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export default Quiz;
