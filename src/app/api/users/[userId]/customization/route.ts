import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import ProfileCustomization from '@/models/ProfileCustomization';
import User from '@/models/User';
import Badge from '@/models/Badge';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const { userId } = await params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Utilisateur (seul le badge choisi sert ici) et personnalisation en parallèle :
    // avant, le document utilisateur entier était lu, puis la personnalisation.
    const [user, customization] = await Promise.all([
      User.findById(userId).select('selectedBadge').lean<{ selectedBadge?: string }>(),
      // customPhoto : seulement l'URL et l'état, jamais la clé R2 (comme la route groupée)
      ProfileCustomization.findOne({ user: userId })
        .select('user usernameColor profileImage profileBorder avatarLook customPhoto.url customPhoto.isActive')
        .lean(),
    ]);
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Recuperer l'icone du badge selectionne
    let selectedBadgeIcon: string | null = null;
    if (user.selectedBadge) {
      const badge = await Badge.findOne({ slug: user.selectedBadge }).select('icon').lean<{ icon?: string }>();
      if (badge) {
        selectedBadgeIcon = badge.icon ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        customization: customization || {
          usernameColor: { type: 'solid', value: '#3B82F6', isActive: false },
          profileImage: { filename: '', isActive: false },
          profileBorder: { filename: '', isActive: false },
          avatarLook: {},
          customPhoto: { url: '', isActive: false }
        },
        selectedBadgeIcon,
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la personnalisation:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération' 
    }, { status: 500 });
  }
}

