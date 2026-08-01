import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { resolveDay, warDay } from '@/lib/clanResolution';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/clan/resolve — force la résolution de la journée.
 *
 * Le cron s'en charge chaque nuit à 00h01 ; cette route existe pour tester
 * sans attendre minuit. Idempotente : l'index unique {clan, day} empêche une
 * seconde résolution du même jour.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const result = await resolveDay();
    return NextResponse.json({ success: true, data: { ...result, currentDay: warDay() } });
  } catch (error) {
    console.error('Erreur POST /api/admin/clan/resolve:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
