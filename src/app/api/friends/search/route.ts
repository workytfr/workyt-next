import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../_auth';
import { searchUsers } from '@/lib/friendService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/friends/search?q=... — utilisateurs à qui envoyer une demande.
 * Exclut soi-même et toute relation déjà existante.
 */
export async function GET(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // La recherche est frappée à chaque frappe côté client : on plafonne
    const rl = rateLimit(`friend-search:${me.id}`, 40, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const q = req.nextUrl.searchParams.get('q') || '';
    const results = await searchUsers(me.id, q);

    return NextResponse.json({ success: true, data: { results } });
  } catch (error) {
    console.error('Erreur GET /api/friends/search:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
