import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import DailyQuizAttempt from '@/models/DailyQuizAttempt';
import connectDB from '@/lib/mongodb';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import {
    getDailyQuizForDate,
    normalizeDate,
    startDailyQuizTimer,
    submitDailyQuizAnswer
} from '@/lib/dailyQuizService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/daily-quiz/play — le quiz du jour tel que le joueur doit le voir.
 * La bonne réponse n'est jamais incluse tant qu'elle n'a pas été trouvée.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const today = normalizeDate(new Date());
        const quiz = await getDailyQuizForDate(today);

        if (!quiz) {
            return NextResponse.json({ available: false });
        }

        const attempt = await DailyQuizAttempt.findOne({ user: user._id, date: today });
        const solved = attempt?.isCorrect === true;

        // Démarre le chrono anti-triche au moment où la question est affichée.
        // Ne doit jamais empêcher l'affichage du quiz.
        if (!solved) {
            try {
                await startDailyQuizTimer(user._id.toString(), today);
            } catch (err) {
                console.error('Erreur startDailyQuizTimer:', err);
            }
        }

        return NextResponse.json({
            available: true,
            id: quiz._id.toString(),
            date: today.toISOString(),
            question: quiz.question,
            answers: quiz.answers,
            solved,
            attemptCount: attempt?.attemptCount ?? 0,
            lastAnswerIndex: attempt?.answerIndex ?? null,
            correctAnswer: solved ? quiz.correctAnswer : undefined,
            explanation: solved ? (quiz.explanation ?? null) : undefined
        });
    } catch (error) {
        console.error('Erreur GET /api/daily-quiz/play:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * POST /api/daily-quiz/play — soumettre une réponse.
 * Body : { answerIndex: number }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // 10 essais par minute : large pour un QCM à 4 choix, mais coupe le bruteforce scripté.
        const rl = rateLimit(`daily-quiz-play:${session.user.email}`, 10, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body.answerIndex !== 'number') {
            return NextResponse.json({ error: 'answerIndex requis' }, { status: 400 });
        }

        const result = await submitDailyQuizAnswer(
            user._id.toString(),
            new Date(),
            body.answerIndex
        );

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        // RPG « Workyt Quest » : le quiz est un combat (ne doit jamais bloquer le quiz)
        let battle: any = null;
        try {
            if (!result.alreadySolved) {
                const { recordVictory, recordDefeat, getHeroCombatState } = await import('@/lib/heroService');
                const { getTodayMonster } = await import('@/lib/dailyMonster');

                if (result.isCorrect) {
                    const victory = await recordVictory(user._id.toString(), {
                        firstTry: result.attemptCount === 1,
                        isBoss: new Date().getDate() === 15,
                        elapsedMs: result.elapsedMs // chrono serveur, anti-triche
                    });
                    battle = { outcome: 'victory', ...victory };
                } else {
                    // Même monstre que celui affiché dans l'arène (thème du mois)
                    const heroState = await getHeroCombatState(user._id.toString());
                    const monster = await getTodayMonster(heroState.level);
                    const defeat = await recordDefeat(user._id.toString(), monster.attack, { power: monster.power });
                    battle = { outcome: 'defeat', ...defeat };
                }
            }
        } catch (err) {
            console.error('Erreur battle RPG:', err);
        }

        return NextResponse.json({ ...result, battle });
    } catch (error) {
        console.error('Erreur POST /api/daily-quiz/play:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
