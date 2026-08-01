import { NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import { getLatestReport } from '@/lib/clanResolution';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clan/report — le dernier rapport de bataille du joueur.
 *
 * Renvoie `data: null` s'il n'y a rien à montrer (pas enrôlé, ou aucune
 * journée encore résolue). Le client décide seul de l'afficher ou non,
 * selon ce qu'il a déjà vu.
 */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ success: true, data: null });

    const report = await getLatestReport(me.id);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Erreur GET /api/clan/report:', error);
    return NextResponse.json({ success: true, data: null });
  }
}
