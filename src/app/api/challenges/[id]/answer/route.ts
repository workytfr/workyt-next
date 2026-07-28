import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../../friends/_auth';
import { answerChallenge } from '@/lib/challengeService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/challenges/[id]/answer — répond à une question du défi.
 * Body : { index: number, answerIndex: number }
 *
 * La correction est faite côté serveur : le client n'envoie que son choix,
 * jamais un score ni un temps.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`challenge-answer:${me.id}`, 120, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await answerChallenge(
      id,
      me.id,
      Number(body?.index),
      Number(body?.answerIndex)
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur POST /api/challenges/[id]/answer:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
