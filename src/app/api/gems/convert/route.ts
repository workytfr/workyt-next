import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Gem from '@/models/Gem';
import GemTransaction from '@/models/GemTransaction';
import mongoose from 'mongoose';
import { GEM_CONFIG, gemUtils } from '@/lib/gemConfig';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { points } = await req.json();
    
    if (!points || points < GEM_CONFIG.CONVERSION_RATE) {
      return NextResponse.json({ 
        error: `Minimum ${GEM_CONFIG.CONVERSION_RATE} points requis pour la conversion` 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur a assez de points
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.points < points) {
      return NextResponse.json({ 
        error: 'Points insuffisants' 
      }, { status: 400 });
    }

    // Calculer les gemmes à recevoir
    const gemsToReceive = Math.floor(points / GEM_CONFIG.CONVERSION_RATE);
    const actualPointsUsed = gemsToReceive * GEM_CONFIG.CONVERSION_RATE;

    // Opérations atomiques sans transactions (pour base locale)
    
    // Déduire les points de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { points: -actualPointsUsed } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour des points' }, { status: 500 });
    }

    // Créer ou mettre à jour le solde de gemmes
    const gemDoc = await Gem.findOneAndUpdate(
      { user: user._id },
      { 
        $inc: { 
          balance: gemsToReceive,
          totalEarned: gemsToReceive
        }
      },
      { 
        upsert: true, 
        new: true
      }
    );

    if (!gemDoc) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour des gemmes' }, { status: 500 });
    }

    // Enregistrer la transaction
    await GemTransaction.create({
      user: user._id,
      type: 'conversion',
      points: actualPointsUsed,
      gems: gemsToReceive,
      description: `Conversion de ${actualPointsUsed} points en ${gemsToReceive} gemmes`,
      metadata: {
        conversionRate: GEM_CONFIG.CONVERSION_RATE
      }
    });

    // Récupérer le solde mis à jour
    const updatedGem = await Gem.findOne({ user: user._id });

    return NextResponse.json({
      success: true,
      message: `${gemsToReceive} gemmes ajoutées !`,
      data: {
        gemsEarned: gemsToReceive,
        pointsUsed: actualPointsUsed,
        newGemBalance: updatedGem?.balance || 0,
        newPointBalance: updatedUser?.points || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la conversion' 
    }, { status: 500 });
  }
}
