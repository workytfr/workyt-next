import { NextResponse } from 'next/server';
import { currentUser } from '../friends/_auth';
import { getMyClan, seasonKey, isEventWeek } from '@/lib/clanService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clan — mon clan de la semaine, son adversaire et ses membres.
 *
 * Renvoie `clan: null` avec une raison si le joueur n'est pas enrôlé :
 * semaine d'événement, trêve, ou joueur inactif.
 */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const data = await getMyClan(me.id);

    if (!data) {
      const eventWeek = await isEventWeek();
      return NextResponse.json({
        success: true,
        data: {
          season: seasonKey(),
          clan: null,
          reason: eventWeek ? 'event_week' : 'not_enrolled'
        }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur GET /api/clan:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
