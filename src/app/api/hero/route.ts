import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getHeroState } from '@/lib/heroService';
import { getTodayMonster } from '@/lib/dailyMonster';
import { MushroomService } from '@/lib/mushroomService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hero — état du héros RPG + monstre du jour + solde de champignons.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id').lean<{ _id: any }>();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = user._id.toString();
    const hero = await getHeroState(userId);

    // Monstre du jour + solde : indépendants, on les récupère en parallèle
    const [monster, mushrooms] = await Promise.all([
      getTodayMonster(hero.level),
      MushroomService.getBalance(userId)
    ]);

    return NextResponse.json({
      hero,
      monster,
      mushrooms: mushrooms.balance
    });
  } catch (error) {
    console.error('Erreur GET /api/hero:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
