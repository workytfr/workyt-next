import { NextRequest } from 'next/server';
import { currentSuiviUser, loadSuiviFor } from '@/lib/mentorship/access';
import { addGoal, updateGoal } from '@/lib/mentorship/service';
import { respond, unauthorized, notFound, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** POST /api/suivi/[id]/goals — le bénévole ajoute un objectif au plan */
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
    return respond(await addGoal(access.mentorship, access.viewer, me, String(body?.title ?? '')), 201);
  } catch (error) {
    return serverError('POST /api/suivi/[id]/goals', error);
  }
}

/** PATCH /api/suivi/[id]/goals — cocher, renommer ou retirer un objectif */
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
      await updateGoal(access.mentorship, access.viewer, me, String(body?.goalId ?? ''), {
        done: typeof body?.done === 'boolean' ? body.done : undefined,
        title: typeof body?.title === 'string' ? body.title : undefined,
        remove: body?.remove === true
      })
    );
  } catch (error) {
    return serverError('PATCH /api/suivi/[id]/goals', error);
  }
}
