import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import PomodoroSession from '@/models/PomodoroSession';
import { currentUser } from '@/app/api/friends/_auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { SUBJECTS } from '@/lib/pomodoro/settings';

const TZ = 'Europe/Paris';
const DAY_MS = 86_400_000;

/** Date du jour (AAAA-MM-JJ) à Paris. */
function parisDay(d: Date): string {
    return new Intl.DateTimeFormat('fr-CA', { timeZone: TZ }).format(d);
}

/**
 * Enregistre un focus. Les durées sont recoupées avec l'horloge du serveur :
 * pas de focus dans le futur, ni plus long que le temps réellement écoulé.
 */
export async function POST(req: NextRequest) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`pomodoro-session:${user.id}`, 20, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => null);
    const startedAt = new Date(body?.startedAt);
    const endedAt = new Date(body?.endedAt);
    const now = Date.now();
    if (
        isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())
        || endedAt.getTime() > now + 60_000
        || startedAt.getTime() < now - DAY_MS
        || endedAt <= startedAt
    ) {
        return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    const elapsed = (endedAt.getTime() - startedAt.getTime()) / 1000;
    const focusedSeconds = Math.round(Math.min(Number(body?.focusedSeconds) || 0, elapsed + 5, 3 * 3600));
    const plannedMinutes = Math.min(180, Math.max(1, Math.round(Number(body?.plannedMinutes) || 0)));
    // Un focus de moins d'une minute ne raconte rien : on l'ignore
    if (focusedSeconds < 60) return NextResponse.json({ ok: true, ignored: true });

    const subject = (SUBJECTS as readonly string[]).includes(body?.subject) ? body.subject : undefined;

    await dbConnect();
    try {
        await PomodoroSession.create({
            user: user.id,
            subject,
            startedAt,
            endedAt,
            plannedMinutes,
            focusedSeconds,
            completed: body?.completed === true,
        });
    } catch (e: unknown) {
        // Doublon (même focus renvoyé) : déjà compté
        if ((e as { code?: number })?.code !== 11000) throw e;
    }
    return NextResponse.json({ ok: true });
}

/** Statistiques du compte : aujourd'hui, 7 derniers jours, série, matières, historique. */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(user.id);
    const now = new Date();
    const dayExpr = { $dateToString: { format: '%Y-%m-%d', date: '$endedAt', timezone: TZ } };

    const [totals, perDay, bySubject, recent] = await Promise.all([
        PomodoroSession.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    completed: { $sum: { $cond: ['$completed', 1, 0] } },
                    abandoned: { $sum: { $cond: ['$completed', 0, 1] } },
                    seconds: { $sum: '$focusedSeconds' },
                },
            },
        ]),
        PomodoroSession.aggregate([
            { $match: { user: userId, endedAt: { $gte: new Date(now.getTime() - 400 * DAY_MS) } } },
            {
                $group: {
                    _id: dayExpr,
                    completed: { $sum: { $cond: ['$completed', 1, 0] } },
                    seconds: { $sum: '$focusedSeconds' },
                },
            },
        ]),
        PomodoroSession.aggregate([
            { $match: { user: userId, endedAt: { $gte: new Date(now.getTime() - 30 * DAY_MS) } } },
            { $group: { _id: { $ifNull: ['$subject', 'Sans matière'] }, seconds: { $sum: '$focusedSeconds' } } },
            { $sort: { seconds: -1 } },
        ]),
        PomodoroSession.find({ user: userId })
            .sort({ endedAt: -1 })
            .limit(8)
            .select('subject endedAt focusedSeconds completed -_id')
            .lean(),
    ]);

    const byDay = new Map<string, { completed: number; seconds: number }>(
        perDay.map((d) => [d._id as string, { completed: d.completed, seconds: d.seconds }]),
    );

    const week = Array.from({ length: 7 }, (_, i) => {
        const date = parisDay(new Date(now.getTime() - (6 - i) * DAY_MS));
        const d = byDay.get(date);
        return { date, completed: d?.completed ?? 0, minutes: Math.round((d?.seconds ?? 0) / 60) };
    });

    // Série : jours consécutifs avec au moins un pomodoro réussi, jusqu'à aujourd'hui
    // (ou hier, pour ne pas casser la série avant le premier focus de la journée)
    let streak = 0;
    for (let i = 0; i < 400; i++) {
        const done = (byDay.get(parisDay(new Date(now.getTime() - i * DAY_MS)))?.completed ?? 0) > 0;
        if (done) streak++;
        else if (i > 0) break;
    }

    const t = totals[0] ?? { completed: 0, abandoned: 0, seconds: 0 };
    return NextResponse.json({
        today: week[6],
        week,
        streak,
        totals: { completed: t.completed, abandoned: t.abandoned, minutes: Math.round(t.seconds / 60) },
        bySubject: bySubject.map((s) => ({ subject: s._id as string, minutes: Math.round(s.seconds / 60) })),
        recent: recent.map((r) => ({
            subject: r.subject ?? null,
            endedAt: r.endedAt,
            minutes: Math.round(r.focusedSeconds / 60),
            completed: r.completed,
        })),
    });
}
