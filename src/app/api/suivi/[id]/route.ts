import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, loadSuiviFor, canMentor } from '@/lib/mentorship/access';
import {
  cancelRequest,
  takeRequest,
  setPaused,
  releaseByMentor,
  closeMentorship,
  giveFeedback,
  updateNotes,
  syncAssignments
} from '@/lib/mentorship/service';
import { serializeMentorship } from '@/lib/mentorship/view';
import { getMentorProfile } from '@/lib/mentorship/view';
import { respond, unauthorized, notFound, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET /api/suivi/[id] — le suivi, tel que la personne a le droit de le voir */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const { id } = await params;

    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();

    // Détecte les ressources terminées depuis la dernière visite
    if (access.viewer !== 'candidate') await syncAssignments(access.mentorship);

    const data = await serializeMentorship(access.mentorship, access.viewer);
    // Un candidat voit s'il peut prendre la demande (charte, quota)
    const mentorProfile = access.viewer === 'candidate' || (access.viewer === 'moderator' && (await canMentor(me)))
      ? await getMentorProfile(me.id)
      : null;

    return NextResponse.json({ success: true, data: { ...data, myMentorProfile: mentorProfile } });
  } catch (error) {
    return serverError('GET /api/suivi/[id]', error);
  }
}

/**
 * PATCH /api/suivi/[id] — une action sur le cycle de vie du suivi.
 * `action` : cancel | take | assign | pause | resume | release | close | feedback | notes
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();

    const rl = rateLimit(`suivi-action:${me.id}`, 30, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { id } = await params;
    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();
    const { mentorship: m, viewer } = access;

    const body = await req.json().catch(() => ({}));
    switch (body?.action) {
      case 'cancel':
        return respond(await cancelRequest(m, viewer));
      case 'take':
        return respond(await takeRequest(m, me, viewer));
      case 'assign':
        if (viewer !== 'moderator') return respond({ ok: false, status: 403, error: 'Réservé à la modération.' });
        return respond(await takeRequest(m, me, viewer, String(body?.mentorId ?? '')));
      case 'pause':
        return respond(await setPaused(m, viewer, me, true));
      case 'resume':
        return respond(await setPaused(m, viewer, me, false));
      case 'release':
        return respond(await releaseByMentor(m, viewer, me, String(body?.note ?? '')));
      case 'close':
        return respond(
          await closeMentorship(m, viewer, me, {
            outcome: body?.outcome,
            summary: String(body?.summary ?? ''),
            feedback: body?.feedback
          })
        );
      case 'feedback':
        return respond(await giveFeedback(m, viewer, String(body?.feedback ?? '')));
      case 'notes':
        return respond(await updateNotes(m, viewer, String(body?.notes ?? '')));
      default:
        return respond({ ok: false, status: 400, error: 'Action inconnue.' });
    }
  } catch (error) {
    return serverError('PATCH /api/suivi/[id]', error);
  }
}
