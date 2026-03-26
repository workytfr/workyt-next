import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Gem from '@/models/Gem';
import GemTransaction from '@/models/GemTransaction';
import Partner from '@/models/Partner';
import PromoCode from '@/models/PromoCode';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limit: 3 offres par minute par compte
    const rl = rateLimit(`partner-offer:${session.user.email}`, 3, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const { partnerId, offerType } = await req.json();

    if (!partnerId || !offerType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier si l'utilisateur a déjà un code promo pour CE partenaire
    const existingCode = await PromoCode.findOne({ assignedTo: user._id, partnerId });
    if (existingCode) {
      return NextResponse.json({
        success: true,
        alreadyHasCode: true,
        data: {
          message: 'Vous avez déjà un code promo pour ce partenaire.',
          promoCode: existingCode.code,
          partnerName: (await Partner.findById(existingCode.partnerId))?.name || 'Partenaire',
          offerType: existingCode.offerType,
          partnerId: existingCode.partnerId,
          assignedAt: existingCode.assignedAt
        }
      });
    }

    // Récupérer le partenaire
    const partner = await Partner.findById(partnerId);
    if (!partner || !partner.isActive) {
      return NextResponse.json({ error: 'Partenaire non trouvé ou inactif' }, { status: 400 });
    }

    // Vérifier que le partenaire n'est pas expiré
    if (partner.endDate && new Date(partner.endDate) < new Date()) {
      return NextResponse.json({ error: 'Cette offre a expiré' }, { status: 400 });
    }

    // Vérifier que ce type d'offre est activé
    const isOfferEnabled = partner.offersEnabled?.[offerType as 'free' | 'premium'] ?? true;
    if (!isOfferEnabled) {
      return NextResponse.json({ error: 'Ce type d\'offre n\'est pas disponible pour ce partenaire' }, { status: 400 });
    }

    // Vérifier la validité de l'offre
    const offer = partner.offers[offerType as 'free' | 'premium'];
    if (!offer) {
      return NextResponse.json({ error: 'Offre non disponible' }, { status: 400 });
    }

    // Vérifier qu'il reste des codes disponibles dans le pool
    const availableCode = await PromoCode.findOne({
      partnerId,
      offerType,
      assignedTo: null
    });

    if (!availableCode) {
      return NextResponse.json({
        error: 'Plus de codes promo disponibles pour cette offre. Revenez plus tard !'
      }, { status: 400 });
    }

    let gemsCost = 0;
    let transactionDescription = '';

    if (offerType === 'free') {
      gemsCost = 0;
      transactionDescription = `Offre gratuite ${partner.name} - ${offer.description}`;
    } else if (offerType === 'premium') {
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

    // Attribuer le code à l'utilisateur (atomic pour éviter les races)
    const assignedCode = await PromoCode.findOneAndUpdate(
      {
        _id: availableCode._id,
        assignedTo: null // Double check atomique
      },
      {
        $set: {
          assignedTo: user._id,
          assignedAt: new Date()
        }
      },
      { new: true }
    );

    if (!assignedCode) {
      // Race condition : le code a été pris entre-temps
      return NextResponse.json({
        error: 'Le code a été attribué à un autre utilisateur. Réessayez.'
      }, { status: 409 });
    }

    // Créer la transaction
    const transaction = new GemTransaction({
      user: user._id,
      type: 'partner_offer',
      gems: -gemsCost,
      description: transactionDescription,
      status: 'completed',
      partnerId: partner._id,
      offerType,
      metadata: {
        itemType: 'partner_offer',
        partnerName: partner.name,
        offerDescription: offer.description,
        promoCode: assignedCode.code
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
        message: `Code promo attribué avec succès !`,
        promoCode: assignedCode.code,
        promoDescription: offer.promoDescription,
        partnerName: partner.name,
        offerDescription: offer.description,
        gemsCost,
        transactionId: transaction._id,
        additionalBenefits: offer.additionalBenefits || [],
        justificationRequired: offer.justificationRequired,
        justificationType: offer.justificationType
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'activation de l\'offre partenaire:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'activation de l\'offre partenaire'
    }, { status: 500 });
  }
}
