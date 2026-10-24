import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PomodoroPreference from '@/models/PomodoroPreference';
import { currentUser } from '@/app/api/friends/_auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sanitizeSettings } from '@/lib/pomodoro/settings';

/** Réglages Pomodoro du compte (null s'il n'en a jamais enregistré). */
export async function GET() {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const pref = await PomodoroPreference.findOne({ user: user.id }).lean();
    return NextResponse.json({ settings: pref ? sanitizeSettings(pref) : null });
}

export async function PUT(req: NextRequest) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`pomodoro-pref:${user.id}`, 30, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => null);
    const settings = sanitizeSettings(body?.settings);

    await dbConnect();
    await PomodoroPreference.updateOne(
        { user: user.id },
        { $set: { ...settings, updatedAt: new Date() } },
        { upsert: true },
    );
    return NextResponse.json({ settings });
}
