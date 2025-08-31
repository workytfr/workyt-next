import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Gem from '@/models/Gem';
import GemTransaction from '@/models/GemTransaction';
import Partner from '@/models/Partner';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { partnerId, offerType } = await req.json();

    if (!partnerId || !offerType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer le partenaire
    const partner = await Partner.findById(partnerId);
    if (!partner || !partner.isActive) {
      return NextResponse.json({ error: 'Partenaire non trouvé ou inactif' }, { status: 400 });
    }

    // Vérifier la validité de l'offre
    const offer = partner.offers[offerType];
    if (!offer) {
      return NextResponse.json({ error: 'Offre non disponible' }, { status: 400 });
    }

    let gemsCost = 0;
    let transactionDescription = '';

    if (offerType === 'free') {
      // Pour les offres gratuites, pas de coût
      gemsCost = 0;
      transactionDescription = `Offre gratuite ${partner.name} - ${offer.description}`;
    } else if (offerType === 'premium') {
      // Pour les offres premium, vérifier le solde de gemmes
      gemsCost = offer.gemsCost || 0;
      
      if (gemsCost > 0) {
        const userGem = await Gem.findOne({ user: user._id });
        if (!userGem || userGem.balance < gemsCost) {
          return NextResponse.json({ 
            error: `Solde insuffisant. Coût: ${gemsCost} gemmes, Solde: ${userGem?.balance || 0} gemmes` 
          }, { status: 400 });
        }
      }
      
      transactionDescription = `Offre premium ${partner.name} - ${offer.description}`;
    }

    // Créer la transaction
    const transaction = new GemTransaction({
      user: user._id,
      type: 'partner_offer',
      gems: -gemsCost, // Négatif car c'est une dépense
      description: transactionDescription,
      status: 'completed',
      partnerId: partner._id,
      offerType,
      metadata: {
        itemType: 'partner_offer',
        partnerName: partner.name,
        offerDescription: offer.description,
        promoCode: offer.promoCode // Code promo du partenaire
      }
    });

    await transaction.save();

    // Mettre à jour le solde de gemmes si nécessaire
    if (gemsCost > 0) {
      await Gem.findOneAndUpdate(
        { user: user._id },
        { 
          $inc: { balance: -gemsCost, totalSpent: gemsCost },
          $setOnInsert: { totalEarned: 0 }
        },
        { upsert: true, new: true }
      );
    }

    // Mettre à jour les statistiques du partenaire
    await Partner.findByIdAndUpdate(partnerId, {
      $inc: { totalUses: 1, totalSavings: offer.value || 0 }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Offre ${offerType === 'free' ? 'gratuite' : 'premium'} activée avec succès !`,
        promoCode: offer.promoCode, // Code promo pour achats en ligne
        promoDescription: offer.promoDescription, // Description de la promo
        partnerName: partner.name,
        offerDescription: offer.description,
        gemsCost,
        transactionId: transaction._id,
        additionalBenefits: offer.additionalBenefits || [],
        justificationRequired: offer.justificationRequired, // Si un justificatif est requis
        justificationType: offer.justificationType // Type de justificatif (image, QR, PDF)
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'activation de l\'offre partenaire:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'activation de l\'offre partenaire' 
    }, { status: 500 });
  }
}
