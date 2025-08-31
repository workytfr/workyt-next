import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Gem from '@/models/Gem';
import ProfileCustomization from '@/models/ProfileCustomization';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer le solde de gemmes
    const gemDoc = await Gem.findOne({ user: user._id });
    
    // Récupérer les personnalisations
    const customization = await ProfileCustomization.findOne({ user: user._id });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          points: user.points
        },
        gems: {
          balance: gemDoc?.balance || 0,
          totalEarned: gemDoc?.totalEarned || 0,
          totalSpent: gemDoc?.totalSpent || 0
        },
        customization: {
          usernameColor: customization?.usernameColor || {
            type: 'solid',
            value: '#3B82F6',
            isActive: false
          },
          profileImage: customization?.profileImage || {
            filename: '',
            isActive: false
          },
          profileBorder: customization?.profileBorder || {
            filename: '',
            isActive: false
          }
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du solde' 
    }, { status: 500 });
  }
}
