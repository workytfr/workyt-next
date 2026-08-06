import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import { getChat, sendMessage } from '@/lib/clanChat';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clan/chat — le tchat du jour de mon clan.
 *
 * `?since=<ISO>` ne renvoie que les messages postérieurs : le client relève
 * le fil toutes les dix secondes, il ne doit pas retélécharger tout à chaque
 * fois. Le quota restant, lui, est toujours recalculé.
 */
export async function GET(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ success: true, data: null });

    const raw = req.nextUrl.searchParams.get('since');
    const since = raw ? new Date(raw) : null;

    const data = await getChat(me.id, since && !isNaN(since.getTime()) ? since : null);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur GET /api/clan/chat:', error);
    return NextResponse.json({ success: true, data: null });
  }
}

/**
 * POST /api/clan/chat — poster un message.
 *
 * Deux limites superposées : l'anti-rafale ci-dessous (5 messages par
 * minute, pour que personne ne colle dix lignes d'un coup) et le quota
 * quotidien tenu en base par clanChat (voir MESSAGES_PAR_JOUR).
 */
export async function POST(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`clan-chat:${me.id}`, 5, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    // Rien n'est nettoyé ni tronqué ici : sendMessage n'accepte que des clés
    // du catalogue et des valeurs fermées, donc une chaîne fantaisiste est
    // simplement rejetée. Pas de désinfection, pas de surface.
    const body = await req.json().catch(() => ({}));
    const result = await sendMessage(me.id, me.username, {
      template: String(body?.template ?? ''),
      memberId: body?.memberId ?? null,
      gate: body?.gate ?? null,
      soldier: body?.soldier ?? null,
      role: body?.role ?? null
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, remaining: result.remaining });
  } catch (error) {
    console.error('Erreur POST /api/clan/chat:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
