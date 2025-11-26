import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { QuestService } from '@/lib/questService';
import { isValidObjectId } from 'mongoose';

/**
 * POST /api/quests/[id]/claim - Réclamer les récompenses d'une quête complétée
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'ID de quête invalide' },
        { status: 400 }
      );
    }

    const rewards = await QuestService.claimQuestRewards(user._id.toString(), id);

    return NextResponse.json({ 
      success: true,
      rewards 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la réclamation des récompenses:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

