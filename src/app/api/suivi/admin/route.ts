import { NextResponse } from 'next/server';
import { currentSuiviUser, canManage } from '@/lib/mentorship/access';
import {
  adminStats,
  listQueue,
  listOpenForAdmin,
  listMentorsForAdmin,
  listBlockedMessages
} from '@/lib/mentorship/view';
import Report from '@/models/Report';
import { unauthorized, forbidden, serverError } from '@/lib/mentorship/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/suivi/admin — le tableau de pilotage : chiffres, file, suivis en
 * cours (les élèves qui attendent une réponse en premier), bénévoles et leur
 * charge, messages bloqués, signalements.
 */
export async function GET() {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    if (!(await canManage(me))) return forbidden('Réservé à la modération.');

    const [stats, queue, open, mentors, blocked, reports] = await Promise.all([
      adminStats(),
      listQueue(),
      listOpenForAdmin(),
      listMentorsForAdmin(),
      listBlockedMessages(),
      Report.countDocuments({ 'reportedContent.type': 'mentorship', status: { $in: ['en_attente', 'en_cours'] } })
    ]);

    return NextResponse.json({
      success: true,
      data: { stats: { ...stats, openReports: reports }, queue, open, mentors, blocked }
    });
  } catch (error) {
    return serverError('GET /api/suivi/admin', error);
  }
}
