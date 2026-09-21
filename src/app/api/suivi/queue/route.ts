import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, canMentor } from '@/lib/mentorship/access';
import { listQueue, getMentorProfile } from '@/lib/mentorship/view';
import { unauthorized, forbidden, serverError } from '@/lib/mentorship/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/suivi/queue — la file d'attente, pour les bénévoles.
 * `?mine=1` : filtre sur les matières et niveaux du profil du bénévole.
 */
export async function GET(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    if (!(await canMentor(me))) return forbidden('Réservé aux bénévoles accompagnants.');

    const profile = await getMentorProfile(me.id);
    const subject = req.nextUrl.searchParams.get('subject') || undefined;
    const level = req.nextUrl.searchParams.get('level') || undefined;
    const mine = req.nextUrl.searchParams.get('mine') === '1';

    let queue = await listQueue({ subject, level });
    if (mine) {
      queue = queue.filter(
        (r) =>
          (!profile.subjects.length || profile.subjects.includes(r.subject)) &&
          (!profile.levels.length || profile.levels.includes(r.level))
      );
    }
    // On n'affiche pas à un bénévole sa propre demande d'élève
    queue = queue.filter((r) => r.student?.id !== me.id);

    return NextResponse.json({ success: true, data: { queue, profile } });
  } catch (error) {
    return serverError('GET /api/suivi/queue', error);
  }
}
