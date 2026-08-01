import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { formClans, getActivePlayers, planClans, seasonKey, isEventWeek } from '@/lib/clanService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/clan/form — aperçu SANS rien créer.
 * Permet de voir ce que donnerait la formation avant de la déclencher.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const actives = await getActivePlayers();
    const plans = planClans(actives);

    return NextResponse.json({
      success: true,
      data: {
        season: seasonKey(),
        eventWeek: await isEventWeek(),
        activePlayers: actives.length,
        truce: plans.length === 0,
        clans: plans.map((p) => ({ tier: p.tier, size: p.members.length }))
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/admin/clan/form:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/admin/clan/form — déclenche la formation des clans.
 *
 * Provisoire : cette route existe pour tester tant que la tâche planifiée du
 * lundi n'est pas en place (jalon 3). Elle est idempotente — relancer ne
 * recrée pas les clans d'une saison déjà formée.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const result = await formClans();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur POST /api/admin/clan/form:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
