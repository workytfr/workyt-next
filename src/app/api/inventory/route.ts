import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import OwnedCosmetic from '@/models/OwnedCosmetic';
import ProfileCustomization from '@/models/ProfileCustomization';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

// GET /api/inventory - Récupérer l'inventaire de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const ownedCosmetics = await OwnedCosmetic.find({ user: user._id }).sort({ acquiredAt: -1 });
    const customization = await ProfileCustomization.findOne({ user: user._id });

    return NextResponse.json({
      success: true,
      inventory: ownedCosmetics,
      equipped: {
        profileImage: customization?.profileImage?.isActive ? customization.profileImage.filename : null,
        profileBorder: customization?.profileBorder?.isActive ? customization.profileBorder.filename : null,
        usernameColor: customization?.usernameColor?.isActive ? {
          type: customization.usernameColor.type,
          value: customization.usernameColor.value,
        } : null,
      }
    });
  } catch (error) {
    console.error('Erreur inventaire:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// POST /api/inventory/equip - Équiper un cosmétique possédé
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limit: 10 équipements par minute par compte
    const rl = rateLimit(`inventory-equip:${session.user.email}`, 10, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { cosmeticType, cosmeticId, action } = await req.json();

    if (!cosmeticType || !action) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Vérifier que l'utilisateur possède ce cosmétique (sauf pour déséquiper)
    if (action === 'equip') {
      const owned = await OwnedCosmetic.findOne({
        user: user._id,
        cosmeticType,
        cosmeticId,
      });

      if (!owned) {
        return NextResponse.json({ error: 'Vous ne possédez pas ce cosmétique' }, { status: 403 });
      }
    }

    const updateData: any = {};

    if (action === 'equip') {
      if (cosmeticType === 'profile_image') {
        updateData['profileImage.filename'] = cosmeticId;
        updateData['profileImage.isActive'] = true;
      } else if (cosmeticType === 'profile_border') {
        // Mapper les valeurs aux fichiers
        const borderFileMap: Record<string, string> = {
          'gold': 'gold.svg',
          'silver': 'silver.svg',
          'eclair_green': 'eclair_green.apng',
          'fumee': 'fumee.png',
          'poison_orange': 'poison_orange.png',
          'halloween_pumpkins_apng': 'halloween_pumpkins_apng.png',
          'yumego_manga': 'yumego_manga.svg',
        };
        updateData['profileBorder.filename'] = borderFileMap[cosmeticId] || cosmeticId;
        updateData['profileBorder.isActive'] = true;
      } else if (cosmeticType === 'username_color') {
        updateData['usernameColor.type'] = cosmeticId;
        updateData['usernameColor.isActive'] = true;
      }
    } else if (action === 'unequip') {
      if (cosmeticType === 'profile_image') {
        updateData['profileImage.isActive'] = false;
      } else if (cosmeticType === 'profile_border') {
        updateData['profileBorder.isActive'] = false;
      } else if (cosmeticType === 'username_color') {
        updateData['usernameColor.isActive'] = false;
      }
    }

    await ProfileCustomization.findOneAndUpdate(
      { user: user._id },
      updateData,
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur equip:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
