import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import PromoCode from '@/models/PromoCode';
import Partner from '@/models/Partner';
import crypto from 'crypto';

// Génère un code promo unique lisible
function generateUniqueCode(prefix: string, index: number): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${random}${index.toString(36).toUpperCase()}`;
}

// GET - Récupérer les codes promo d'un partenaire (admin) ou le code de l'user connecté
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId');
    const myCode = searchParams.get('myCode'); // Si l'user veut voir son code

    // Un user veut voir son code attribué
    if (myCode === 'true') {
      const User = (await import('@/models/User')).default;
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      const userCode = await PromoCode.findOne({ assignedTo: user._id })
        .populate('partnerId', 'name logo image category city');

      return NextResponse.json({
        hasCode: !!userCode,
        code: userCode || null
      });
    }

    // Admin : voir les codes d'un partenaire
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId requis' }, { status: 400 });
    }

    const codes = await PromoCode.find({ partnerId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const stats = {
      total: codes.length,
      available: codes.filter(c => !c.assignedTo).length,
      assigned: codes.filter(c => c.assignedTo && !c.isUsed).length,
      used: codes.filter(c => c.isUsed).length
    };

    return NextResponse.json({ codes, stats });
  } catch (error) {
    console.error('Erreur promo-codes GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Générer un batch de codes promo (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await dbConnect();

    const { partnerId, offerType, count, prefix } = await req.json();

    if (!partnerId || !offerType || !count || !prefix) {
      return NextResponse.json({ error: 'Paramètres manquants (partnerId, offerType, count, prefix)' }, { status: 400 });
    }

    if (count < 1 || count > 1000) {
      return NextResponse.json({ error: 'Le nombre de codes doit être entre 1 et 1000' }, { status: 400 });
    }

    // Vérifier que le partenaire existe
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
    }

    const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

    // Générer les codes
    const codesToInsert = [];
    const existingCodes = new Set(
      (await PromoCode.find({}, { code: 1 }).lean()).map((c: any) => c.code)
    );

    let attempts = 0;
    while (codesToInsert.length < count && attempts < count * 3) {
      const code = generateUniqueCode(cleanPrefix, codesToInsert.length + attempts);
      if (!existingCodes.has(code)) {
        existingCodes.add(code);
        codesToInsert.push({
          code,
          partnerId,
          offerType,
          assignedTo: null,
          isUsed: false
        });
      }
      attempts++;
    }

    if (codesToInsert.length < count) {
      return NextResponse.json({
        error: `N'a pu générer que ${codesToInsert.length}/${count} codes uniques`
      }, { status: 400 });
    }

    await PromoCode.insertMany(codesToInsert);

    return NextResponse.json({
      success: true,
      message: `${count} codes promo générés avec succès`,
      count: codesToInsert.length,
      sample: codesToInsert.slice(0, 5).map(c => c.code)
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur promo-codes POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer les codes non attribués d'un partenaire (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId');
    const offerType = searchParams.get('offerType');

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId requis' }, { status: 400 });
    }

    const filter: any = { partnerId, assignedTo: null };
    if (offerType) filter.offerType = offerType;

    const result = await PromoCode.deleteMany(filter);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} codes non attribués supprimés`
    });
  } catch (error) {
    console.error('Erreur promo-codes DELETE:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
