import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

export interface ISubmissionAnswer {
    questionIndex: number;
    answer: string;
}

export type SubmissionStatus = 'pending_review' | 'graded';

/**
 * Soumission d'un élève pour une évaluation.
 * Liée 1:1 au tirage (drawId unique).
 */
export interface IEvaluationSubmission extends Document {
    _id: ObjectId;
    drawId: ObjectId;
    userId: ObjectId;
    courseId: ObjectId;
    evaluationId: ObjectId;
    type: 'form' | 'pdf';
    answers?: ISubmissionAnswer[];      // si type=form
    submittedPdfUrl?: string;           // lien externe si type=pdf (legacy)
    submittedFiles?: string[];          // URLs R2 des photos/fichiers soumis
    timeSpent: number;                  // en secondes
    submittedAt: Date;
    status: SubmissionStatus;
    grade?: number;                     // 0-20, rempli après correction
    createdAt: Date;
    updatedAt: Date;
}

const SubmissionAnswerSchema = new Schema<ISubmissionAnswer>({
    questionIndex: { type: Number, required: true },
    answer: { type: String, required: true },
}, { _id: false });

const EvaluationSubmissionSchema: Schema = new Schema({
    drawId: {
        type: Schema.Types.ObjectId,
        ref: 'EvaluationDraw',
        required: true,
        unique: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    evaluationId: {
        type: Schema.Types.ObjectId,
        ref: 'Evaluation',
        required: true,
    },
    type: {
        type: String,
        enum: ['form', 'pdf'],
        required: true,
    },
    answers: [SubmissionAnswerSchema],
    submittedPdfUrl: { type: String },
    submittedFiles: [{ type: String }],
    timeSpent: { type: Number, required: true, min: 0 },
    submittedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['pending_review', 'graded'],
        default: 'pending_review',
        index: true,
    },
    grade: {
        type: Number,
        min: 0,
        max: 20,
        default: undefined,
    },
}, {
    timestamps: true,
});

// Pour les helpers : lister les soumissions en attente
EvaluationSubmissionSchema.index({ status: 1, submittedAt: 1 });

const EvaluationSubmission: Model<IEvaluationSubmission> =
    mongoose.models.EvaluationSubmission ||
    mongoose.model<IEvaluationSubmission>('EvaluationSubmission', EvaluationSubmissionSchema);

export default EvaluationSubmission;
