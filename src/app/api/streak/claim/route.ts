import { NextRequest, NextResponse } from 'next/server';
import { currentUserEmail } from '@/lib/bearerUser';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { StreakService } from '@/lib/streakService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const email = await currentUserEmail();
    if (!email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Rate limit: 5 claims par minute
    const rl = rateLimit(`streak-claim:${email}`, 5, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    const { milestoneDays } = await req.json();

    if (!milestoneDays || typeof milestoneDays !== 'number') {
      return NextResponse.json({ error: 'Palier invalide' }, { status: 400 });
    }

    const result = await StreakService.claimMilestone(user._id.toString(), milestoneDays);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Verifier les badges (streak, points)
    const { BadgeService } = await import('@/lib/badgeService');
    await BadgeService.triggerBadgeCheck(user._id.toString());

    return NextResponse.json({
      success: true,
      rewards: result.rewards,
      badge: result.badge
    });
  } catch (error) {
    console.error('Erreur lors de la reclamation du palier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la reclamation du palier' },
      { status: 500 }
    );
  }
}
