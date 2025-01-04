import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface représentant un utilisateur
 */
export interface IUser extends Document {
    name: string;
    email: string;
    username: string;
    password: string; // Le mot de passe doit être haché
    role: 'Apprenti' | 'Rédacteur' | 'Correcteur' | 'Admin'; // Les différents rôles
    points: number; // Points accumulés par l'utilisateur
    badges: string[]; // Liste des badges obtenus
    isAdmin: boolean;
    bio: string;
    createdAt: Date; // Date de création de l'utilisateur
}

/**
 * Schéma Mongoose pour les utilisateurs
 */
const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: true
    }, // Nom de l'utilisateur
    email: {
        type: String,
        required: true,
        unique: true
    }, // Email unique
    username: {
        type: String,
        required: true,
        unique: [true, "Username already exists"],
    },
    password: {
        type: String,
        required: true
    }, // Mot de passe (haché avec bcrypt)
    role: {
        type: String,
        enum: ['Apprenti', 'Rédacteur', 'Correcteur', 'Admin'], // Limite les valeurs possibles
        required: true,
        default: 'Apprenti', // Rôle par défaut
    },
    points: {
        type: Number,
        default: 0
    }, // Points par défaut
    badges: [{ type: String }], // Liste des badges sous forme de tableau
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    bio: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }, // Date de création automatique
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
