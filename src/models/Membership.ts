import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Adhésion à l'association Workyt.
 *
 * Minimisation des données : on ne stocke QUE l'opérationnel lié au compte.
 * L'identité de contact (nom, e-mail) vit déjà sur le compte User ; l'adresse
 * postale et la motivation NE SONT JAMAIS stockées (envoyées par e-mail au bureau).
 */
export interface IMembership extends Document {
    userId: Types.ObjectId;          // une adhésion par compte
    memberNumber: string;            // ex. WK-2026-0001
    type: 'benevole' | 'salarie' | 'utilisateur';
    status: 'actif' | 'suspendu';
    joinedAt: Date;
    consecutiveAbsences: number;     // absences consécutives aux AG
    createdAt: Date;
    updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        memberNumber: { type: String, required: true, unique: true },
        type: {
            type: String,
            enum: ['benevole', 'salarie', 'utilisateur'],
            required: true,
        },
        status: {
            type: String,
            enum: ['actif', 'suspendu'],
            default: 'actif',
            index: true,
        },
        joinedAt: { type: Date, default: Date.now },
        consecutiveAbsences: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Membership =
    mongoose.models.Membership ||
    mongoose.model<IMembership>('Membership', MembershipSchema);

export default Membership;
