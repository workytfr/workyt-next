import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Bibliothèque pour générer un UUID
import { IUser } from './User'; // Import de l'interface IUser

/** Nature d'un commentaire, choisie par l'élève avant de poster. */
export const COMMENT_KINDS = ['avis', 'question', 'erreur', 'merci'] as const;
export type CommentKind = (typeof COMMENT_KINDS)[number];

/**
 * Interface représentant un commentaire
 */
export interface IComment extends Document {
    commentId: string; // Identifiant unique du commentaire
    content: string; // Contenu du commentaire
    author: Types.ObjectId | IUser; // Le champ peut être un Types.ObjectId ou un utilisateur peuplé
    revision: mongoose.Types.ObjectId; // Référence à la fiche de révision associée (Revision)
    /** Commentaire auquel celui-ci répond (un seul niveau de réponse) */
    parent?: mongoose.Types.ObjectId | null;
    kind: CommentKind;
    likedBy: mongoose.Types.ObjectId[];
    likes: number;
    /** Mis en avant par l'auteur de la fiche (un seul par fiche) */
    pinned: boolean;
    editedAt?: Date;
    createdAt: Date; // Date de création du commentaire
}

/**
 * Schéma Mongoose pour les commentaires
 */
const CommentSchema: Schema = new Schema({
    commentId: { type: String, default: uuidv4 }, // Identifiant unique généré automatiquement
    content: { type: String, required: true, maxlength: 500 }, // Contenu obligatoire
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
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    kind: { type: String, enum: COMMENT_KINDS, default: 'avis' },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    editedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }, // Date de création automatique
});

// Fil d'une fiche (commentaires principaux puis réponses)
CommentSchema.index({ revision: 1, parent: 1, createdAt: -1 });

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Comment: Model<IComment> =
    mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
