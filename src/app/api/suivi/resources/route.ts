import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, canMentor, canManage } from '@/lib/mentorship/access';
import { searchResources } from '@/lib/mentorship/resources';
import { unauthorized, forbidden, serverError } from '@/lib/mentorship/http';
import type { AssignmentKind } from '@/models/Mentorship';

export const dynamic = 'force-dynamic';

const KINDS: AssignmentKind[] = ['course', 'lesson', 'exercise', 'quiz', 'fiche', 'evaluation'];

/** GET /api/suivi/resources?kind=&q=&subject= — le catalogue, pour assigner une ressource */
export async function GET(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    if (!(await canMentor(me)) && !(await canManage(me))) return forbidden();

    const kind = req.nextUrl.searchParams.get('kind') as AssignmentKind;
    if (!KINDS.includes(kind)) return NextResponse.json({ success: false, error: 'Type invalide.' }, { status: 400 });

    const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 80);
    const subject = req.nextUrl.searchParams.get('subject') || undefined;
    const results = await searchResources(kind, q, subject);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return serverError('GET /api/suivi/resources', error);
  }
}
