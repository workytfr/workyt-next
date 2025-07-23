import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { BadgeService } from '@/lib/badgeService';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { userId } = await request.json();
    
    // Vérifier que l'utilisateur peut vérifier ses propres badges ou est admin
    if (session.user.id !== userId && session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Déclencher la vérification des badges
    await BadgeService.triggerBadgeCheck(userId);
    
    return NextResponse.json({
      message: 'Vérification des badges terminée',
      userId: userId
    });

  } catch (error) {
    console.error('Erreur lors de la vérification des badges:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des badges' },
      { status: 500 }
    );
  }
} 