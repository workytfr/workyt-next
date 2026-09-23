import { NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import dbConnect from '@/lib/mongodb';
import ClanWeeklyReward from '@/models/ClanWeeklyReward';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clan/rewards — le butin de fin de guerre pas encore vu.
 *
 * Les coffres ont été ouverts par la résolution du dimanche : on rejoue ici
 * leur résultat, pour que le joueur voie enfin ce qu'il a gagné.
 * POST — marque ce butin comme vu (la fenêtre ne revient plus).
 */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const reward = await ClanWeeklyReward.findOne({ user: me.id, seenAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .lean<any>();

    return NextResponse.json({ success: true, reward: reward ?? null });
  } catch (error) {
    console.error('Erreur GET /api/clan/rewards:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    await ClanWeeklyReward.updateMany(
      { user: me.id, seenAt: { $exists: false } },
      { $set: { seenAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur POST /api/clan/rewards:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
