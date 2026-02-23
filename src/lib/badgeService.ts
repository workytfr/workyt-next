import mongoose from 'mongoose';
import User from '../models/User';
import Badge from '../models/Badge';
import { IUser } from '../models/User';
import '../models/Comment';
import '../models/Revision';
import '../models/Section';
import '../models/Course';
import '../models/Quiz';
import '../models/QuizCompletion';
import '../models/Lesson';
import '../models/Question';
import '../models/Exercise';
import '../models/Bookmark';

export class BadgeService {
  /**
   * Vérifie et attribue automatiquement les badges à un utilisateur
   */
  static async checkAndAwardBadges(userId: string): Promise<string[]> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const allBadges = await Badge.find({});
      const awardedBadges: string[] = [];

      for (const badge of allBadges) {
        const shouldAward = await this.checkBadgeCondition(user, badge);
        
        if (shouldAward && !user.badges.includes(badge.slug)) {
          // Attribuer le badge
          await User.findByIdAndUpdate(userId, {
            $push: { badges: badge.slug }
          });
          
          awardedBadges.push(badge.slug);
          console.log(`Badge "${badge.name}" attribué à ${user.username}`);
        }
      }

      return awardedBadges;
    } catch (error) {
      console.error('Erreur lors de la vérification des badges:', error);
      return [];
    }
  }

  /**
   * Vérifie si un utilisateur remplit la condition pour un badge
   */
  private static async checkBadgeCondition(user: IUser, badge: any): Promise<boolean> {
    const { type, value } = badge.condition;

    switch (type) {
      case 'forum_answer':
        return await this.checkForumAnswers(user._id.toString(), value);
      
      case 'forum_validated':
        return await this.checkForumValidatedAnswers(user._id.toString(), value);
      
      case 'course_completed':
        return await this.checkCoursesCompleted(user._id.toString(), value);
      
      case 'quiz_success':
        return await this.checkQuizSuccess(user._id.toString(), value);
      
      case 'fiche_created':
        return await this.checkFichesCreated(user._id.toString(), value);

      case 'fiche_liked':
        return await this.checkFichesLiked(user._id.toString(), value);

      case 'fiche_bookmarked':
        return await this.checkFichesBookmarked(user._id.toString(), value);

      case 'fiche_diverse':
        return await this.checkFichesDiverse(user._id.toString(), value);

      case 'seniority':
        return await this.checkSeniority(user.createdAt, value);
      
      case 'event':
        // Les badges d'événements sont attribués manuellement
        return false;
      
      default:
        console.warn(`Type de condition non reconnu: ${type}`);
        return false;
    }
  }

  /**
   * Vérifie le nombre de réponses sur le forum
   */
  private static async checkForumAnswers(userId: string, requiredCount: number): Promise<boolean> {
    const Answer = mongoose.model('Answer');
    const count = await Answer.countDocuments({ user: userId });
    return count >= requiredCount;
  }

  /**
   * Vérifie le nombre de réponses validées sur le forum
   */
  private static async checkForumValidatedAnswers(userId: string, requiredCount: number): Promise<boolean> {
    const Answer = mongoose.model('Answer');
    const count = await Answer.countDocuments({ 
      user: userId, 
      status: { $in: ['Validée', 'Meilleure Réponse'] }
    });
    return count >= requiredCount;
  }

  /**
   * Vérifie le nombre de cours terminés
   */
  private static async checkCoursesCompleted(userId: string, requiredCount: number): Promise<boolean> {
    // Cette logique dépend de comment tu stockes les cours terminés
    // Pour l'instant, on retourne false - à adapter selon ton modèle
    return false;
  }

  /**
   * Vérifie le nombre de quiz réussis
   */
  private static async checkQuizSuccess(userId: string, requiredCount: number): Promise<boolean> {
    try {
      const QuizCompletion = mongoose.model('QuizCompletion');
      const count = await QuizCompletion.countDocuments({ 
        userId: userId,
        score: { $gt: 0 } // Au moins 1 point gagné
      });
      return count >= requiredCount;
    } catch (error) {
      console.error('Erreur lors de la vérification des quiz:', error);
      return false;
    }
  }

  /**
   * Vérifie le nombre de fiches créées
   */
  private static async checkFichesCreated(userId: string, requiredCount: number): Promise<boolean> {
    try {
      const Revision = mongoose.model('Revision');
      const count = await Revision.countDocuments({ author: userId });
      return count >= requiredCount;
    } catch (error) {
      console.error('Erreur lors de la vérification des fiches:', error);
      return false;
    }
  }

  /**
   * Vérifie le nombre total de likes reçus sur les fiches d'un utilisateur
   */
  private static async checkFichesLiked(userId: string, requiredCount: number): Promise<boolean> {
    try {
      const Revision = mongoose.model('Revision');
      const result = await Revision.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalLikes: { $sum: '$likes' } } },
      ]);
      const totalLikes = result[0]?.totalLikes || 0;
      return totalLikes >= requiredCount;
    } catch (error) {
      console.error('Erreur lors de la vérification des likes fiches:', error);
      return false;
    }
  }

  /**
   * Vérifie le nombre total de fois que les fiches d'un utilisateur ont été mises en favoris
   */
  private static async checkFichesBookmarked(userId: string, requiredCount: number): Promise<boolean> {
    try {
      const Revision = mongoose.model('Revision');
      const Bookmark = mongoose.model('Bookmark');
      const userFiches = await Revision.find({ author: userId }).select('_id');
      const ficheIds = userFiches.map((f: any) => f._id);
      const count = await Bookmark.countDocuments({ revision: { $in: ficheIds } });
      return count >= requiredCount;
    } catch (error) {
      console.error('Erreur lors de la vérification des bookmarks fiches:', error);
      return false;
    }
  }

  /**
   * Vérifie le nombre de matières différentes dans lesquelles l'utilisateur a créé des fiches
   */
  private static async checkFichesDiverse(userId: string, requiredCount: number): Promise<boolean> {
    try {
      const Revision = mongoose.model('Revision');
      const subjects = await Revision.distinct('subject', { author: userId });
      return subjects.length >= requiredCount;
    } catch (error) {
      console.error('Erreur lors de la vérification de la diversité des fiches:', error);
      return false;
    }
  }

  /**
   * Vérifie l'ancienneté de l'utilisateur (en années)
   */
  private static async checkSeniority(createdAt: Date, requiredYears: number): Promise<boolean> {
    const now = new Date();
    const yearsDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return yearsDiff >= requiredYears;
  }

  /**
   * Déclenche la vérification des badges après une action utilisateur
   */
  static async triggerBadgeCheck(userId: string): Promise<void> {
    try {
      const awardedBadges = await this.checkAndAwardBadges(userId);
      
      if (awardedBadges.length > 0) {
        console.log(`Badges attribués à l'utilisateur ${userId}:`, awardedBadges);
        // Ici tu pourrais ajouter une notification ou un webhook
      }
    } catch (error) {
      console.error('Erreur lors du déclenchement de la vérification des badges:', error);
    }
  }
} 