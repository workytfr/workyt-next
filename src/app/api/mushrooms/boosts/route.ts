import { NextRequest, NextResponse } from 'next/server';
import { currentUserEmail } from '@/lib/bearerUser';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { MushroomService, BOOST_CONFIG } from '@/lib/mushroomService';

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

    const activeBoosts = await MushroomService.getActiveBoosts(user._id.toString());
    const balance = await MushroomService.getBalance(user._id.toString());

    // Retourner la liste des boosts disponibles avec le solde
    const availableBoosts = Object.entries(BOOST_CONFIG).map(([key, config]) => ({
      type: key,
      ...config,
      canAfford: balance.balance >= config.cost,
      isActive: activeBoosts.some(b => b.boostType === key)
    }));

    return NextResponse.json({
      success: true,
      data: {
        balance: balance.balance,
        boosts: availableBoosts,
        activeBoosts
      }
    });
  } catch (error) {
    console.error('Erreur lors de la recuperation des boosts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des boosts' },
      { status: 500 }
    );
  }
}
