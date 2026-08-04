import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import Chest from '@/models/Chest';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { withOdds } from '@/lib/chestOdds';

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

    // Rate limit: 5 requêtes par minute par compte
    const rl = rateLimit(`chests:${session.user.email}`, 5, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    await connectDB();
    
    const chests = await Chest.find({ isActive: true }).sort({ 
      type: 1 // Trier par type: common, rare, epic, legendary
    });

    // Probabilités : calcul partagé avec la page des clans (voir chestOdds.ts)
    const chestsWithProbabilities = chests.map(withOdds);

    return NextResponse.json({ chests: chestsWithProbabilities }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des coffres:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

