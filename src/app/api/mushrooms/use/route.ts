import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { MushroomService, BOOST_CONFIG } from '@/lib/mushroomService';
import { BoostType } from '@/models/MushroomTransaction';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Rate limit: 5 utilisations par minute
    const rl = rateLimit(`mushroom-use:${session.user.email}`, 5, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    const { boostType } = await req.json();

    if (!boostType || !BOOST_CONFIG[boostType as BoostType]) {
      return NextResponse.json({ error: 'Type de boost invalide' }, { status: 400 });
    }

    const result = await MushroomService.useBoost(user._id.toString(), boostType as BoostType);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Verifier les badges (mushroom_used)
    const { BadgeService } = await import('@/lib/badgeService');
    await BadgeService.triggerBadgeCheck(user._id.toString());

    return NextResponse.json({
      success: true,
      boost: result.boost
    });
  } catch (error) {
    console.error('Erreur lors de l\'utilisation du champignon:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'utilisation du champignon' },
      { status: 500 }
    );
  }
}
