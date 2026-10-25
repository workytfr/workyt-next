import { NextRequest, NextResponse } from 'next/server';
import { currentUserEmail } from '@/lib/bearerUser';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { StreakService } from '@/lib/streakService';

export async function GET(req: NextRequest) {
  try {
    const email = await currentUserEmail();
    if (!email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    const streakInfo = await StreakService.getStreakInfo(user._id.toString());

    return NextResponse.json({
      success: true,
      data: streakInfo
    });
  } catch (error) {
    console.error('Erreur lors de la recuperation du streak:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation du streak' },
      { status: 500 }
    );
  }
}
