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
 * Démarre (ou redémarre) le chrono anti-triche du joueur.
 * Appelé quand la question lui est affichée — GET /api/daily-quiz/play.
 *
 * Tant qu'aucune réponse n'a été donnée, chaque affichage réécrit `startedAt` :
 * quelqu'un qui ouvre le matin, referme, et revient le soir ne doit pas être
 * considéré comme ayant mis 12 heures à répondre.
 */
export async function startDailyQuizTimer(userId: string, date: Date): Promise<void> {
    await dbConnect();

    const normalizedDate = normalizeDate(date);
    const quiz = await DailyQuiz.findOne({ date: normalizedDate }).select('_id').lean<{ _id: any }>();
    if (!quiz) return;

    await DailyQuizAttempt.updateOne(
        { user: userId, date: normalizedDate, isCorrect: { $ne: true } },
        {
            $set: { startedAt: new Date() },
            // user/date viennent déjà du filtre : les répéter ici créerait un conflit
            $setOnInsert: {
                dailyQuiz: quiz._id,
                isCorrect: false,
                attemptCount: 0
            }
        },
        { upsert: true }
    ).catch((err: any) => {
        // 11000 : une ligne résolue existe déjà, le filtre isCorrect l'a exclue.
        // Rien à faire, le chrono ne sert plus.
        if (err?.code !== 11000) throw err;
    });
}

/**
 * Multiplicateur d'XP selon le temps de réponse — c'est l'anti-triche.
 *
 * Chercher la réponse sur internet coûte du temps : on ne sanctionne jamais en
 * PV (ça punirait l'élève lent qui relit son cours), on sanctionne la
 * récompense. Le seuil se resserre avec le niveau : au niveau 20+, il reste
 * 10 secondes, on ne google pas une question en 10 secondes.
 */
export function xpTimeMultiplier(elapsedMs: number | null, heroLevel: number): number {
    if (elapsedMs === null) return 1; // pas de chrono (ancienne ligne) : neutre

    const targetTime = Math.max(10, 30 - heroLevel); // secondes
    const elapsed = elapsedMs / 1000;

    if (elapsed < targetTime / 2) return 1.5; // il savait
    if (elapsed < targetTime) return 1.0;     // il a réfléchi
    if (elapsed < targetTime * 4) return 0.6; // il a cherché
    return 0.3;                                // il a trouvé ailleurs
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
    elapsedMs?: number | null;
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
    const now = new Date();

    // Chrono anti-triche : mesuré côté serveur depuis l'affichage de la question.
    // Le client n'envoie rien, il n'y a donc rien à falsifier.
    const elapsedMs = existing?.startedAt
        ? now.getTime() - new Date(existing.startedAt).getTime()
        : null;

    if (existing) {
        existing.answerIndex = answerIndex;
        existing.isCorrect = isCorrect;
        existing.attemptCount += 1;
        if (!existing.firstAttemptAt) existing.firstAttemptAt = now;
        if (isCorrect) existing.solvedAt = now;
        await existing.save();
    } else {
        await DailyQuizAttempt.create({
            user: userId,
            dailyQuiz: quiz._id,
            date: normalizedDate,
            answerIndex,
            isCorrect,
            attemptCount: 1,
            firstAttemptAt: now,
            solvedAt: isCorrect ? now : undefined
        });
    }

    return {
        success: true,
        isCorrect,
        alreadySolved: false,
        attemptCount: (existing?.attemptCount ?? 0) + 1,
        elapsedMs,
        // La bonne réponse et l'explication ne sortent qu'une fois trouvée,
        // sinon il suffirait d'un mauvais essai pour la lire.
        correctAnswer: isCorrect ? quiz.correctAnswer : undefined,
        explanation: isCorrect ? quiz.explanation : undefined
    };
}
