import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Demande de partenariat envoyée depuis la page Kit média (/kit-media).
 */
export interface IPartnershipRequest extends Document {
    type: 'marque' | 'projet' | 'presse' | 'autre';
    companyName: string;
    contactName: string;
    email: string;
    website?: string;
    message: string;
    status: 'nouveau' | 'en_cours' | 'traite' | 'archive';
    createdAt: Date;
    updatedAt: Date;
}

const PartnershipRequestSchema = new Schema<IPartnershipRequest>({
    type: {
        type: String,
        enum: ['marque', 'projet', 'presse', 'autre'],
        default: 'autre',
        required: true,
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [150, 'Le nom ne peut pas dépasser 150 caractères'],
    },
    contactName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [120, 'Le nom du contact ne peut pas dépasser 120 caractères'],
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: [180, "L'email ne peut pas dépasser 180 caractères"],
    },
    website: {
        type: String,
        trim: true,
        maxlength: [300, "L'URL ne peut pas dépasser 300 caractères"],
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères'],
    },
    status: {
        type: String,
        enum: ['nouveau', 'en_cours', 'traite', 'archive'],
        default: 'nouveau',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

PartnershipRequestSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

PartnershipRequestSchema.index({ status: 1, createdAt: -1 });

const PartnershipRequest =
    (mongoose.models.PartnershipRequest as Model<IPartnershipRequest>) ||
    mongoose.model<IPartnershipRequest>('PartnershipRequest', PartnershipRequestSchema);

export default PartnershipRequest;
