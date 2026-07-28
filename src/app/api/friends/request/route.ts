import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../_auth';
import { sendRequest } from '@/lib/friendService';
import { NotificationService } from '@/lib/notificationService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/friends/request — envoie une demande d'ami.
 * Body : { username: string }
 *
 * Route la plus exposée au spam du système : elle permet d'écrire dans la
 * base ET de notifier un tiers. D'où le rate limit serré, en complément du
 * plafond de demandes en attente géré par le service.
 */
export async function POST(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`friend-request:${me.id}`, 20, 60 * 60 * 1000); // 20/heure
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === 'string' ? body.username : '';
    if (!username.trim()) {
      return NextResponse.json({ error: 'Pseudo manquant' }, { status: 400 });
    }

    const result = await sendRequest(me.id, username);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // La notification ne doit jamais faire échouer la demande elle-même
    if (result.toUserId) {
      const accepted = !!result.message; // sendRequest a auto-accepté une demande croisée
      try {
        if (accepted) {
          await NotificationService.notifyFriendAccepted(result.toUserId, me.id, me.username);
        } else {
          await NotificationService.notifyFriendRequest(result.toUserId, me.id, me.username);
        }
      } catch (err) {
        console.error('Erreur notification demande d\'ami:', err);
      }
    }

    return NextResponse.json({
      success: true,
      friendshipId: result.friendshipId,
      message: result.message
    });
  } catch (error) {
    console.error('Erreur POST /api/friends/request:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
