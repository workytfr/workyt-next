import PointTransaction from '@/models/PointTransaction';
import QuestProgress from '@/models/QuestProgress';
import Streak from '@/models/Streak';

export interface UserActivity {
    pointsEarned: number;
    questsCompleted: number;
    currentStreak: number;
}

/**
 * Recupere l'activite de tous les users de la semaine en bulk (aggregation MongoDB)
 * Retourne une Map<userId, UserActivity>
 */
export async function fetchAllUserActivity(weekStart: Date): Promise<Map<string, UserActivity>> {
    const activityMap = new Map<string, UserActivity>();

    const [pointsAgg, questsAgg, streaks] = await Promise.all([
        // Total points gagnes par user cette semaine
        PointTransaction.aggregate([
            { $match: { type: 'gain', createdAt: { $gte: weekStart } } },
            { $group: { _id: '$user', totalPoints: { $sum: '$points' } } },
        ]),

        // Nombre de quetes completees par user cette semaine
        QuestProgress.aggregate([
            {
                $match: {
                    status: { $in: ['completed', 'claimed'] },
                    completedAt: { $gte: weekStart },
                }
            },
            { $group: { _id: '$user', count: { $sum: 1 } } },
        ]),

        // Streaks actives
        Streak.find({ currentStreak: { $gt: 0 } })
            .select('user currentStreak')
            .lean(),
    ]);

    // Remplir la map avec les points
    for (const entry of pointsAgg) {
        const id = entry._id.toString();
        activityMap.set(id, {
            pointsEarned: entry.totalPoints,
            questsCompleted: 0,
            currentStreak: 0,
        });
    }

    // Ajouter les quetes
    for (const entry of questsAgg) {
        const id = entry._id.toString();
        const existing = activityMap.get(id);
        if (existing) {
            existing.questsCompleted = entry.count;
        } else {
            activityMap.set(id, {
                pointsEarned: 0,
                questsCompleted: entry.count,
                currentStreak: 0,
            });
        }
    }

    // Ajouter les streaks
    for (const streak of streaks) {
        const id = (streak.user as any).toString();
        const existing = activityMap.get(id);
        if (existing) {
            existing.currentStreak = streak.currentStreak;
        } else {
            activityMap.set(id, {
                pointsEarned: 0,
                questsCompleted: 0,
                currentStreak: streak.currentStreak,
            });
        }
    }

    return activityMap;
}

/**
 * Verifie si un user a de l'activite cette semaine
 */
export function hasUserActivity(activity: UserActivity | undefined): boolean {
    if (!activity) return false;
    return activity.pointsEarned > 0
        || activity.questsCompleted > 0
        || activity.currentStreak > 0;
}
