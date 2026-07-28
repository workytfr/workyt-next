import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import ProfileCustomization from '@/models/ProfileCustomization';
import User from '@/models/User';
import Badge from '@/models/Badge';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/customizations — personnalisations de PLUSIEURS utilisateurs.
 * Body : { ids: string[] }
 *
 * Remplace l'appel unitaire /api/users/[userId]/customization, qui produisait
 * un N+1 massif : une liste de forum de 15 auteurs déclenchait 15 requêtes HTTP
 * × 3 requêtes Mongo chacune. Ici : 1 requête HTTP, 3 requêtes Mongo, quel que
 * soit le nombre d'utilisateurs.
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];

    const ids = rawIds
      .filter((x): x is string => typeof x === 'string')
      .filter((id) => mongoose.isValidObjectId(id))
      .slice(0, 100); // garde-fou

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    // 3 requêtes au total, indépendantes du nombre d'utilisateurs
    const [users, customizations] = await Promise.all([
      User.find({ _id: { $in: objectIds } })
        .select('_id selectedBadge')
        .lean(),
      ProfileCustomization.find({ user: { $in: objectIds } })
        .select('user usernameColor profileImage profileBorder')
        .lean()
    ]);

    // Les icônes de badge en une seule passe, dédupliquées
    const badgeSlugs = [
      ...new Set((users as any[]).map((u) => u.selectedBadge).filter(Boolean))
    ];
    const badges = badgeSlugs.length
      ? await Badge.find({ slug: { $in: badgeSlugs } })
          .select('slug icon')
          .lean()
      : [];
    const badgeIcons = new Map(badges.map((b: any) => [b.slug, b.icon]));

    const customByUser = new Map(
      (customizations as any[]).map((c) => [c.user.toString(), c])
    );

    const DEFAULT_CUSTOM = {
      usernameColor: { type: 'solid', value: '#3B82F6', isActive: false },
      profileImage: { filename: '', isActive: false },
      profileBorder: { filename: '', isActive: false }
    };

    const data: Record<string, any> = {};
    for (const u of users as any[]) {
      const id = u._id.toString();
      data[id] = {
        customization: customByUser.get(id) ?? DEFAULT_CUSTOM,
        selectedBadgeIcon: u.selectedBadge ? badgeIcons.get(u.selectedBadge) ?? null : null
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur POST /api/users/customizations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
