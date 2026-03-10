import { NextRequest, NextResponse } from 'next/server';
import Badge from '@/models/Badge';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import badgesData from '@/data/badges';

/**
 * Auto-sync: insere les badges manquants depuis le fichier de donnees
 */
async function syncBadges() {
  const existingSlugs = await Badge.distinct('slug');
  const existingSet = new Set(existingSlugs);
  const toInsert = badgesData.filter(b => b.slug && !existingSet.has(b.slug));
  if (toInsert.length > 0) {
    await Badge.insertMany(toInsert, { ordered: false }).catch(() => {});
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await syncBadges();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const user = await User.findById(userId).select('badges selectedBadge');
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
      }

      const userBadges = await Badge.find({ slug: { $in: user.badges } });

      return NextResponse.json({
        userBadges,
        totalBadges: user.badges.length,
        selectedBadge: user.selectedBadge || null,
      });
    }

    const allBadges = await Badge.find({}).sort({ category: 1, 'condition.value': 1 });

    return NextResponse.json({
      badges: allBadges,
      total: allBadges.length,
    });
  } catch (error) {
    console.error('Erreur lors de la recuperation des badges:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des badges' },
      { status: 500 }
    );
  }
}
