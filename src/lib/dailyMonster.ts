import Calendar from '@/models/Calendar';
import dbConnect from '@/lib/mongodb';
import { getMonsterForDate, type DailyMonster } from '@/lib/monsters';

/**
 * Source unique de vérité pour « le monstre du jour ».
 *
 * Avant, chaque route recalculait le monstre de son côté : /api/hero utilisait
 * le thème du mois alors que /api/hero/monster-strike et /api/daily-quiz/play
 * passaient 'default'. Le joueur voyait donc un monstre et encaissait les
 * dégâts d'un autre. Tout passe désormais par ici.
 *
 * Le contexte (thème du mois, présence d'un quiz) est identique pour tous les
 * utilisateurs : on le met en cache en mémoire au lieu de refaire 2 requêtes
 * par appel et par joueur.
 */

export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Le thème du mois ne bouge quasiment jamais : cache pour la journée.
let themeCache: { key: string; theme: string } | null = null;

// Un quiz peut être publié en cours de journée : cache court.
let quizCache: { key: string; hasQuiz: boolean; at: number } | null = null;
const QUIZ_TTL_MS = 60_000;

async function getMonthTheme(now: Date): Promise<string> {
  const key = todayKey(now);
  if (themeCache?.key === key) return themeCache.theme;

  await dbConnect();
  const special = await Calendar.findOne({
    date: {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1),
      $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    },
    isSpecial: true
  })
    .select('theme')
    .lean();

  const theme = (special as any)?.theme || 'default';
  themeCache = { key, theme };
  return theme;
}

async function hasQuizToday(now: Date): Promise<boolean> {
  const key = todayKey(now);
  if (quizCache?.key === key && Date.now() - quizCache.at < QUIZ_TTL_MS) {
    return quizCache.hasQuiz;
  }

  const { normalizeDate } = await import('@/lib/dailyQuizService');
  const { default: DailyQuiz } = await import('@/models/DailyQuiz');
  await dbConnect();
  const hasQuiz = (await DailyQuiz.countDocuments({ date: normalizeDate(now) }).limit(1)) > 0;

  quizCache = { key, hasQuiz, at: Date.now() };
  return hasQuiz;
}

/**
 * Monstre du jour calibré sur le niveau du héros.
 * @param heroLevel niveau du héros (le scaling HP/attaque en dépend)
 */
export async function getTodayMonster(heroLevel: number, now: Date = new Date()): Promise<DailyMonster> {
  const [theme, hasQuiz] = await Promise.all([getMonthTheme(now), hasQuizToday(now)]);
  return getMonsterForDate(todayKey(now), theme, heroLevel, !hasQuiz);
}
