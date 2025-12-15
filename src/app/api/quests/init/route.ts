import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import Quest from '@/models/Quest';
import connectDB from '@/lib/mongodb';
import { QuestService } from '@/lib/questService';

/**
 * POST /api/quests/init - Initialiser les quêtes pour l'utilisateur actuel
 * Utile pour forcer l'initialisation si aucune quête n'est disponible
 */
export async function POST(req: NextRequest) {
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

    // Vérifier si des quêtes existent dans la base de données
    const questCount = await Quest.countDocuments({ isActive: true });
    
    if (questCount === 0) {
      return NextResponse.json(
        { 
          error: 'Aucune quête n\'existe dans la base de données. Veuillez exécuter le script de seed: npx ts-node scripts/seedQuests.ts',
          needsSeed: true
        },
        { status: 404 }
      );
    }

    // Initialiser les quêtes pour l'utilisateur
    await QuestService.initializeQuestsForUser(user._id.toString(), 'daily');
    await QuestService.initializeQuestsForUser(user._id.toString(), 'weekly');
    await QuestService.initializeQuestsForUser(user._id.toString(), 'monthly');

    // Récupérer les quêtes initialisées
    const quests = await QuestService.getUserQuests(user._id.toString());

    return NextResponse.json({ 
      success: true,
      message: `${quests.length} quêtes initialisées`,
      quests 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation des quêtes:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

