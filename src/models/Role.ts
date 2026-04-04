import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRole extends Document {
    name: string;
    displayName: string;
    description: string;
    color: string;
    icon: string;
    permissions: string[];
    isSystem: boolean;       // rôles protégés (Apprenti, Admin) — non supprimables
    isDefault: boolean;      // rôle attribué aux nouveaux inscrits
    priority: number;        // ordre d'affichage (plus haut = plus important)
    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    color: {
        type: String,
        default: '#6b7280',
        match: /^#[0-9a-fA-F]{6}$/,
    },
    icon: {
        type: String,
        default: '',
    },
    permissions: [{
        type: String,
        trim: true,
    }],
    isSystem: {
        type: Boolean,
        default: false,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    priority: {
        type: Number,
        default: 0,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ isDefault: 1 });

RoleSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Role: Model<IRole> =
    mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
