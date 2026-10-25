import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Jeton de notification push d'un téléphone (application mobile Expo).
 * Un membre peut en avoir plusieurs (téléphone + tablette) ; un jeton
 * n'appartient qu'à un seul compte (le dernier connecté sur l'appareil).
 */
export interface IPushToken extends Document {
    user: Types.ObjectId;
    token: string;
    platform: 'ios' | 'android' | 'web';
    /** Relances acceptées (réglables dans l'app, « Mon espace ») */
    prefs: { quiz: boolean; clan: boolean; relance: boolean };
    /** Dernière ouverture de l'app (renvoi du jeton à chaque lancement) */
    lastOpenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PushTokenSchema = new Schema<IPushToken>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        token: { type: String, required: true, unique: true },
        platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
        prefs: {
            quiz: { type: Boolean, default: true },
            clan: { type: Boolean, default: true },
            relance: { type: Boolean, default: true },
        },
        lastOpenAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const PushToken = mongoose.models.PushToken || mongoose.model<IPushToken>('PushToken', PushTokenSchema);

export default PushToken;
