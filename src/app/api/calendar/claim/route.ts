import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { claimDailyReward } from '@/lib/calendarService';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      rewardType: result.rewardType,
      amount: result.amount,
      chestType: result.chestType,
      chestReward: result.chestReward
    });
  } catch (error: any) {
    console.error('Erreur lors de la réclamation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réclamation de la récompense' },
      { status: 500 }
    );
  }
}

