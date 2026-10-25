import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PushToken from '@/models/PushToken';
import { currentUserId } from '@/lib/bearerUser';
import { isExpoPushToken } from '@/lib/expoPush';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Enregistre le jeton push du téléphone pour le membre connecté
 * (application mobile : jeton Bearer). Body : { token, platform, prefs? }.
 * Un jeton déjà connu change de propriétaire (autre compte sur l'appareil).
 * L'app le renvoie à chaque lancement : c'est aussi sa « dernière ouverture ».
 */
export async function POST(req: Request) {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const rl = rateLimit(`push-register:${userId}`, 10, 60_000);
    if (!rl.success) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : null;
    if (!isExpoPushToken(token) || !platform) {
        return NextResponse.json({ error: 'Jeton ou plateforme invalide' }, { status: 400 });
    }

    const set: Record<string, unknown> = { user: userId, platform, lastOpenAt: new Date() };
    if (body.prefs && typeof body.prefs === 'object') {
        for (const key of ['quiz', 'clan', 'relance'] as const) {
            if (typeof body.prefs[key] === 'boolean') set[`prefs.${key}`] = body.prefs[key];
        }
    }

    await dbConnect();
    await PushToken.findOneAndUpdate(
        { token },
        { $set: set },
        { upsert: true, new: true }
    );
    return NextResponse.json({ success: true });
}

/** Oublie le jeton (déconnexion de l'app). Body : { token }. */
export async function DELETE(req: Request) {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) return NextResponse.json({ error: 'Jeton requis' }, { status: 400 });

    await dbConnect();
    await PushToken.deleteOne({ token, user: userId });
    return NextResponse.json({ success: true });
}
