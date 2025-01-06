import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import de la bibliothèque UUID

/**
 * Interface représentant une fiche de révision
 */
interface ILikedBy {
    userId: mongoose.Types.ObjectId;
    likedAt: Date;
}

export interface IRevision extends Document {
    revisionId: string; // Identifiant unique de la fiche
    title: string; // Titre de la fiche
    content: string; // Contenu textuel de la fiche
    likes: number; // Nombre total de likes
    likedBy: ILikedBy[]; // Tableau des utilisateurs ayant liké la fiche
    status: 'Non Certifiée' | 'Certifiée' | 'Vérifiée'; // Statut de la fiche
    author: mongoose.Types.ObjectId; // Référence à l'auteur (User)
    comments: mongoose.Types.ObjectId[]; // Références aux commentaires (Comment)
    files: string[]; // URLs des fichiers (images ou PDF)
    subject: string; // Matière (ex: Mathématiques, Physique)
    level: string; // Niveau ou classe (ex: Terminale, 1ère, Collège)
    createdAt: Date; // Date de création
}

/**
 * Schéma Mongoose pour les fiches de révision
 */
const RevisionSchema: Schema = new Schema({
    revisionId: {
        type: String,
        default: uuidv4, // Génération automatique d'un UUID pour chaque fiche
        unique: true, // Assure l'unicité de l'identifiant
    },
    title: {
        type: String,
        required: true,
    }, // Titre obligatoire
    content: { type: String }, // Contenu textuel (optionnel si des fichiers sont fournis)
    likes: {
        type: Number,
        default: 0,
    }, // Nombre de likes, par défaut 0
    likedBy: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Référence au modèle User
            },
            likedAt: {
                type: Date, // Timestamp du dernier like
                default: Date.now,
            },
        },
    ],
    status: {
        type: String,
        enum: ['Non Certifiée', 'Certifiée', 'Vérifiée'], // Statuts autorisés
        required: true,
        default: 'Non Certifiée', // Par défaut "Non Certifiée"
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Référence au modèle User
        required: true,
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment', // Référence au modèle Comment
        },
    ],
    files: [
        {
            type: String, // URLs des fichiers (images ou PDF)
        },
    ],
    subject: {
        type: String,
        required: true, // La matière est obligatoire
    }, // Exemple : Mathématiques, Physique
    level: {
        type: String,
        required: true, // Le niveau ou classe est obligatoire
    }, // Exemple : Terminale, 1ère, Collège
    createdAt: {
        type: Date,
        default: Date.now,
    }, // Date de création
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Revision: Model<IRevision> =
    mongoose.models.Revision || mongoose.model<IRevision>('Revision', RevisionSchema);

export default Revision;
