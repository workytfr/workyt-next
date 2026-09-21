import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, loadSuiviFor } from '@/lib/mentorship/access';
import { postMessage, markRead } from '@/lib/mentorship/service';
import { listMessages } from '@/lib/mentorship/view';
import { respond, unauthorized, notFound, forbidden, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/suivi/[id]/messages — le fil du suivi.
 * `?since=<ISO>` ne renvoie que les messages postérieurs.
 * Lire le fil vaut accusé de lecture (et solde les notifications du suivi).
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const { id } = await params;

    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();
    if (access.viewer === 'candidate') return forbidden('Prends la demande pour accéder à la conversation.');

    const raw = req.nextUrl.searchParams.get('since');
    const since = raw ? new Date(raw) : null;
    const messages = await listMessages(
      access.mentorship,
      access.viewer,
      me.id,
      since && !isNaN(since.getTime()) ? since : null
    );
    await markRead(access.mentorship, access.viewer, me.id);

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return serverError('GET /api/suivi/[id]/messages', error);
  }
}

/**
 * POST /api/suivi/[id]/messages — envoyer un message.
 * multipart/form-data (text, file?) ou JSON { text, kind?, mood? } pour
 * répondre à un point d'étape.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();

    // Anti-rafale : 12 messages par minute, largement assez pour un vrai échange
    const rl = rateLimit(`suivi-message:${me.id}`, 12, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();

    let text = '';
    let file: File | null = null;
    let kind: 'text' | 'checkin_reply' = 'text';
    let mood: 'bien' | 'moyen' | 'bloque' | undefined;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      text = String(form.get('text') ?? '');
      const f = form.get('file');
      if (f instanceof File && f.size > 0) file = f;
    } else {
      const body = await req.json().catch(() => ({}));
      text = String(body?.text ?? '');
      if (body?.kind === 'checkin_reply') kind = 'checkin_reply';
      if (['bien', 'moyen', 'bloque'].includes(body?.mood)) mood = body.mood;
    }

    const result = await postMessage(access.mentorship, access.viewer, me, { text, file, kind, mood });
    return respond(result, 201);
  } catch (error) {
    return serverError('POST /api/suivi/[id]/messages', error);
  }
}
