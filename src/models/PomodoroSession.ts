import mongoose, { Schema, Document, Types } from 'mongoose';

/** Un focus Pomodoro terminé ou abandonné (comptes connectés uniquement). */
export interface IPomodoroSession extends Document {
    user: Types.ObjectId;
    subject?: string;
    startedAt: Date;
    endedAt: Date;
    plannedMinutes: number;
    focusedSeconds: number;
    /** true = focus mené au bout (fromage gardé), false = abandon */
    completed: boolean;
    createdAt: Date;
}

const PomodoroSessionSchema = new Schema<IPomodoroSession>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, maxlength: 40 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    plannedMinutes: { type: Number, required: true, min: 1, max: 180 },
    focusedSeconds: { type: Number, required: true, min: 0, max: 3 * 3600 },
    completed: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Un même focus renvoyé deux fois (réseau, double onglet) n'est compté qu'une fois
PomodoroSessionSchema.index({ user: 1, startedAt: 1 }, { unique: true });
PomodoroSessionSchema.index({ user: 1, endedAt: -1 });
// Historique limité à un an (les statistiques n'en utilisent pas plus) : MongoDB
// supprime tout seul les sessions plus anciennes
PomodoroSessionSchema.index({ endedAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

const PomodoroSession = mongoose.models.PomodoroSession
    || mongoose.model<IPomodoroSession>('PomodoroSession', PomodoroSessionSchema);

export default PomodoroSession;
