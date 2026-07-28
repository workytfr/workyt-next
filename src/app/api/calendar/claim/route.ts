import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { claimDailyReward } from '@/lib/calendarService';
import User from '@/models/User';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limit: 3 claims par minute par compte
    const rl = rateLimit(`calendar-claim:${session.user.email}`, 3, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { date } = await req.json();
    
    if (!date) {
      return NextResponse.json({ error: 'Date requise' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const claimDate = new Date(date);
    const result = await claimDailyReward(user._id.toString(), claimDate);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Verifier les badges (calendar_claims, streak, points)
    const { BadgeService } = await import('@/lib/badgeService');
    await BadgeService.triggerBadgeCheck(user._id.toString());

    // Plateau de l'Aventure : cartes hebdomadaires + set complet (ne doit pas bloquer le claim)
    let cardEarned: { week: number; theme: string } | undefined;
    let setCompleted: boolean | undefined;
    let setChestReward: any;
    try {
      const { checkAndGrantCard } = await import('@/lib/adventureService');
      const cardResult = await checkAndGrantCard(user._id.toString(), claimDate);
      cardEarned = cardResult.cardEarned;
      setCompleted = cardResult.setCompleted;
      setChestReward = cardResult.setChestReward;
    } catch (err) {
      console.error('Erreur checkAndGrantCard:', err);
    }

    // Streak courant pour l'affichage du plateau
    let currentStreak: number | undefined;
    try {
      const { StreakService } = await import('@/lib/streakService');
      const streakInfo = await StreakService.getStreakInfo(user._id.toString());
      currentStreak = streakInfo.currentStreak;
    } catch (err) {
      console.error('Erreur getStreakInfo:', err);
    }

    // RPG : loot de boss si c'est le 15 du mois (ne doit pas bloquer le claim)
    let bossLoot: any;
    if (claimDate.getDate() === 15) {
      try {
        const { grantBossLoot } = await import('@/lib/heroService');
        const loot = await grantBossLoot(user._id.toString());
        if (loot.granted && loot.equipment) {
          bossLoot = {
            id: loot.equipment.id,
            name: loot.equipment.name,
            emoji: loot.equipment.emoji,
            rarity: loot.equipment.rarity,
            slot: loot.equipment.slot,
            stat: loot.equipment.stat,
            flavor: loot.equipment.flavor,
            autoEquipped: loot.autoEquipped
          };
        }
      } catch (err) {
        console.error('Erreur grantBossLoot:', err);
      }
    }

    return NextResponse.json({
      success: true,
      rewardType: result.rewardType,
      amount: result.amount,
      chestType: result.chestType,
      chestReward: result.chestReward,
      cardEarned,
      setCompleted,
      setChestReward,
      currentStreak,
      bossLoot
    });
  } catch (error: any) {
    console.error('Erreur lors de la réclamation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réclamation de la récompense' },
      { status: 500 }
    );
  }
}

