import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentSuiviUser, canMentor, canManage } from '@/lib/mentorship/access';
import { saveMentorProfile } from '@/lib/mentorship/service';
import { getMentorProfile, mentorEngagement } from '@/lib/mentorship/view';
import { respond, unauthorized, forbidden, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/suivi/mentor — mon profil de bénévole et mon engagement chiffré.
 * `?userId=` : la modération consulte l'engagement d'un autre bénévole
 * (pour rédiger son attestation).
 */
export async function GET(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();

    const target = req.nextUrl.searchParams.get('userId');
    if (target && target !== me.id) {
      if (!(await canManage(me))) return forbidden();
      if (!mongoose.isValidObjectId(target)) return forbidden();
      return NextResponse.json({
        success: true,
        data: { profile: await getMentorProfile(target), engagement: await mentorEngagement(target) }
      });
    }

    if (!(await canMentor(me))) return forbidden('Réservé aux bénévoles accompagnants.');
    return NextResponse.json({
      success: true,
      data: { profile: await getMentorProfile(me.id), engagement: await mentorEngagement(me.id) }
    });
  } catch (error) {
    return serverError('GET /api/suivi/mentor', error);
  }
}

/** PUT /api/suivi/mentor — disponibilité, quota, matières, présentation, charte */
export async function PUT(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();
    if (!(await canMentor(me))) return forbidden('Réservé aux bénévoles accompagnants.');

    const rl = rateLimit(`suivi-profil:${me.id}`, 20, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    return respond(
      await saveMentorProfile(me, {
        status: body?.status,
        maxActive: typeof body?.maxActive === 'number' ? body.maxActive : undefined,
        subjects: Array.isArray(body?.subjects) ? body.subjects.map(String) : undefined,
        levels: Array.isArray(body?.levels) ? body.levels.map(String) : undefined,
        bio: typeof body?.bio === 'string' ? body.bio : undefined,
        acceptCharter: body?.acceptCharter === true,
        adultDeclared: body?.adultDeclared === true
      })
    );
  } catch (error) {
    return serverError('PUT /api/suivi/mentor', error);
  }
}
