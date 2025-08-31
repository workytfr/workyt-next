import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Partner from '@/models/Partner';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

// Enregistrer une police personnalisée si disponible
try {
  registerFont(path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf'), { family: 'Inter-Bold' });
  registerFont(path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf'), { family: 'Inter-Regular' });
} catch (error) {
  console.log('Polices personnalisées non disponibles, utilisation des polices par défaut');
}

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
      return NextResponse.json({ error: 'Partenaire non trouvé ou inactif' }, { status: 404 });
    }

    // Vérifier la validité de l'offre
    const offer = partner.offers[offerType];
    if (!offer) {
      return NextResponse.json({ error: 'Offre non disponible' }, { status: 400 });
    }

    // Générer le justificatif
    const justificationImage = await generateJustificationImage({
      partnerName: partner.name,
      partnerLogo: partner.logo,
      userName: user.username,
      offerType: offerType === 'free' ? 'Offre Gratuite' : 'Offre Premium',
      offerDescription: offer.description,
      offerValue: offer.type === 'percentage' ? `${offer.value}%` : 
                  offer.type === 'fixed' ? `${offer.value}€` : offer.description,
      gemsCost: offerType === 'premium' ? offer.gemsCost : 0,
      date: new Date(),
      justificationType: offer.justificationType || 'image'
    });

    return NextResponse.json({
      success: true,
      data: {
        justificationImage: justificationImage,
        message: 'Justificatif généré avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du justificatif:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la génération du justificatif' 
    }, { status: 500 });
  }
}

interface JustificationData {
  partnerName: string;
  partnerLogo: string;
  userName: string;
  offerType: string;
  offerDescription: string;
  offerValue: string;
  gemsCost: number;
  date: Date;
  justificationType: string;
}

async function generateJustificationImage(data: JustificationData): Promise<string> {
  // Créer un canvas
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // Couleurs et styles
  const backgroundColor = '#1F2937';
  const primaryColor = '#3B82F6';
  const secondaryColor = '#10B981';
  const textColor = '#FFFFFF';
  const accentColor = '#F59E0B';

  // Fond
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, 800, 600);

  // En-tête avec logo Workyt
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, 800, 80);
  
  // Logo Workyt (texte stylisé)
  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px Inter-Bold, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WORKYT AWARD', 400, 50);

  // Informations du partenaire
  ctx.fillStyle = textColor;
  ctx.font = 'bold 28px Inter-Bold, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.partnerName, 400, 140);

  // Type d'offre
  ctx.fillStyle = data.offerType.includes('Gratuite') ? secondaryColor : accentColor;
  ctx.font = 'bold 24px Inter-Bold, Arial, sans-serif';
  ctx.fillText(data.offerType, 400, 180);

  // Description de l'offre
  ctx.fillStyle = textColor;
  ctx.font = '18px Inter-Regular, Arial, sans-serif';
  ctx.fillText(data.offerDescription, 400, 220);

  // Valeur de l'offre
  ctx.fillStyle = secondaryColor;
  ctx.font = 'bold 36px Inter-Bold, Arial, sans-serif';
  ctx.fillText(data.offerValue, 400, 280);

  // Informations utilisateur
  ctx.fillStyle = textColor;
  ctx.font = '16px Inter-Regular, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Utilisateur: ${data.userName}`, 50, 350);

  // Coût en gemmes (si applicable)
  if (data.gemsCost > 0) {
    ctx.fillText(`Coût: ${data.gemsCost} gemmes`, 50, 380);
  }

  // Date de génération
  ctx.fillText(`Généré le: ${data.date.toLocaleDateString('fr-FR')}`, 50, 410);
  ctx.fillText(`Heure: ${data.date.toLocaleTimeString('fr-FR')}`, 50, 440);

  // Instructions d'utilisation
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 18px Inter-Bold, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Présentez ce justificatif au commerçant', 400, 500);

  // Code QR ou informations supplémentaires
  if (data.justificationType === 'qr') {
    // Ici on pourrait générer un vrai QR code
    ctx.fillStyle = textColor;
    ctx.font = '14px Inter-Regular, Arial, sans-serif';
    ctx.fillText('QR Code généré automatiquement', 400, 540);
  }

  // Bordure décorative
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 780, 580);

  // Convertir en base64
  return canvas.toDataURL('image/png');
}
