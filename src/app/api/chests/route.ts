import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import Chest from '@/models/Chest';

/**
 * GET /api/chests - Récupérer tous les coffres avec leurs récompenses possibles
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const chests = await Chest.find({ isActive: true }).sort({ 
      type: 1 // Trier par type: common, rare, epic, legendary
    });

    // Calculer les probabilités pour chaque récompense
    const chestsWithProbabilities = chests.map(chest => {
      const totalWeight = chest.possibleRewards.reduce((sum: number, reward: any) => sum + reward.weight, 0);
      
      const rewardsWithProbability = chest.possibleRewards.map((reward: any) => {
        const probability = Math.round((reward.weight / totalWeight) * 100);
        return {
          ...reward.toObject(),
          probability
        };
      });

      return {
        _id: chest._id,
        type: chest.type,
        name: chest.name,
        description: chest.description,
        possibleRewards: rewardsWithProbability
      };
    });

    return NextResponse.json({ chests: chestsWithProbabilities }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des coffres:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

