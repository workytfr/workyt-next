import mongoose, { Schema, type Model } from "mongoose";

/**
 * Code d'autorisation OAuth (« Se connecter avec Workyt ») : à usage unique,
 * valable 60 secondes, lié au PKCE. Seule son empreinte est enregistrée.
 */
export interface IOAuthCode {
    codeHash: string;
    clientId: string;
    user: mongoose.Types.ObjectId;
    redirectUri: string;
    scopes: string[];
    codeChallenge: string;
    nonce?: string;
    authTime: Date;
    used: boolean;
    expiresAt: Date;
}

const OAuthCodeSchema = new Schema<IOAuthCode>(
    {
        codeHash: { type: String, required: true, unique: true },
        clientId: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        redirectUri: { type: String, required: true },
        scopes: [{ type: String }],
        codeChallenge: { type: String, required: true },
        nonce: { type: String },
        authTime: { type: Date, required: true },
        used: { type: Boolean, default: false },
        // Effacé par MongoDB peu après expiration
        expiresAt: { type: Date, required: true, expires: 0 },
    },
    { versionKey: false }
);

const OAuthCode: Model<IOAuthCode> = (mongoose.models.OAuthCode as Model<IOAuthCode>) || mongoose.model<IOAuthCode>("OAuthCode", OAuthCodeSchema);
export default OAuthCode;
