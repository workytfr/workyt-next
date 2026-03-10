import Streak, { IStreak } from '@/models/Streak';
import User from '@/models/User';
import Gem from '@/models/Gem';
import MushroomInventory from '@/models/MushroomInventory';
import MushroomTransaction from '@/models/MushroomTransaction';
import PointTransaction from '@/models/PointTransaction';
import dbConnect from '@/lib/mongodb';

/**
 * Configuration des paliers de streak
 */
export const STREAK_MILESTONES = [
  {
    days: 3,
    name: 'Flamme naissante',
    rewards: { points: 5, gems: 0, mushrooms: 0 },
    badge: null
  },
  {
    days: 7,
    name: 'Flamme stable',
    rewards: { points: 15, gems: 0, mushrooms: 1 },
    badge: null
  },
  {
    days: 14,
    name: 'Flamme ardente',
    rewards: { points: 30, gems: 0, mushrooms: 1 },
    badge: null
  },
  {
    days: 30,
    name: 'Flamme infernale',
    rewards: { points: 50, gems: 1, mushrooms: 2 },
    badge: null
  },
  {
    days: 60,
    name: 'Flamme eternelle',
    rewards: { points: 100, gems: 2, mushrooms: 2 },
    badge: 'flamme_eternelle'
  },
  {
    days: 100,
    name: 'Flamme legendaire',
    rewards: { points: 200, gems: 5, mushrooms: 3 },
    badge: 'flamme_legendaire'
  }
];

/**
 * Retourne le palier actuel et le prochain palier pour un streak donne
 */
export function getStreakMilestoneInfo(currentStreak: number) {
  let currentMilestone = null;
  let nextMilestone = null;

  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone.days) {
      currentMilestone = milestone;
    } else {
      nextMilestone = milestone;
      break;
    }
  }

  // Si on a depasse tous les paliers, pas de next
  if (!nextMilestone && currentStreak >= STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days) {
    nextMilestone = null;
  }

  return { currentMilestone, nextMilestone };
}

export class StreakService {
  /**
   * Normalise une date a minuit (heure locale serveur)
   */
  private static toMidnight(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Enregistre une activite et met a jour le streak
   * Retourne les paliers nouvellement atteints (avec recompenses)
   */
  static async recordActivity(userId: string): Promise<{
    streak: IStreak;
    newMilestones: typeof STREAK_MILESTONES;
  }> {
    await dbConnect();

    const today = this.toMidnight(new Date());

    let streak = await Streak.findOne({ user: userId });

    if (!streak) {
      streak = new Streak({
        user: userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        claimedMilestones: []
      });
      await streak.save();
      return { streak, newMilestones: [] };
    }

    // Si deja enregistre aujourd'hui, ne rien faire
    if (streak.lastActivityDate) {
      const lastDate = this.toMidnight(streak.lastActivityDate);
      if (lastDate.getTime() === today.getTime()) {
        return { streak, newMilestones: [] };
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.getTime() === yesterday.getTime()) {
        // Jour consecutif
        streak.currentStreak += 1;
      } else {
        // Streak casse
        streak.currentStreak = 1;
      }
    } else {
      streak.currentStreak = 1;
    }

    // Mettre a jour le record
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActivityDate = today;
    await streak.save();

    // Verifier les paliers nouvellement atteints
    const newMilestones = [];
    for (const milestone of STREAK_MILESTONES) {
      if (
        streak.currentStreak >= milestone.days &&
        !streak.claimedMilestones.includes(milestone.days)
      ) {
        newMilestones.push(milestone);
      }
    }

    return { streak, newMilestones };
  }

  /**
   * Reclame les recompenses d'un palier de streak
   */
  static async claimMilestone(userId: string, milestoneDays: number): Promise<{
    success: boolean;
    rewards?: { points: number; gems: number; mushrooms: number };
    badge?: string | null;
    message?: string;
  }> {
    await dbConnect();

    const milestone = STREAK_MILESTONES.find(m => m.days === milestoneDays);
    if (!milestone) {
      return { success: false, message: 'Palier invalide' };
    }

    const streak = await Streak.findOne({ user: userId });
    if (!streak) {
      return { success: false, message: 'Aucun streak trouve' };
    }

    if (streak.currentStreak < milestone.days) {
      return { success: false, message: 'Palier non atteint' };
    }

    if (streak.claimedMilestones.includes(milestoneDays)) {
      return { success: false, message: 'Palier deja reclame' };
    }

    // Distribuer les recompenses
    const { points, gems, mushrooms } = milestone.rewards;

    // Points (avec boost)
    if (points > 0) {
      const { addPointsWithBoost } = await import('@/lib/pointsService');
      await addPointsWithBoost(userId, points, 'completeQuiz');
    }

    // Gems
    if (gems > 0) {
      let gemDoc = await Gem.findOne({ user: userId });
      if (!gemDoc) {
        gemDoc = new Gem({ user: userId, balance: 0, totalEarned: 0, totalSpent: 0 });
      }
      gemDoc.balance += gems;
      gemDoc.totalEarned += gems;
      await gemDoc.save();
    }

    // Champignons
    if (mushrooms > 0) {
      let inventory = await MushroomInventory.findOne({ user: userId });
      if (!inventory) {
        inventory = new MushroomInventory({ user: userId, balance: 0, totalEarned: 0, totalUsed: 0 });
      }
      inventory.balance += mushrooms;
      inventory.totalEarned += mushrooms;
      await inventory.save();

      const tx = new MushroomTransaction({
        user: userId,
        type: 'earn',
        amount: mushrooms,
        source: 'streak'
      });
      await tx.save();
    }

    // Badge
    if (milestone.badge) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { badges: milestone.badge }
      });
    }

    // Marquer le palier comme reclame
    streak.claimedMilestones.push(milestoneDays);
    await streak.save();

    return {
      success: true,
      rewards: { points, gems, mushrooms },
      badge: milestone.badge
    };
  }

  /**
   * Recupere les infos de streak d'un utilisateur
   */
  static async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
    milestones: Array<{
      days: number;
      name: string;
      rewards: { points: number; gems: number; mushrooms: number };
      badge: string | null;
      reached: boolean;
      claimed: boolean;
    }>;
  }> {
    await dbConnect();

    const streak = await Streak.findOne({ user: userId });

    const currentStreak = streak?.currentStreak || 0;
    const longestStreak = streak?.longestStreak || 0;
    const lastActivityDate = streak?.lastActivityDate || null;
    const claimedMilestones = streak?.claimedMilestones || [];

    // Verifier si le streak est encore actif (pas casse)
    let effectiveStreak = currentStreak;
    if (lastActivityDate) {
      const today = this.toMidnight(new Date());
      const lastDate = this.toMidnight(lastActivityDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Si la derniere activite n'est ni aujourd'hui ni hier, le streak est casse
      if (lastDate.getTime() !== today.getTime() && lastDate.getTime() !== yesterday.getTime()) {
        effectiveStreak = 0;
      }
    }

    const milestones = STREAK_MILESTONES.map(m => ({
      days: m.days,
      name: m.name,
      rewards: m.rewards,
      badge: m.badge,
      reached: effectiveStreak >= m.days,
      claimed: claimedMilestones.includes(m.days)
    }));

    return {
      currentStreak: effectiveStreak,
      longestStreak,
      lastActivityDate,
      milestones
    };
  }
}
