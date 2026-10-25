import { NextRequest, NextResponse } from 'next/server';
import { currentUserEmail } from '@/lib/bearerUser';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { MushroomService } from '@/lib/mushroomService';

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

    const balance = await MushroomService.getBalance(user._id.toString());
    const activeBoosts = await MushroomService.getActiveBoosts(user._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        ...balance,
        activeBoosts
      }
    });
  } catch (error) {
    console.error('Erreur lors de la recuperation des champignons:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des champignons' },
      { status: 500 }
    );
  }
}
