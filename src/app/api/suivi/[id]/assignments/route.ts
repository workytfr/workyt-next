import { NextRequest } from 'next/server';
import { currentSuiviUser, loadSuiviFor } from '@/lib/mentorship/access';
import { addAssignment, updateAssignment } from '@/lib/mentorship/service';
import { respond, unauthorized, notFound, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/suivi/[id]/assignments — le bénévole assigne une ressource du
 * catalogue. Le client n'envoie que (kind, refId) : titre et lien sont
 * résolus côté serveur.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const rl = rateLimit(`suivi-action:${me.id}`, 30, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();

    const body = await req.json().catch(() => ({}));
    return respond(
      await addAssignment(access.mentorship, access.viewer, me, {
        kind: body?.kind,
        refId: String(body?.refId ?? ''),
        note: typeof body?.note === 'string' ? body.note : undefined,
        dueAt: typeof body?.dueAt === 'string' && body.dueAt ? body.dueAt : undefined
      }),
      201
    );
  } catch (error) {
    return serverError('POST /api/suivi/[id]/assignments', error);
  }
}

/** PATCH /api/suivi/[id]/assignments — marquer terminée / rouvrir / retirer */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const rl = rateLimit(`suivi-action:${me.id}`, 30, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();

    const body = await req.json().catch(() => ({}));
    return respond(
      await updateAssignment(access.mentorship, access.viewer, me, String(body?.assignmentId ?? ''), {
        done: typeof body?.done === 'boolean' ? body.done : undefined,
        remove: body?.remove === true
      })
    );
  } catch (error) {
    return serverError('PATCH /api/suivi/[id]/assignments', error);
  }
}
