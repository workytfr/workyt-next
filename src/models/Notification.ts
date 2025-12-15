import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface représentant une notification
 */
export interface INotification extends Document {
    notificationId: string;
    type: 'forum_answer' | 'fiche_comment' | 'answer_liked' | 'comment_liked' | 'answer_validated' | 'quest_completed';
    recipient: ObjectId; // Utilisateur qui reçoit la notification
    sender: ObjectId; // Utilisateur qui déclenche la notification
    title: string;
    message: string;
    relatedEntity?: {
        type: 'question' | 'answer' | 'fiche' | 'comment' | 'quest';
        id: ObjectId;
    };
    isRead: boolean;
    isArchived: boolean;
    createdAt: Date;
    readAt?: Date;
    archivedAt?: Date;
}

/**
 * Schéma Mongoose pour les notifications
 */
const NotificationSchema: Schema<INotification> = new Schema({
    notificationId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    type: {
        type: String,
        enum: ['forum_answer', 'fiche_comment', 'answer_liked', 'comment_liked', 'answer_validated', 'quest_completed'],
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedEntity: {
        type: {
            type: String,
            enum: ['question', 'answer', 'fiche', 'comment', 'quest']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    readAt: {
        type: Date
    },
    archivedAt: {
        type: Date
    }
});

// Index pour optimiser les requêtes
NotificationSchema.index({ recipient: 1, isRead: 1, isArchived: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });
NotificationSchema.index({ isArchived: 1, archivedAt: -1 });

/**
 * Création du modèle Notification
 */
const Notification = mongoose.models.Notification || 
    mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
