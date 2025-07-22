import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Badge from '@/models/Badge';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Si un userId est fourni, récupérer les badges de cet utilisateur
    if (userId) {
      const user = await User.findById(userId).select('badges');
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Récupérer les détails des badges de l'utilisateur
      const userBadges = await Badge.find({ slug: { $in: user.badges } });
      
      return NextResponse.json({
        userBadges: userBadges,
        totalBadges: user.badges.length
      });
    }

    // Sinon, récupérer tous les badges disponibles
    const allBadges = await Badge.find({}).sort({ category: 1 });
    
    return NextResponse.json({
      badges: allBadges,
      total: allBadges.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des badges:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des badges' },
      { status: 500 }
    );
  }
} 