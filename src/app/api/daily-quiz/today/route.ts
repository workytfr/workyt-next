import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import Calendar from '@/models/Calendar';
import { getDailyQuizForDate, normalizeDate } from '@/lib/dailyQuizService';

// Jamais mise en cache : le bot doit toujours voir le quiz du jour courant.
export const dynamic = 'force-dynamic';

/**
 * Comparaison à temps constant, insensible à la différence de longueur.
 */
function secretMatches(provided: string, expected: string): boolean {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

/**
 * GET /api/daily-quiz/today — route privée réservée au bot Discord.
 *
 * Auth : header `x-bot-secret` valant DAILY_QUIZ_BOT_SECRET.
 * Renvoie la bonne réponse : le bot corrige lui-même dans Discord et crédite
 * ses propres points. La réponse devient donc publique sur Discord — c'est assumé,
 * le claim sur le site reste conditionné à une bonne réponse jouée sur le site.
 *
 * Paramètre optionnel `?date=YYYY-MM-DD` pour prévisualiser un autre jour.
 */
export async function GET(req: NextRequest) {
    try {
        const expected = process.env.DAILY_QUIZ_BOT_SECRET;
        if (!expected) {
            console.error('DAILY_QUIZ_BOT_SECRET absent de l\'environnement');
            return NextResponse.json({ error: 'Route non configurée' }, { status: 503 });
        }

        const provided = req.headers.get('x-bot-secret');
        if (!provided || !secretMatches(provided, expected)) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const dateParam = req.nextUrl.searchParams.get('date');
        let targetDate: Date;

        if (dateParam) {
            const parsed = new Date(dateParam);
            if (Number.isNaN(parsed.getTime())) {
                return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
            }
            targetDate = parsed;
        } else {
            targetDate = new Date();
        }

        const quiz = await getDailyQuizForDate(targetDate);

        if (!quiz) {
            return NextResponse.json(
                { error: 'Aucun quiz publié pour cette date' },
                { status: 404 }
            );
        }

        // Récompense du calendrier du même jour, pour que le bot puisse l'annoncer.
        // Absente si le calendrier n'a pas encore été initialisé pour cette date.
        const calendarDay = await Calendar.findOne({ date: normalizeDate(targetDate) });

        return NextResponse.json({
            id: quiz._id.toString(),
            date: normalizeDate(targetDate).toISOString(),
            question: quiz.question,
            // Ordre du dashboard : c'est au bot de mélanger avant d'afficher.
            answers: quiz.answers,
            correctAnswer: quiz.correctAnswer,
            correctAnswerText: quiz.answers[quiz.correctAnswer],
            explanation: quiz.explanation ?? null,
            reward: calendarDay
                ? {
                      type: calendarDay.reward.type,
                      amount: calendarDay.reward.amount ?? null,
                      chestType: calendarDay.reward.chestType ?? null,
                      isSpecial: calendarDay.isSpecial,
                      specialName: calendarDay.specialName ?? null
                  }
                : null
        });
    } catch (error) {
        console.error('Erreur GET /api/daily-quiz/today:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
