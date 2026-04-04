import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Progression d'un élève sur une compétence spécifique
 *
 * Statuts visuels :
 *   "mastered"     → Vert    — Quiz > 80% + 2 révisions minimum
 *   "in_progress"  → Jaune   — En cours d'apprentissage
 *   "failed"       → Rouge   — Dernier quiz < 40%
 *   "not_started"  → Gris    — Pas encore abordé
 */
export type CompetencyStatus = 'not_started' | 'in_progress' | 'failed' | 'mastered';

export interface IAttempt {
    date: Date;
    score: number;                 // 0-100
    source: 'quiz' | 'exercise' | 'self_assessment' | 'evaluation';
    sourceId?: ObjectId;
}

export interface ICompetencyProgress extends Document {
    _id: ObjectId;
    userId: ObjectId;
    curriculumNodeId: ObjectId;
    skillId: string;               // "C4-MATH-NC-CL-01"

    status: CompetencyStatus;

    // Historique des tentatives
    attempts: IAttempt[];

    // Scores
    bestScore: number;
    lastScore: number;

    // Révisions
    revisionCount: number;
    lastReviewed?: Date;
    nextReview?: Date;

    // Répétition espacée (SRS)
    srsLevel: number;              // 0-5, détermine l'intervalle

    createdAt: Date;
    updatedAt: Date;
}

const AttemptSubSchema = new Schema({
    date: { type: Date, default: Date.now },
    score: { type: Number, required: true, min: 0, max: 100 },
    source: {
        type: String,
        enum: ['quiz', 'exercise', 'self_assessment', 'evaluation'],
        required: true,
    },
    sourceId: { type: Schema.Types.ObjectId, default: undefined },
}, { _id: false });

const CompetencyProgressSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    curriculumNodeId: {
        type: Schema.Types.ObjectId,
        ref: 'CurriculumNode',
        required: true,
    },
    skillId: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'failed', 'mastered'],
        default: 'not_started',
    },

    attempts: [AttemptSubSchema],

    bestScore: { type: Number, default: 0, min: 0, max: 100 },
    lastScore: { type: Number, default: 0, min: 0, max: 100 },

    revisionCount: { type: Number, default: 0 },
    lastReviewed: { type: Date, default: undefined },
    nextReview: { type: Date, default: undefined },

    srsLevel: { type: Number, default: 0, min: 0, max: 5 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Index composé unique : un utilisateur ne peut avoir qu'une progression par compétence
CompetencyProgressSchema.index({ userId: 1, skillId: 1 }, { unique: true });
CompetencyProgressSchema.index({ userId: 1, curriculumNodeId: 1 });
CompetencyProgressSchema.index({ userId: 1, status: 1 });

// Intervalles SRS en jours : [1, 3, 7, 14, 30, 60]
const SRS_INTERVALS = [1, 3, 7, 14, 30, 60];

/**
 * Recalcule automatiquement le statut et la prochaine révision SRS
 */
CompetencyProgressSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Recalcul du statut basé sur les scores et révisions
    const bestScore = this.bestScore as number;
    const lastScore = this.lastScore as number;
    const revisionCount = this.revisionCount as number;
    const attempts = this.attempts as IAttempt[];

    if (attempts.length === 0) {
        this.status = 'not_started';
    } else if (bestScore >= 80 && revisionCount >= 2) {
        this.status = 'mastered';
    } else if (lastScore < 40 && attempts.length > 0) {
        this.status = 'failed';
    } else {
        this.status = 'in_progress';
    }

    // Calcul de la prochaine révision SRS
    if (this.lastReviewed && (this.srsLevel as number) < SRS_INTERVALS.length) {
        const interval = SRS_INTERVALS[this.srsLevel as number];
        const next = new Date(this.lastReviewed as Date);
        next.setDate(next.getDate() + interval);
        this.nextReview = next;
    }

    next();
});

const CompetencyProgress: Model<ICompetencyProgress> =
    mongoose.models.CompetencyProgress ||
    mongoose.model<ICompetencyProgress>('CompetencyProgress', CompetencyProgressSchema);

export default CompetencyProgress;
