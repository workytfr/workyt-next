import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { QuestService } from '@/lib/questService';

/**
 * GET /api/quests - Récupérer les quêtes de l'utilisateur
 * Query params: type (optional) - 'daily' | 'weekly' | 'monthly'
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
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'daily' | 'weekly' | 'monthly' | null;

    // Vérifier si des quêtes existent dans la base de données
    const Quest = (await import('@/models/Quest')).default;
    const questCount = await Quest.countDocuments({ isActive: true });
    
    if (questCount === 0) {
      return NextResponse.json(
        { 
          quests: [],
          error: 'Aucune quête n\'existe dans la base de données. Veuillez exécuter le script de seed: npx ts-node scripts/seedQuests.ts',
          needsSeed: true
        },
        { status: 200 }
      );
    }

    const quests = await QuestService.getUserQuests(user._id.toString(), type || undefined);

    return NextResponse.json({ quests }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des quêtes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

