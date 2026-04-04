import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

export type DrawStatus = 'drawn' | 'in_progress' | 'submitted' | 'timeout';

/**
 * Enregistrement du tirage aléatoire d'une évaluation.
 * Index unique sur (userId, courseId, trimester, schoolYear) pour garantir
 * qu'un élève ne passe qu'une seule évaluation par trimestre par cours.
 */
export interface IEvaluationDraw extends Document {
    _id: ObjectId;
    userId: ObjectId;
    courseId: ObjectId;
    evaluationId: ObjectId;
    trimester: 'T1' | 'T2' | 'T3';
    schoolYear: string;                 // "2025-2026"
    drawnAt: Date;
    mustSubmitBefore: Date;             // deadline = drawnAt + evaluation.duration
    status: DrawStatus;
    submissionId?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EvaluationDrawSchema: Schema = new Schema({
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
        index: true,
    },
    evaluationId: {
        type: Schema.Types.ObjectId,
        ref: 'Evaluation',
        required: true,
    },
    trimester: {
        type: String,
        enum: ['T1', 'T2', 'T3'],
        required: true,
    },
    schoolYear: {
        type: String,
        required: true,
    },
    drawnAt: { type: Date, default: Date.now },
    mustSubmitBefore: { type: Date, required: true },
    status: {
        type: String,
        enum: ['drawn', 'in_progress', 'submitted', 'timeout'],
        default: 'drawn',
        index: true,
    },
    submissionId: {
        type: Schema.Types.ObjectId,
        ref: 'EvaluationSubmission',
        default: undefined,
    },
}, {
    timestamps: true,
});

// Empêche les doublons : 1 évaluation par trimestre par cours par élève
EvaluationDrawSchema.index(
    { userId: 1, courseId: 1, trimester: 1, schoolYear: 1 },
    { unique: true }
);

// Pour le cron de timeout : trouver les draws expirés
EvaluationDrawSchema.index({ status: 1, mustSubmitBefore: 1 });

const EvaluationDraw: Model<IEvaluationDraw> =
    mongoose.models.EvaluationDraw || mongoose.model<IEvaluationDraw>('EvaluationDraw', EvaluationDrawSchema);

export default EvaluationDraw;
