import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { StreakService } from '@/lib/streakService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
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
