import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Correction d'une soumission d'évaluation.
 * Peut être manuelle (helper) ou automatique (timeout → 0/20).
 */
export interface IEvaluationGrade extends Document {
    _id: ObjectId;
    submissionId: ObjectId;
    evaluatorId?: ObjectId;             // null si correction auto (timeout)
    grade: number;                      // 0-20
    feedback: string;
    photoLinks: string[];               // liens externes (Imgur, Drive, etc.)
    validatedCompetencies: string[];    // skillIds validés
    invalidatedCompetencies: string[];  // skillIds non validés
    isAutoGraded: boolean;
    gradedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const EvaluationGradeSchema: Schema = new Schema({
    submissionId: {
        type: Schema.Types.ObjectId,
        ref: 'EvaluationSubmission',
        required: true,
        unique: true,
    },
    evaluatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: undefined,
    },
    grade: {
        type: Number,
        required: true,
        min: 0,
        max: 20,
    },
    feedback: { type: String, default: '' },
    photoLinks: [{ type: String }],
    validatedCompetencies: [{ type: String }],
    invalidatedCompetencies: [{ type: String }],
    isAutoGraded: { type: Boolean, default: false },
    gradedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

EvaluationGradeSchema.index({ evaluatorId: 1 });

const EvaluationGrade: Model<IEvaluationGrade> =
    mongoose.models.EvaluationGrade ||
    mongoose.model<IEvaluationGrade>('EvaluationGrade', EvaluationGradeSchema);

export default EvaluationGrade;
