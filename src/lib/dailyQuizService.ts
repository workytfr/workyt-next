/**
 * Service du quiz du jour.
 *
 * Le site est la source de vérité pour la question et la bonne réponse.
 * Deux consommateurs :
 *  - le bot Discord, via /api/daily-quiz/today (route privée), qui corrige lui-même
 *    et crédite ses propres points dans sa base MySQL ;
 *  - le site, via /api/daily-quiz/play, où une bonne réponse débloque la
 *    réclamation de la récompense du calendrier.
 */

import DailyQuiz from '@/models/DailyQuiz';
import DailyQuizAttempt from '@/models/DailyQuizAttempt';
import dbConnect from '@/lib/mongodb';

/**
 * Ramène une date à minuit heure locale, comme le fait calendarService.
 */
export function normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

/**
 * Le quiz publié pour une date donnée, ou null s'il n'y en a pas.
 */
export async function getDailyQuizForDate(date: Date) {
    await dbConnect();
    return DailyQuiz.findOne({ date: normalizeDate(date) });
}

/**
 * Vrai si l'utilisateur a trouvé la bonne réponse du jour sur le site.
 * C'est la condition qui ouvre la réclamation de la récompense.
 */
export async function hasSolvedDailyQuiz(userId: string, date: Date): Promise<boolean> {
    await dbConnect();
    const attempt = await DailyQuizAttempt.findOne({
        user: userId,
        date: normalizeDate(date),
        isCorrect: true
    });
    return attempt !== null;
}

/**
 * Enregistre une réponse et indique si elle est juste.
 *
 * Les essais multiples sont autorisés : la ligne du jour est mise à jour tant que
 * l'utilisateur n'a pas trouvé, puis figée une fois la bonne réponse donnée.
 */
export async function submitDailyQuizAnswer(
    userId: string,
    date: Date,
    answerIndex: number
): Promise<{
    success: boolean;
    isCorrect?: boolean;
    correctAnswer?: number;
    explanation?: string;
    alreadySolved?: boolean;
    attemptCount?: number;
    message?: string;
}> {
    await dbConnect();

    const normalizedDate = normalizeDate(date);
    const today = normalizeDate(new Date());

    if (normalizedDate.getTime() !== today.getTime()) {
        return { success: false, message: 'Vous ne pouvez répondre qu\'au quiz du jour même' };
    }

    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
        return { success: false, message: 'Réponse invalide' };
    }

    const quiz = await DailyQuiz.findOne({ date: normalizedDate });
    if (!quiz) {
        return { success: false, message: 'Aucun quiz n\'est publié pour aujourd\'hui' };
    }

    const existing = await DailyQuizAttempt.findOne({ user: userId, date: normalizedDate });

    // Déjà résolu : on ne rejoue pas, on renvoie l'état figé
    if (existing?.isCorrect) {
        return {
            success: true,
            isCorrect: true,
            alreadySolved: true,
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation,
            attemptCount: existing.attemptCount
        };
    }

    const isCorrect = answerIndex === quiz.correctAnswer;

    if (existing) {
        existing.answerIndex = answerIndex;
        existing.isCorrect = isCorrect;
        existing.attemptCount += 1;
        if (isCorrect) existing.solvedAt = new Date();
        await existing.save();
    } else {
        await DailyQuizAttempt.create({
            user: userId,
            dailyQuiz: quiz._id,
            date: normalizedDate,
            answerIndex,
            isCorrect,
            attemptCount: 1,
            firstAttemptAt: new Date(),
            solvedAt: isCorrect ? new Date() : undefined
        });
    }

    return {
        success: true,
        isCorrect,
        alreadySolved: false,
        attemptCount: (existing?.attemptCount ?? 0) + 1,
        // La bonne réponse et l'explication ne sortent qu'une fois trouvée,
        // sinon il suffirait d'un mauvais essai pour la lire.
        correctAnswer: isCorrect ? quiz.correctAnswer : undefined,
        explanation: isCorrect ? quiz.explanation : undefined
    };
}
