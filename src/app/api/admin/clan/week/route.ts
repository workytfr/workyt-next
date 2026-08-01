import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { resolveDay } from '@/lib/clanResolution';
import { resolveWeek } from '@/lib/clanWeekly';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/clan/week — force le bilan de la semaine.
 *
 * Reproduit exactement le cron du dimanche 23h50 : dernière journée d'abord,
 * bilan ensuite. Existe pour tester sans attendre la fin de semaine.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const day = await resolveDay();
    const week = await resolveWeek();

    return NextResponse.json({ success: true, data: { day, week } });
  } catch (error) {
    console.error('Erreur POST /api/admin/clan/week:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
