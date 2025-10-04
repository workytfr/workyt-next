import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProfileCustomization from '@/models/ProfileCustomization';
import User from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();
    
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les personnalisations de l'utilisateur
    const customization = await ProfileCustomization.findOne({ user: userId });

    // Retourner les données (même si null, pour permettre au frontend de gérer)
    return NextResponse.json({
      success: true,
      data: {
        customization: customization || {
          usernameColor: { type: 'solid', value: '#3B82F6', isActive: false },
          profileImage: { filename: '', isActive: false },
          profileBorder: { filename: '', isActive: false }
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la personnalisation:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération' 
    }, { status: 500 });
  }
}

