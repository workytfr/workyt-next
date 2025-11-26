import mongoose from 'mongoose';
import Quest from '../models/Quest';
import QuestProgress from '../models/QuestProgress';
import Chest from '../models/Chest';
import ChestReward from '../models/ChestReward';
import User from '../models/User';
import Gem from '../models/Gem';
import PointTransaction from '../models/PointTransaction';
import { IQuest, QuestActionType } from '../models/Quest';
import { IQuestProgress } from '../models/QuestProgress';
import '../models/Answer';
import QuizCompletion from '../models/QuizCompletion';
import '../models/Revision';
import '../models/Course';
import '../models/Section';
import '../models/Quiz';

export class QuestService {
  /**
   * Obtient les dates de début et fin pour une période donnée
   */
  static getPeriodDates(type: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (type) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        // Semaine du lundi au dimanche
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajuste pour lundi
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(diff + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0); // Dernier jour du mois
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Fonction de hash simple basée sur une chaîne pour générer un nombre pseudo-aléatoire
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Mélange un tableau de manière déterministe basée sur un seed
   */
  private static shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Générer un index pseudo-aléatoire basé sur le seed
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const j = currentSeed % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Initialise les quêtes pour un utilisateur pour une période donnée
   */
  static async initializeQuestsForUser(userId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<IQuestProgress[]> {
    const { start, end } = this.getPeriodDates(type);

    // Récupérer toutes les quêtes actives du type demandé
    let quests = await Quest.find({
      type,
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: end } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: start } }
          ]
        }
      ]
    });

    // Pour les quêtes journalières, sélectionner seulement 3 quêtes aléatoirement
    // La sélection est déterministe basée sur la date pour que tous les utilisateurs
    // voient les mêmes 3 quêtes le même jour
    if (type === 'daily' && quests.length > 3) {
      // Utiliser la date du jour comme seed pour la sélection
      const dateString = start.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const seed = this.hashString(dateString);
      const shuffled = this.shuffleWithSeed(quests, seed);
      quests = shuffled.slice(0, 3);
    }

    const progresses: IQuestProgress[] = [];

    for (const quest of quests) {
      // Vérifier si une progression existe déjà pour cette période
      const existingProgress = await QuestProgress.findOne({
        user: userId,
        quest: quest._id,
        periodStart: start,
        periodEnd: end
      });

      if (!existingProgress) {
        const progress = new QuestProgress({
          user: userId,
          quest: quest._id,
          progress: 0,
          status: 'in_progress',
          periodStart: start,
          periodEnd: end
        });
        await progress.save();
        progresses.push(progress);
      } else {
        progresses.push(existingProgress);
      }
    }

    return progresses;
  }

  /**
   * Met à jour la progression d'une quête pour un utilisateur
   */
  static async updateQuestProgress(
    userId: string,
    actionType: QuestActionType,
    metadata?: { quizScore?: number; subject?: string }
  ): Promise<IQuestProgress[]> {
    const now = new Date();
    const updatedProgresses: IQuestProgress[] = [];

    // Récupérer toutes les quêtes actives qui correspondent à cette action
    const quests = await Quest.find({
      isActive: true,
      'condition.action': actionType,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
          ]
        }
      ]
    });

    for (const quest of quests) {
      const { start, end } = this.getPeriodDates(quest.type);

      // Vérifier les conditions spécifiques
      if (actionType === 'quiz_score' && quest.condition.metadata?.minScore) {
        if (!metadata?.quizScore || metadata.quizScore < quest.condition.metadata.minScore) {
          continue; // Score insuffisant
        }
      }

      if (actionType === 'fiche_create' && quest.condition.metadata?.subject) {
        if (metadata?.subject !== quest.condition.metadata.subject) {
          continue; // Mauvaise matière
        }
      }

      // Récupérer ou créer la progression
      let progress = await QuestProgress.findOne({
        user: userId,
        quest: quest._id,
        periodStart: start,
        periodEnd: end
      });

      if (!progress) {
        progress = new QuestProgress({
          user: userId,
          quest: quest._id,
          progress: 0,
          status: 'in_progress',
          periodStart: start,
          periodEnd: end
        });
      }

      // Si déjà complétée, ne pas mettre à jour
      if (progress.status === 'completed' || progress.status === 'claimed') {
        continue;
      }

      // Incrémenter la progression
      progress.progress += 1;

      // Vérifier si la quête est complétée
      const wasInProgress = progress.status === 'in_progress';
      if (progress.progress >= quest.condition.target) {
        progress.status = 'completed';
        progress.completedAt = new Date();
        
        // Notifier l'utilisateur si la quête vient d'être complétée
        if (wasInProgress) {
          const { NotificationService } = await import('./notificationService');
          await NotificationService.notifyQuestCompleted(
            userId,
            quest._id.toString(),
            quest.name
          );
        }
      }

      await progress.save();
      updatedProgresses.push(progress);
    }

    return updatedProgresses;
  }

  /**
   * Récupère les quêtes d'un utilisateur pour une période donnée
   */
  static async getUserQuests(
    userId: string,
    type?: 'daily' | 'weekly' | 'monthly'
  ): Promise<any[]> {
    const types: ('daily' | 'weekly' | 'monthly')[] = type ? [type] : ['daily', 'weekly', 'monthly'];
    const results: any[] = [];

    for (const questType of types) {
      const { start, end } = this.getPeriodDates(questType);

      // Initialiser les quêtes si nécessaire
      await this.initializeQuestsForUser(userId, questType);

      const progresses = await QuestProgress.find({
        user: userId,
        periodStart: start,
        periodEnd: end
      }).populate('quest');

      for (const progress of progresses) {
        const quest = progress.quest as IQuest;
        results.push({
          id: quest._id,
          slug: quest.slug,
          name: quest.name,
          description: quest.description,
          type: quest.type,
          progress: progress.progress,
          target: quest.condition.target,
          status: progress.status,
          rewards: quest.rewards,
          periodStart: progress.periodStart,
          periodEnd: progress.periodEnd
        });
      }
    }

    return results;
  }

  /**
   * Réclame les récompenses d'une quête complétée
   */
  static async claimQuestRewards(userId: string, questId: string): Promise<any> {
    const now = new Date();
    const quest = await Quest.findById(questId);
    if (!quest) {
      throw new Error('Quête non trouvée');
    }

    const { start, end } = this.getPeriodDates(quest.type);

    const progress = await QuestProgress.findOne({
      user: userId,
      quest: questId,
      periodStart: start,
      periodEnd: end
    });

    if (!progress) {
      throw new Error('Progression non trouvée');
    }

    if (progress.status !== 'completed') {
      throw new Error('La quête n\'est pas encore complétée');
    }

    const rewards = [];

    for (const reward of quest.rewards) {
      if (reward.type === 'points') {
        // Ajouter des points
        await User.findByIdAndUpdate(userId, {
          $inc: { points: reward.amount || 0 }
        });

        // Créer une transaction (ajouter quest_reward aux actions autorisées si nécessaire)
        const transaction = new PointTransaction({
          user: userId,
          action: 'completeQuiz', // Utiliser une action existante temporairement
          type: 'gain',
          points: reward.amount || 0
        });
        await transaction.save();

        rewards.push({ type: 'points', amount: reward.amount });
      } else if (reward.type === 'gems') {
        // Ajouter des gemmes
        let gem = await Gem.findOne({ user: userId });
        if (!gem) {
          gem = new Gem({
            user: userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0
          });
        }

        gem.balance += reward.amount || 0;
        gem.totalEarned += reward.amount || 0;
        await gem.save();

        rewards.push({ type: 'gems', amount: reward.amount });
      } else if (reward.type === 'chest') {
        // Ouvrir un coffre et générer une récompense aléatoire
        const chest = await Chest.findOne({
          type: reward.chestType || 'common',
          isActive: true
        });

        if (chest) {
          const chestReward = await this.openChest(userId, chest._id.toString());
          rewards.push({ type: 'chest', chestType: reward.chestType, reward: chestReward });
        }
      }
    }

    // Marquer la quête comme réclamée
    progress.status = 'claimed';
    progress.claimedAt = new Date();
    await progress.save();

    return rewards;
  }

  /**
   * Ouvre un coffre et génère une récompense aléatoire
   */
  static async openChest(userId: string, chestId: string): Promise<any> {
    const chest = await Chest.findById(chestId);
    if (!chest) {
      throw new Error('Coffre non trouvé');
    }

    // Calculer le total des poids
    const totalWeight = chest.possibleRewards.reduce((sum: number, reward: any) => sum + reward.weight, 0);

    // Générer un nombre aléatoire
    let random = Math.random() * totalWeight;

    // Sélectionner la récompense basée sur les poids
    let selectedReward = null;
    for (const reward of chest.possibleRewards) {
      random -= reward.weight;
      if (random <= 0) {
        selectedReward = reward;
        break;
      }
    }

    if (!selectedReward) {
      // Fallback sur la première récompense
      selectedReward = chest.possibleRewards[0];
    }

    // Créer l'enregistrement de récompense
    const chestReward = new ChestReward({
      user: userId,
      chest: chestId,
      rewardType: selectedReward.type,
      amount: selectedReward.amount,
      cosmeticType: selectedReward.cosmeticType,
      cosmeticId: selectedReward.cosmeticId,
      claimed: false
    });
    await chestReward.save();

    // Appliquer la récompense immédiatement
    if (selectedReward.type === 'points') {
      await User.findByIdAndUpdate(userId, {
        $inc: { points: selectedReward.amount || 0 }
      });

      const transaction = new PointTransaction({
        user: userId,
        action: 'completeQuiz', // Utiliser une action existante temporairement
        type: 'gain',
        points: selectedReward.amount || 0
      });
      await transaction.save();
    } else if (selectedReward.type === 'gems') {
      let gem = await Gem.findOne({ user: userId });
      if (!gem) {
        gem = new Gem({
          user: userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0
        });
      }
      gem.balance += selectedReward.amount || 0;
      gem.totalEarned += selectedReward.amount || 0;
      await gem.save();
    }

    chestReward.claimed = true;
    chestReward.claimedAt = new Date();
    await chestReward.save();

    return {
      rewardType: selectedReward.type,
      amount: selectedReward.amount,
      cosmeticType: selectedReward.cosmeticType,
      cosmeticId: selectedReward.cosmeticId
    };
  }

  /**
   * Vérifie si un utilisateur a complété un cours (tous les quiz du cours sont complétés)
   */
  static async checkCourseCompletion(userId: string, courseId: string): Promise<boolean> {
    try {
      const Section = mongoose.model('Section');
      const Quiz = mongoose.model('Quiz');
      
      // Récupérer toutes les sections du cours
      const sections = await Section.find({ courseId }).select('_id');
      const sectionIds = sections.map(s => s._id);
      
      // Récupérer tous les quiz de ces sections
      const quizzes = await Quiz.find({ sectionId: { $in: sectionIds } }).select('_id');
      const quizIds = quizzes.map(q => q._id);
      
      if (quizIds.length === 0) {
        return false; // Pas de quiz dans ce cours
      }
      
      // Vérifier si l'utilisateur a complété tous les quiz
      const completedQuizzes = await QuizCompletion.countDocuments({
        userId,
        quizId: { $in: quizIds }
      });
      
      return completedQuizzes === quizIds.length;
    } catch (error) {
      console.error('Erreur lors de la vérification de complétion du cours:', error);
      return false;
    }
  }

  /**
   * Met à jour la progression des quêtes pour la complétion d'un cours
   */
  static async updateCourseCompletionQuest(userId: string, courseId: string): Promise<void> {
    try {
      // Vérifier si le cours est complété
      const isCompleted = await this.checkCourseCompletion(userId, courseId);
      
      if (isCompleted) {
        // Mettre à jour la progression des quêtes de type course_complete
        await this.updateQuestProgress(userId, 'course_complete');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quête de cours:', error);
    }
  }

  /**
   * Nettoie les quêtes expirées (optionnel, à appeler périodiquement)
   */
  static async cleanupExpiredQuests(): Promise<void> {
    const now = new Date();
    await QuestProgress.deleteMany({
      periodEnd: { $lt: now },
      status: { $ne: 'claimed' }
    });
  }
}

