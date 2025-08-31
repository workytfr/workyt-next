import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import GemTransaction from '@/models/GemTransaction';

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

    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Récupérer l'historique des transactions
    const transactions = await GemTransaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('partnerId', 'name logo')
      .lean();
    
    // Compter le total des transactions
    const totalCount = await GemTransaction.countDocuments({ user: user._id });

    // Formater les transactions pour l'affichage
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      gems: transaction.gems,
      description: transaction.description,
      status: transaction.status,
      createdAt: transaction.createdAt,
      partnerName: transaction.metadata?.partnerName,
      offerDescription: transaction.metadata?.offerDescription,
      justification: transaction.metadata?.justification,
      promoCode: transaction.metadata?.promoCode,
      itemType: transaction.metadata?.itemType,
      conversionRate: transaction.metadata?.conversionRate,
      points: transaction.points
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération de l\'historique' 
    }, { status: 500 });
  }
}
