import mongoose, { Schema, type Model } from "mongoose";

/**
 * Autorisation donnée par un membre à une application (le blog) : demandée
 * une seule fois, puis la connexion est directe. Révocable.
 */
export interface IOAuthConsent {
    user: mongoose.Types.ObjectId;
    clientId: string;
    scopes: string[];
    revokedAt?: Date | null;
    lastUsedAt?: Date;
}

const OAuthConsentSchema = new Schema<IOAuthConsent>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        clientId: { type: String, required: true },
        scopes: [{ type: String }],
        revokedAt: { type: Date, default: null },
        lastUsedAt: { type: Date },
    },
    { timestamps: true }
);
OAuthConsentSchema.index({ user: 1, clientId: 1 }, { unique: true });

const OAuthConsent: Model<IOAuthConsent> = (mongoose.models.OAuthConsent as Model<IOAuthConsent>) || mongoose.model<IOAuthConsent>("OAuthConsent", OAuthConsentSchema);
export default OAuthConsent;
