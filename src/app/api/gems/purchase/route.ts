import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Gem from '@/models/Gem';
import GemTransaction from '@/models/GemTransaction';
import ProfileCustomization from '@/models/ProfileCustomization';
import mongoose from 'mongoose';
import { GEM_CONFIG } from '@/lib/gemConfig';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { itemType, itemValue, itemId } = await req.json();
    
    if (!itemType || !itemValue) {
      return NextResponse.json({ 
        error: 'Type et valeur de l\'article requis' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Calculer le prix en gemmes
    let price = 0;
    if (itemType === 'usernameColor') {
      price = GEM_CONFIG.PRICES.usernameColor[itemValue as keyof typeof GEM_CONFIG.PRICES.usernameColor] || 0;
    } else if (itemType === 'profileImage' && itemValue) {
      price = GEM_CONFIG.PRICES.profileImage[itemValue as keyof typeof GEM_CONFIG.PRICES.profileImage] || 0;
    } else if (itemType === 'profileBorder' && itemValue) {
      price = GEM_CONFIG.PRICES.profileBorder[itemValue as keyof typeof GEM_CONFIG.PRICES.profileBorder] || 0;
    }

    if (price === 0) {
      return NextResponse.json({ 
        error: 'Type d\'article invalide' 
      }, { status: 400 });
    }

    // Déduire les gemmes de manière atomique (vérification + déduction en une seule opération)
    const updatedGem = await Gem.findOneAndUpdate(
      { user: user._id, balance: { $gte: price } },
      {
        $inc: {
          balance: -price,
          totalSpent: price
        }
      },
      { new: true }
    );

    if (!updatedGem) {
      const gemDoc = await Gem.findOne({ user: user._id });
      return NextResponse.json({
        error: 'Gemmes insuffisantes',
        required: price,
        current: gemDoc?.balance || 0
      }, { status: 400 });
    }

    // Créer ou mettre à jour la personnalisation
    const updateData: any = {};
    
    if (itemType === 'usernameColor') {
      updateData['usernameColor.type'] = itemValue;
      updateData['usernameColor.isActive'] = true;
      if (itemValue === 'custom' && itemId) {
        updateData['usernameColor.value'] = itemId; // Code couleur personnalisé
      }
    } else if (itemType === 'profileImage') {
      updateData['profileImage.filename'] = itemValue;
      updateData['profileImage.isActive'] = true;
    } else if (itemType === 'profileBorder') {
      // Mapper les valeurs aux fichiers SVG/PNG
      const borderFileMap: { [key: string]: string } = {
        'gold': 'gold.svg',
        'silver': 'silver.svg',
        'eclair_green': 'eclair_green.apng',
        'fumee': 'fumee.png',
        'poison_orange': 'poison_orange.png',
        'halloween_pumpkins_apng': 'halloween_pumpkins_apng.png',
        'yumego_manga': 'yumego_manga.svg'
      };
      const filename = borderFileMap[itemValue] || itemValue;
      updateData['profileBorder.filename'] = filename;
      updateData['profileBorder.isActive'] = true;
    }

    const updatedCustomization = await ProfileCustomization.findOneAndUpdate(
      { user: user._id },
      updateData,
      { 
        upsert: true, 
        new: true
      }
    );

    if (!updatedCustomization) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la personnalisation' }, { status: 500 });
    }

    // Enregistrer la transaction
    await GemTransaction.create({
      user: user._id,
      type: 'purchase',
      gems: -price,
      description: `Achat de ${itemType}: ${itemValue} pour ${price} gemmes`,
      metadata: {
        itemType,
        itemId: itemValue
      }
    });

    // Le solde est déjà mis à jour dans updatedGem

    return NextResponse.json({
      success: true,
      message: 'Personnalisation achetée avec succès !',
      data: {
        itemType,
        itemValue,
        price,
        newGemBalance: updatedGem?.balance || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'achat:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'achat' 
    }, { status: 500 });
  }
}
