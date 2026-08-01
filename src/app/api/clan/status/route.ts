import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentUser } from '../../friends/_auth';
import dbConnect from '@/lib/mongodb';
import Clan, { TIERS } from '@/models/Clan';
import ClanMember from '@/models/ClanMember';
import { seasonKey } from '@/lib/clanService';
import { warDay } from '@/lib/clanResolution';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clan/status — état minimal de la guerre, pour l'indicateur de navbar.
 *
 * Volontairement SÉPARÉ de /api/clan : ce dernier remonte les classements par
 * rôle, la liste des membres et le fil de guerre. L'indicateur est monté sur
 * TOUTES les pages du site — il ne peut pas payer ce prix.
 *
 * Ici : deux lectures ciblées, projections serrées, rien de plus.
 */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ success: true, data: null });

    await dbConnect();
    const season = seasonKey();

    const membership = await ClanMember.findOne({
      user: new mongoose.Types.ObjectId(me.id),
      season
    })
      .select('clan role multiplier wounded dailyPoints')
      .lean<any>();

    if (!membership) return NextResponse.json({ success: true, data: null });

    const [clan, rival] = await Promise.all([
      Clan.findById(membership.clan)
        .select('name tier daysWon resources gates resolved')
        .lean<any>(),
      Clan.findOne({ rival: membership.clan }).select('name daysWon gates').lean<any>()
    ]);

    if (!clan || clan.resolved) return NextResponse.json({ success: true, data: null });

    // Porte adverse la plus faible encore debout — l'info la plus actionnable
    const standing = (rival?.gates ?? []).filter((g: any) => !g.fallen);
    const weakest = standing.length
      ? standing.reduce((a: any, b: any) => (a.hp <= b.hp ? a : b))
      : null;

    return NextResponse.json({
      success: true,
      data: {
        day: warDay(),
        clanName: clan.name,
        tierName: TIERS[Math.max(0, (clan.tier ?? 1) - 1)],
        daysWon: clan.daysWon ?? 0,
        resources: clan.resources ?? 0,
        rivalName: rival?.name ?? null,
        rivalDaysWon: rival?.daysWon ?? 0,
        weakestGate: weakest ? { name: weakest.name, hp: weakest.hp, hpMax: weakest.hpMax } : null,
        breached: (rival?.gates ?? []).some((g: any) => g.fallen),
        me: {
          role: membership.role,
          multiplier: membership.multiplier ?? 1,
          dailyPoints: membership.dailyPoints ?? 0,
          wounded: !!membership.wounded
        }
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/clan/status:', error);
    return NextResponse.json({ success: true, data: null });
  }
}
