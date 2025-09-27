import Notification, { INotification } from '@/models/Notification';
import Question from '@/models/Question';
import Revision from '@/models/Revision';
import User from '@/models/User';
import mongoose from 'mongoose';

export interface CreateNotificationData {
    type: 'forum_answer' | 'fiche_comment' | 'answer_liked' | 'comment_liked';
    recipientId: string;
    senderId: string;
    relatedEntityType: 'question' | 'answer' | 'fiche' | 'comment';
    relatedEntityId: string;
    title: string;
    message: string;
}

/**
 * Service de gestion des notifications
 */
export class NotificationService {
    
    /**
     * Crée une nouvelle notification
     */
    static async createNotification(data: CreateNotificationData): Promise<INotification> {
        try {
            const notification = await Notification.create({
                type: data.type,
                recipient: new mongoose.Types.ObjectId(data.recipientId),
                sender: new mongoose.Types.ObjectId(data.senderId),
                title: data.title,
                message: data.message,
                relatedEntity: {
                    type: data.relatedEntityType,
                    id: new mongoose.Types.ObjectId(data.relatedEntityId)
                }
            });

            return notification;
        } catch (error) {
            console.error('Erreur lors de la création de la notification:', error);
            throw error;
        }
    }

    /**
     * Notifie l'auteur d'une question qu'une nouvelle réponse a été ajoutée
     */
    static async notifyNewForumAnswer(
        questionId: string, 
        answerAuthorId: string
    ): Promise<void> {
        try {
            // Récupérer la question avec l'auteur
            const question = await Question.findById(questionId).populate('user', 'username');
            if (!question) return;

            const questionAuthorId = question.user._id.toString();
            
            // Ne pas notifier si l'auteur de la réponse est le même que l'auteur de la question
            if (questionAuthorId === answerAuthorId) return;

            // Récupérer l'auteur de la réponse
            const answerAuthor = await User.findById(answerAuthorId, 'username');
            if (!answerAuthor) return;

            await this.createNotification({
                type: 'forum_answer',
                recipientId: questionAuthorId,
                senderId: answerAuthorId,
                relatedEntityType: 'question',
                relatedEntityId: questionId,
                title: 'Nouvelle réponse à votre question',
                message: `${answerAuthor.username} a répondu à votre question "${question.title}"`
            });
        } catch (error) {
            console.error('Erreur lors de la notification de nouvelle réponse:', error);
        }
    }

    /**
     * Notifie l'auteur d'une fiche qu'un nouveau commentaire a été ajouté
     */
    static async notifyNewFicheComment(
        revisionId: string, 
        commentAuthorId: string
    ): Promise<void> {
        try {
            // Récupérer la fiche avec l'auteur
            const revision = await Revision.findById(revisionId).populate('author', 'username');
            if (!revision) return;

            const ficheAuthorId = revision.author._id.toString();
            
            // Ne pas notifier si l'auteur du commentaire est le même que l'auteur de la fiche
            if (ficheAuthorId === commentAuthorId) return;

            // Récupérer l'auteur du commentaire
            const commentAuthor = await User.findById(commentAuthorId, 'username');
            if (!commentAuthor) return;

            await this.createNotification({
                type: 'fiche_comment',
                recipientId: ficheAuthorId,
                senderId: commentAuthorId,
                relatedEntityType: 'fiche',
                relatedEntityId: revisionId,
                title: 'Nouveau commentaire sur votre fiche',
                message: `${commentAuthor.username} a commenté votre fiche "${revision.title}"`
            });
        } catch (error) {
            console.error('Erreur lors de la notification de nouveau commentaire:', error);
        }
    }

    /**
     * Récupère les notifications d'un utilisateur
     */
    static async getUserNotifications(
        userId: string, 
        page: number = 1, 
        limit: number = 10
    ): Promise<{
        notifications: INotification[];
        totalCount: number;
        unreadCount: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const [notifications, totalCount, unreadCount] = await Promise.all([
                Notification.find({ recipient: new mongoose.Types.ObjectId(userId) })
                    .populate('sender', 'username')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Notification.countDocuments({ recipient: new mongoose.Types.ObjectId(userId) }),
                Notification.countDocuments({ 
                    recipient: new mongoose.Types.ObjectId(userId), 
                    isRead: false 
                })
            ]);

            return {
                notifications,
                totalCount,
                unreadCount
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            throw error;
        }
    }

    /**
     * Marque une notification comme lue
     */
    static async markAsRead(notificationId: string, userId: string): Promise<void> {
        try {
            await Notification.findOneAndUpdate(
                { 
                    _id: new mongoose.Types.ObjectId(notificationId),
                    recipient: new mongoose.Types.ObjectId(userId)
                },
                { 
                    isRead: true, 
                    readAt: new Date() 
                }
            );
        } catch (error) {
            console.error('Erreur lors du marquage de la notification comme lue:', error);
            throw error;
        }
    }

    /**
     * Marque toutes les notifications d'un utilisateur comme lues
     */
    static async markAllAsRead(userId: string): Promise<void> {
        try {
            await Notification.updateMany(
                { 
                    recipient: new mongoose.Types.ObjectId(userId),
                    isRead: false
                },
                { 
                    isRead: true, 
                    readAt: new Date() 
                }
            );
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
            throw error;
        }
    }

    /**
     * Supprime les anciennes notifications (plus de 30 jours)
     */
    static async cleanupOldNotifications(): Promise<void> {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                isRead: true
            });
        } catch (error) {
            console.error('Erreur lors du nettoyage des anciennes notifications:', error);
        }
    }
}
