import Notification, { INotification } from '@/models/Notification';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import Revision from '@/models/Revision';
import User from '@/models/User';
import mongoose from 'mongoose';

export interface CreateNotificationData {
    type: 'forum_answer' | 'fiche_comment' | 'answer_liked' | 'comment_liked' | 'answer_validated' | 'quest_completed';
    recipientId: string;
    senderId: string;
    relatedEntityType?: 'question' | 'answer' | 'fiche' | 'comment' | 'quest';
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
            const notificationData: any = {
                type: data.type,
                recipient: new mongoose.Types.ObjectId(data.recipientId),
                sender: new mongoose.Types.ObjectId(data.senderId),
                title: data.title,
                message: data.message,
            };

            if (data.relatedEntityType) {
                notificationData.relatedEntity = {
                    type: data.relatedEntityType,
                    id: new mongoose.Types.ObjectId(data.relatedEntityId)
                };
            }

            const notification = await Notification.create(notificationData);

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
     * Notifie l'auteur d'une réponse qu'elle a été validée
     */
    static async notifyAnswerValidated(
        answerId: string,
        validatorId: string,
        questionTitle: string,
        points: number
    ): Promise<void> {
        try {
            // Récupérer la réponse avec l'auteur
            const answer = await Answer.findById(answerId).populate('user', 'username');
            if (!answer) return;

            const answerAuthorId = answer.user._id.toString();
            
            // Ne pas notifier si le validateur est le même que l'auteur de la réponse
            if (answerAuthorId === validatorId) return;

            // Récupérer le validateur
            const validator = await User.findById(validatorId, 'username');
            if (!validator) return;

            await this.createNotification({
                type: 'answer_validated',
                recipientId: answerAuthorId,
                senderId: validatorId,
                relatedEntityType: 'answer',
                relatedEntityId: answerId,
                title: 'Votre réponse a été validée !',
                message: `${validator.username} a validé votre réponse sur "${questionTitle}". Vous avez gagné ${points} points !`
            });
        } catch (error) {
            console.error('Erreur lors de la notification de validation de réponse:', error);
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
     * Système d'optimisation des notifications en 3 niveaux
     */
    static async optimizeNotifications(): Promise<void> {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

            // Niveau 1: Archiver les notifications lues après 7 jours (soft delete)
            await Notification.updateMany(
                {
                    createdAt: { $lt: sevenDaysAgo },
                    isRead: true,
                    isArchived: { $ne: true }
                },
                {
                    isArchived: true,
                    archivedAt: new Date()
                }
            );

            // Niveau 2: Supprimer définitivement les notifications archivées après 30 jours
            await Notification.deleteMany({
                isArchived: true,
                archivedAt: { $lt: thirtyDaysAgo }
            });

            // Niveau 3: Supprimer les notifications non lues très anciennes (90 jours)
            await Notification.deleteMany({
                createdAt: { $lt: ninetyDaysAgo },
                isRead: false
            });

            console.log('✅ Optimisation des notifications terminée');
        } catch (error) {
            console.error('Erreur lors de l\'optimisation des notifications:', error);
        }
    }

    /**
     * Récupère les notifications actives (non archivées) d'un utilisateur
     */
    static async getUserActiveNotifications(
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
                Notification.find({ 
                    recipient: new mongoose.Types.ObjectId(userId),
                    isArchived: { $ne: true }
                })
                    .populate('sender', 'username')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Notification.countDocuments({ 
                    recipient: new mongoose.Types.ObjectId(userId),
                    isArchived: { $ne: true }
                }),
                Notification.countDocuments({ 
                    recipient: new mongoose.Types.ObjectId(userId), 
                    isRead: false,
                    isArchived: { $ne: true }
                })
            ]);

            return {
                notifications,
                totalCount,
                unreadCount
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications actives:', error);
            throw error;
        }
    }

    /**
     * Récupère les notifications archivées d'un utilisateur
     */
    static async getUserArchivedNotifications(
        userId: string, 
        page: number = 1, 
        limit: number = 20
    ): Promise<{
        notifications: INotification[];
        totalCount: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const [notifications, totalCount] = await Promise.all([
                Notification.find({ 
                    recipient: new mongoose.Types.ObjectId(userId),
                    isArchived: true
                })
                    .populate('sender', 'username')
                    .sort({ archivedAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Notification.countDocuments({ 
                    recipient: new mongoose.Types.ObjectId(userId),
                    isArchived: true
                })
            ]);

            return {
                notifications,
                totalCount
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications archivées:', error);
            throw error;
        }
    }

    /**
     * Notifie un utilisateur qu'une quête a été complétée
     */
    static async notifyQuestCompleted(
        userId: string,
        questId: string,
        questName: string
    ): Promise<void> {
        try {
            await this.createNotification({
                type: 'quest_completed',
                recipientId: userId,
                senderId: userId, // L'utilisateur lui-même
                relatedEntityType: 'quest',
                relatedEntityId: questId,
                title: 'Quête complétée ! 🎉',
                message: `Félicitations ! Vous avez complété la quête "${questName}". Réclamez vos récompenses maintenant !`
            });
        } catch (error) {
            console.error('Erreur lors de la notification de quête complétée:', error);
        }
    }
}
