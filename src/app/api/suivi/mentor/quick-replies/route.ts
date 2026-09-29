import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, canMentor } from '@/lib/mentorship/access';
import { getQuickReplies, saveQuickReplies } from '@/lib/mentorship/service';
import { respond, unauthorized, forbidden, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/** GET /api/suivi/mentor/quick-replies — mes réponses types */
export async function GET() {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    if (!(await canMentor(me))) return forbidden('Réservé aux bénévoles accompagnants.');
    return NextResponse.json({ success: true, data: await getQuickReplies(me.id) });
  } catch (error) {
    return serverError('GET /api/suivi/mentor/quick-replies', error);
  }
}

/** PUT /api/suivi/mentor/quick-replies — { replies: string[] } remplace la liste */
export async function PUT(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    if (!(await canMentor(me))) return forbidden('Réservé aux bénévoles accompagnants.');

    const rl = rateLimit(`suivi-quick-replies:${me.id}`, 30, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    return respond(await saveQuickReplies(me.id, body?.replies));
  } catch (error) {
    return serverError('PUT /api/suivi/mentor/quick-replies', error);
  }
}
