import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, loadSuiviFor } from '@/lib/mentorship/access';
import { studentProgress } from '@/lib/mentorship/progress';
import { unauthorized, notFound, forbidden, serverError } from '@/lib/mentorship/http';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/suivi/[id]/progress — le travail récent de l'élève sur Workyt.
 * Réservé au bénévole EN CHARGE (pas un candidat, pas un ancien bénévole) et
 * à la modération.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    const { id } = await params;

    const access = await loadSuiviFor(id, me);
    if (!access) return notFound();
    if (access.viewer !== 'mentor' && access.viewer !== 'moderator') return forbidden();

    const data = await studentProgress(String(access.mentorship.student));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return serverError('GET /api/suivi/[id]/progress', error);
  }
}
