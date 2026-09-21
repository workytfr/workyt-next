import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentSuiviUser } from '@/lib/mentorship/access';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import Mentorship from '@/models/Mentorship';
import { serverError } from '@/lib/mentorship/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/suivi/suggestion?questionId= — la passerelle forum → suivi.
 *
 * Proposée à l'AUTEUR d'une question seulement, dans deux cas :
 *  - sa question attend une réponse depuis plus de 24 h ;
 *  - il a posé au moins 3 questions dans la même matière en 15 jours
 *    (le signe qu'il bute sur quelque chose de plus large qu'un exercice).
 * Jamais proposée s'il a déjà une demande ou un suivi ouvert dans la matière.
 */
export async function GET(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return NextResponse.json({ success: true, data: { suggest: false } });

    const questionId = req.nextUrl.searchParams.get('questionId') || '';
    if (!mongoose.isValidObjectId(questionId)) return NextResponse.json({ success: true, data: { suggest: false } });

    const q = await Question.findById(questionId)
      .select('user subject classLevel createdAt')
      .lean<{ user: mongoose.Types.ObjectId; subject: string; classLevel: string; createdAt: Date }>();
    if (!q || String(q.user) !== me.id) return NextResponse.json({ success: true, data: { suggest: false } });

    const alreadyOpen = await Mentorship.exists({
      student: me.id,
      subject: q.subject,
      status: { $in: ['pending', 'active', 'paused'] }
    });
    if (alreadyOpen) return NextResponse.json({ success: true, data: { suggest: false } });

    const day = 24 * 3600 * 1000;
    let reason: 'unanswered' | 'recurring' | null = null;

    const answers = await Answer.countDocuments({ question: questionId });
    if (answers === 0 && Date.now() - new Date(q.createdAt).getTime() > day) reason = 'unanswered';

    if (!reason) {
      const recent = await Question.countDocuments({
        user: me.id,
        subject: q.subject,
        createdAt: { $gte: new Date(Date.now() - 15 * day) }
      });
      if (recent >= 3) reason = 'recurring';
    }

    return NextResponse.json({
      success: true,
      data: reason ? { suggest: true, reason, subject: q.subject, level: q.classLevel } : { suggest: false }
    });
  } catch (error) {
    return serverError('GET /api/suivi/suggestion', error);
  }
}
