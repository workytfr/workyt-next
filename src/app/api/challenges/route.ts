import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentUser } from '../friends/_auth';
import { createChallenge, listChallenges } from '@/lib/challengeService';
import { NotificationService } from '@/lib/notificationService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/** GET /api/challenges — mes défis (reçus, envoyés, terminés). */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const challenges = await listChallenges(me.id);
    return NextResponse.json({ success: true, data: { challenges } });
  } catch (error) {
    console.error('Erreur GET /api/challenges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/challenges — défie un ami.
 * Body : { opponentId: string, matiere?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`challenge-create:${me.id}`, 20, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const opponentId = typeof body?.opponentId === 'string' ? body.opponentId : '';
    const matiere = typeof body?.matiere === 'string' && body.matiere ? body.matiere : null;

    if (!mongoose.isValidObjectId(opponentId)) {
      return NextResponse.json({ error: 'Adversaire invalide' }, { status: 400 });
    }

    const result = await createChallenge(me.id, opponentId, matiere);
    if (!result.success) {
      // `challengeId` est renseigné quand un défi est déjà en cours avec cette
      // personne : le client peut y ramener le joueur plutôt que de le laisser
      // devant un refus sans issue.
      return NextResponse.json(
        { error: result.message, challengeId: result.challengeId },
        { status: 400 }
      );
    }

    // La notification ne doit jamais faire échouer la création du défi
    try {
      await NotificationService.notifyChallengeReceived(
        opponentId,
        me.id,
        me.username,
        result.challengeId!
      );
    } catch (err) {
      console.error('Erreur notification défi:', err);
    }

    return NextResponse.json({ success: true, challengeId: result.challengeId });
  } catch (error) {
    console.error('Erreur POST /api/challenges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
