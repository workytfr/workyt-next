import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, loadSuiviFor, type SuiviUser } from '@/lib/mentorship/access';
import { startUpload, uploadPart, completeUpload, abortUpload, isPendingKey } from '@/lib/mentorship/upload';
import { unauthorized, notFound, forbidden, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const bad = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status });

/** Participant d'un suivi ouvert, sinon la réponse d'erreur */
async function openSuivi(params: Params['params'], me: SuiviUser) {
  const { id } = await params;
  const access = await loadSuiviFor(id, me);
  if (!access) return { error: notFound() };
  if (access.viewer === 'candidate') return { error: forbidden('Prends d’abord la demande pour écrire à l’élève.') };
  const status = access.mentorship.status;
  if (status === 'closed' || status === 'cancelled') {
    return { error: bad('Ce suivi est terminé : la conversation est en lecture seule.', 409) };
  }
  return { mentorshipId: String(access.mentorship._id) };
}

/**
 * POST /api/suivi/[id]/attachments — envoi d'une pièce jointe en morceaux
 * (voir lib/mentorship/upload.ts) :
 *  - { action: 'start', type, size } → { key, uploadId, partSize } ;
 *  - { action: 'complete', key, uploadId } → fichier assemblé ;
 *  - { action: 'abort', key, uploadId }.
 * Le fichier n'est attaché qu'à l'envoi du message (POST /messages avec `upload`).
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const rl = rateLimit(`suivi-attachment:${me.id}`, 20, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const suivi = await openSuivi(params, me);
    if ('error' in suivi) return suivi.error;

    const body = await req.json().catch(() => ({}));
    if (body?.action === 'start') {
      const res = await startUpload(suivi.mentorshipId, String(body.type ?? ''), Number(body.size));
      if (!res.ok) return bad(res.error, res.status);
      return NextResponse.json({ success: true, data: { key: res.key, uploadId: res.uploadId, partSize: res.partSize } });
    }

    const key = String(body?.key ?? '');
    const uploadId = String(body?.uploadId ?? '');
    if (!isPendingKey(suivi.mentorshipId, key) || !uploadId) return bad('Pièce jointe invalide.');

    if (body?.action === 'complete') {
      const res = await completeUpload(key, uploadId);
      if (!res.ok) return bad(res.error, res.status);
      return NextResponse.json({ success: true, data: { key } });
    }
    if (body?.action === 'abort') {
      await abortUpload(key, uploadId);
      return NextResponse.json({ success: true, data: null });
    }
    return bad('Action inconnue.');
  } catch (error) {
    return serverError('POST /api/suivi/[id]/attachments', error);
  }
}

/** PUT /api/suivi/[id]/attachments?key=…&uploadId=…&part=N — un morceau (octets bruts, 6 Mo max) */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    // 20 Mo = 4 morceaux : la limite laisse de la marge pour plusieurs fichiers et les reprises
    const rl = rateLimit(`suivi-attachment-part:${me.id}`, 40, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const suivi = await openSuivi(params, me);
    if ('error' in suivi) return suivi.error;

    const q = req.nextUrl.searchParams;
    const key = q.get('key') ?? '';
    const uploadId = q.get('uploadId') ?? '';
    if (!isPendingKey(suivi.mentorshipId, key) || !uploadId) return bad('Pièce jointe invalide.');

    const res = await uploadPart(key, uploadId, Number(q.get('part')), Buffer.from(await req.arrayBuffer()));
    if (!res.ok) return bad(res.error, res.status);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return serverError('PUT /api/suivi/[id]/attachments', error);
  }
}
