import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Trace d'une relance envoyée (quiz du jour, clan, inactivité) : empêche
 * de renvoyer la même le même jour quand une tâche est relancée, et plafonne
 * le nombre de relances par jour et par membre. Oubliée au bout de 30 jours.
 */
export interface IPushNudge extends Document {
    user: Types.ObjectId;
    /** Ex. « quiz », « quiz-derniere », « clan-capitaine », « inactif-5 » */
    kind: string;
    /** Jour de Paris, AAAA-MM-JJ */
    day: string;
    createdAt: Date;
}

const PushNudgeSchema = new Schema<IPushNudge>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, required: true },
    day: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

PushNudgeSchema.index({ user: 1, kind: 1, day: 1 }, { unique: true });
PushNudgeSchema.index({ user: 1, day: 1 });
PushNudgeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

const PushNudge = mongoose.models.PushNudge || mongoose.model<IPushNudge>('PushNudge', PushNudgeSchema);

export default PushNudge;
