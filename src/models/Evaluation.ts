import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Question d'évaluation (sous-document pour type "form")
 */
export interface IEvaluationQuestion {
    questionText: string;
    questionType: 'text' | 'multiple_choice' | 'number' | 'file_link';
    options?: string[];
    correctAnswer?: string;
    points: number;
    order: number;
}

/**
 * Banque d'évaluations par cours (max 50 actives par cours)
 */
export interface IEvaluation extends Document {
    _id: ObjectId;
    courseId: ObjectId;
    title: string;
    description: string;
    type: 'form' | 'pdf';
    duration: number;                   // en minutes (5-180)
    pdfUrl?: string;                    // lien externe vers le PDF (si type=pdf)
    questions?: IEvaluationQuestion[];  // questions (si type=form)
    rewardPoints: number;                // points attribués à l'élève (0-500)
    linkedCompetencies: string[];       // skillIds (ex: "C4-MATH-NC-CL-01")
    isActive: boolean;
    createdBy: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EvaluationQuestionSchema = new Schema<IEvaluationQuestion>({
    questionText: { type: String, required: true },
    questionType: {
        type: String,
        enum: ['text', 'multiple_choice', 'number', 'file_link'],
        required: true,
    },
    options: [{ type: String }],
    correctAnswer: { type: String },
    points: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0 },
}, { _id: false });

const EvaluationSchema: Schema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
        type: String,
        enum: ['form', 'pdf'],
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        min: 5,
        max: 180,
    },
    pdfUrl: {
        type: String,
        validate: {
            validator: function (this: IEvaluation, v: string) {
                return this.type !== 'pdf' || (v && v.length > 0);
            },
            message: 'pdfUrl est requis quand le type est pdf',
        },
    },
    questions: {
        type: [EvaluationQuestionSchema],
        validate: {
            validator: function (this: IEvaluation, v: IEvaluationQuestion[]) {
                return this.type !== 'form' || (v && v.length > 0);
            },
            message: 'Les questions sont requises quand le type est form',
        },
    },
    rewardPoints: { type: Number, default: 100, min: 0, max: 500 },
    linkedCompetencies: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

EvaluationSchema.index({ courseId: 1, isActive: 1 });

EvaluationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Evaluation: Model<IEvaluation> =
    mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);

export default Evaluation;
