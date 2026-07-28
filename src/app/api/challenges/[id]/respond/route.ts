import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../../friends/_auth';
import { respondToChallenge } from '@/lib/challengeService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/challenges/[id]/respond — accepte ou refuse un défi reçu.
 * Body : { accept: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`challenge-respond:${me.id}`, 60, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const accept = body?.accept === true;

    const result = await respondToChallenge(id, me.id, accept);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, accepted: accept });
  } catch (error) {
    console.error('Erreur POST /api/challenges/[id]/respond:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
