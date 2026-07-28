import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getHeroCombatState } from '@/lib/heroService';
import { getTodayMonster } from '@/lib/dailyMonster';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hero/monster-strike — le monstre feinte quand le minuteur expire.
 *
 * ⚠️ N'inflige PLUS de dégâts. Le temps de réflexion est sanctionné par le
 * multiplicateur d'XP (voir xpTimeMultiplier), jamais par les PV : sinon on
 * punissait l'élève qui va relire son cours aussi fort que le tricheur.
 * Cette route ne sert plus qu'à la mise en scène (réplique + animation).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const rl = rateLimit(`monster-strike:${session.user.email}`, 6, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id').lean<{ _id: any }>();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userId = user._id.toString();
    // État de combat allégé : pas besoin de lire l'inventaire d'équipement ici
    const heroState = await getHeroCombatState(userId);
    const monster = await getTodayMonster(heroState.level);

    // Aucun dégât : le monstre feinte, le joueur perd du multiplicateur d'XP.
    return NextResponse.json({
      damage: 0,
      hp: heroState.hp,
      fainted: heroState.fainted,
      critical: false,
      poisoned: false,
      taunt: true, // l'UI joue la réplique + l'animation d'esquive
      monsterAttack: monster.attack,
      monsterPower: monster.power
    });
  } catch (error) {
    console.error('Erreur POST /api/hero/monster-strike:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
