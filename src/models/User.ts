import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Interface représentant un utilisateur
 */
export interface IUser extends Document {
    _id: ObjectId;
    name: string;
    email: string;
    username: string;
    password: string;
    role: 'Apprenti' | 'Rédacteur' | 'Correcteur' | 'Admin';
    points: number;
    badges: string[];
    isAdmin: boolean;
    bio: string;
    createdAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpiry?: Date;
}

/**
 * Interface pour les méthodes statiques personnalisées
 */
export interface IUserStatics {
    findByUsername(username: string): Promise<IUser | null>;
    isUsernameAvailable(username: string): Promise<boolean>;
    generateUsernameSuggestions(baseUsername: string): Promise<string[]>;
}

/**
 * Type combiné pour le modèle User
 */
export type UserModel = Model<IUser> & IUserStatics;

/**
 * Schéma Mongoose pour les utilisateurs
 */
const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true,
        minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
        maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [5, 'L\'email doit contenir au moins 5 caractères'],
        maxlength: [100, 'L\'email ne peut pas dépasser 100 caractères'],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Format d\'email invalide']
    },
    username: {
        type: String,
        required: [true, 'Le nom d\'utilisateur est requis'],
        trim: true,
        unique: true,
        lowercase: true,
        minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
        maxlength: [20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères'],
        match: [/^[a-z][a-z0-9_]*$/, 'Le nom d\'utilisateur doit commencer par une lettre et ne contenir que des lettres minuscules, chiffres et underscores'],
        validate: {
            validator: async function(this: IUser, username: string) {
                if (!this.isNew && !this.isModified('username')) {
                    return true;
                }

                const existingUser = await mongoose.models.User.findOne({
                    username: { $regex: `^${username}$`, $options: 'i' },
                    _id: { $ne: this._id }
                });

                return !existingUser;
            },
            message: 'Ce nom d\'utilisateur est déjà pris'
        }
    },
    password: {
        type: String,
        required: false,
        default: "",
        select: false,
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
    },
    role: {
        type: String,
        enum: {
            values: ['Apprenti', 'Rédacteur', 'Correcteur', 'Admin'],
            message: 'Rôle invalide'
        },
        required: true,
        default: 'Apprenti',
    },
    points: {
        type: Number,
        default: 20,
        min: [0, 'Les points ne peuvent pas être négatifs']
    },
    badges: [{
        type: String,
        trim: true
    }],
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    bio: {
        type: String,
        required: false,
        maxlength: [500, 'La bio ne peut pas dépasser 500 caractères'],
        trim: true,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordExpiry: {
        type: Date,
        select: false,
    },
});

// Middleware pre-save pour normaliser le username
UserSchema.pre('save', function(next) {
    if (this.isModified('username')) {
        this.username = (this.username as string)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9_]/g, '')
            .substring(0, 20);
    }
    next();
});

// Méthode statique pour rechercher par username
UserSchema.statics.findByUsername = function(username: string) {
    return this.findOne({
        username: { $regex: `^${username}$`, $options: 'i' }
    });
};

// Méthode pour vérifier la disponibilité d'un username
UserSchema.statics.isUsernameAvailable = async function(username: string): Promise<boolean> {
    const normalizedUsername = username
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_]/g, '');

    const user = await this.findOne({
        username: { $regex: `^${normalizedUsername}$`, $options: 'i' }
    });
    return !user;
};

// Méthode pour générer des suggestions de username
UserSchema.statics.generateUsernameSuggestions = async function(baseUsername: string): Promise<string[]> {
    const suggestions: string[] = [];
    const UserModel = this as UserModel;

    const normalizedBase = baseUsername
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 15);

    // Essaie avec des chiffres
    for (let i = 1; i <= 5; i++) {
        const suggestion = `${normalizedBase}${i}`;
        const isAvailable = await UserModel.isUsernameAvailable(suggestion);
        if (isAvailable) {
            suggestions.push(suggestion);
            if (suggestions.length >= 3) break;
        }
    }

    // Si pas assez de suggestions, essaie avec des suffixes
    if (suggestions.length < 3) {
        const suffixes = ['_user', '_pro', '_new'];
        for (const suffix of suffixes) {
            const suggestion = `${normalizedBase}${suffix}`;
            if (suggestion.length <= 20) {
                const isAvailable = await UserModel.isUsernameAvailable(suggestion);
                if (isAvailable) {
                    suggestions.push(suggestion);
                    if (suggestions.length >= 3) break;
                }
            }
        }
    }

    return suggestions.slice(0, 3);
};

/**
 * Création du modèle User
 */
const User = (mongoose.models.User as UserModel) ||
    (mongoose.model<IUser>('User', UserSchema) as UserModel);

export default User;