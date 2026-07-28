import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../_auth';
import { respondToRequest } from '@/lib/friendService';
import { NotificationService } from '@/lib/notificationService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/friends/[id]/respond — accepte ou refuse une demande reçue.
 * Body : { accept: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`friend-respond:${me.id}`, 60, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const accept = body?.accept === true;

    const result = await respondToRequest(id, me.id, accept);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // On ne notifie QUE l'acceptation : prévenir d'un refus serait blessant
    // et transformerait le refus en signal social.
    if (accept && result.requesterId) {
      try {
        await NotificationService.notifyFriendAccepted(result.requesterId, me.id, me.username);
      } catch (err) {
        console.error('Erreur notification ami accepté:', err);
      }
    }

    return NextResponse.json({ success: true, accepted: accept });
  } catch (error) {
    console.error('Erreur POST /api/friends/[id]/respond:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
