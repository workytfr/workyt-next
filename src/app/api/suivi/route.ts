import { NextRequest, NextResponse } from 'next/server';
import { currentSuiviUser, canMentor, canManage } from '@/lib/mentorship/access';
import { createRequest } from '@/lib/mentorship/service';
import { listForStudent, listForMentor } from '@/lib/mentorship/view';
import { respond, unauthorized, serverError } from '@/lib/mentorship/http';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/suivi — mes suivis (en tant qu'élève, et en tant que bénévole si
 * j'accompagne), plus mes droits pour que l'interface sache quoi montrer.
 */
export async function GET() {
  try {
    const me = await currentSuiviUser();
    if (!me) return NextResponse.json({ success: true, data: { authenticated: false } });

    const [mentor, manage] = await Promise.all([canMentor(me), canManage(me)]);
    const asStudent = await listForStudent(me.id);
    const asMentor = mentor ? await listForMentor(me.id) : null;

    return NextResponse.json({
      success: true,
      data: { authenticated: true, me, canMentor: mentor, canManage: manage, asStudent, asMentor }
    });
  } catch (error) {
    return serverError('GET /api/suivi', error);
  }
}

/** POST /api/suivi — demander un accompagnement */
export async function POST(req: NextRequest) {
  try {
    const me = await currentSuiviUser();
    if (!me) return unauthorized();

    const rl = rateLimit(`suivi-demande:${me.id}`, 3, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const result = await createRequest(me, {
      format: body?.format,
      subject: String(body?.subject ?? ''),
      level: String(body?.level ?? ''),
      need: String(body?.need ?? ''),
      goalType: body?.goalType,
      availability: String(body?.availability ?? '')
    });
    return respond(result, 201);
  } catch (error) {
    return serverError('POST /api/suivi', error);
  }
}
