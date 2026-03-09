import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import Badge from '@/models/Badge';
import Gem from '@/models/Gem';
import GemTransaction from '@/models/GemTransaction';
import dbConnect from '@/lib/mongodb';

const UNLOCK_COST = 5;

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    const { badgeSlug } = await req.json();

    // null = retirer le badge affiche
    if (badgeSlug === null) {
      user.selectedBadge = null;
      await user.save();
      return NextResponse.json({ success: true, selectedBadge: null });
    }

    // Verifier si la fonctionnalite est deja debloquee
    const featureUnlocked = await GemTransaction.findOne({
      user: user._id,
      'metadata.itemType': 'badge_feature_unlock',
      status: 'completed',
    });

    // Si pas encore debloque, payer 5 gemmes
    if (!featureUnlocked) {
      const gemUpdate = await Gem.findOneAndUpdate(
        { user: user._id, balance: { $gte: UNLOCK_COST } },
        { $inc: { balance: -UNLOCK_COST, totalSpent: UNLOCK_COST } },
        { new: true }
      );

      if (!gemUpdate) {
        return NextResponse.json(
          { error: `Il faut ${UNLOCK_COST} gemmes pour debloquer cette fonctionnalite` },
          { status: 400 }
        );
      }

      await GemTransaction.create({
        user: user._id,
        type: 'purchase',
        gems: -UNLOCK_COST,
        description: 'Deblocage : Badge de profil',
        status: 'completed',
        metadata: { itemType: 'badge_feature_unlock' },
      });
    }

    // Verifier limite 1 changement par jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChange = await GemTransaction.findOne({
      user: user._id,
      'metadata.itemType': 'badge_select',
      createdAt: { $gte: today },
      status: 'completed',
    });
    if (todayChange) {
      return NextResponse.json(
        { error: 'Vous ne pouvez changer de badge qu\'une fois par jour' },
        { status: 429 }
      );
    }

    // Verifier que l'utilisateur possede ce badge
    if (!user.badges.includes(badgeSlug)) {
      return NextResponse.json({ error: 'Badge non possede' }, { status: 400 });
    }

    // Verifier que le badge existe
    const badge = await Badge.findOne({ slug: badgeSlug });
    if (!badge) {
      return NextResponse.json({ error: 'Badge invalide' }, { status: 400 });
    }

    // Enregistrer le changement du jour
    await GemTransaction.create({
      user: user._id,
      type: 'purchase',
      gems: 0,
      description: `Badge de profil : ${badge.name}`,
      status: 'completed',
      metadata: { itemType: 'badge_select', itemId: badgeSlug },
    });

    user.selectedBadge = badgeSlug;
    await user.save();

    const gem = await Gem.findOne({ user: user._id });

    return NextResponse.json({
      success: true,
      selectedBadge: badgeSlug,
      icon: badge.icon,
      newBalance: gem?.balance ?? 0,
      unlocked: true,
    });
  } catch (error) {
    console.error('Erreur selection badge:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET: verifier si la fonctionnalite est debloquee
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    const featureUnlocked = await GemTransaction.findOne({
      user: user._id,
      'metadata.itemType': 'badge_feature_unlock',
      status: 'completed',
    });

    return NextResponse.json({
      success: true,
      unlocked: !!featureUnlocked,
      selectedBadge: user.selectedBadge || null,
    });
  } catch (error) {
    console.error('Erreur badge select status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
