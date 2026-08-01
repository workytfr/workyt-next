import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import { seasonKey } from '@/lib/clanService';
import ClanMember from '@/models/ClanMember';
import Clan from '@/models/Clan';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import {
  SOLDIER_CATALOG,
  GARRISON_PER_MEMBER,
  getGarrison,
  buySoldier
} from '@/lib/clanSoldiers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clan/soldiers — catalogue et garnison du clan.
 */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const membership = await ClanMember.findOne({
      user: new mongoose.Types.ObjectId(me.id),
      season: seasonKey()
    })
      .select('clan')
      .lean<any>();

    if (!membership) {
      return NextResponse.json({ success: true, data: { catalog: SOLDIER_CATALOG, garrison: [] } });
    }

    const [clan, garrison] = await Promise.all([
      Clan.findById(membership.clan).select('resources memberCount captain buildings').lean<any>(),
      getGarrison(membership.clan.toString())
    ]);

    return NextResponse.json({
      success: true,
      data: {
        catalog: SOLDIER_CATALOG,
        garrison,
        resources: clan?.resources ?? 0,
        garrisonMax: (clan?.memberCount ?? 0) * GARRISON_PER_MEMBER,
        isCaptain: clan?.captain?.toString() === me.id,
        buildings: clan?.buildings ?? []
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/clan/soldiers:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/clan/soldiers — recrute une unité.
 * Body : { type: string }
 */
export async function POST(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`clan-buy:${me.id}`, 60, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const result = await buySoldier(me.id, String(body?.type ?? ''));

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur POST /api/clan/soldiers:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
