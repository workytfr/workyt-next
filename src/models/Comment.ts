import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Bibliothèque pour générer un UUID
import { IUser } from './User'; // Import de l'interface IUser


/**
 * Interface représentant un commentaire
 */
export interface IComment extends Document {
    commentId: string; // Identifiant unique du commentaire
    content: string; // Contenu du commentaire
    author: ObjectId | IUser; // Le champ peut être un ObjectId ou un utilisateur peuplé
    revision: mongoose.Types.ObjectId; // Référence à la fiche de révision associée (Revision)
    createdAt: Date; // Date de création du commentaire
}

/**
 * Schéma Mongoose pour les commentaires
 */
const CommentSchema: Schema = new Schema({
    commentId: { type: String, default: uuidv4 }, // Identifiant unique généré automatiquement
    content: { type: String, required: true }, // Contenu obligatoire
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Référence au modèle User
        required: [true, "L'auteur du commentaire est obligatoire"],
    },
    revision: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Revision', // Référence au modèle Revision
        required: true,
    },
    createdAt: { type: Date, default: Date.now }, // Date de création automatique
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Comment: Model<IComment> =
    mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
