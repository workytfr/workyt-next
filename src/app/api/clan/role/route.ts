import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import { setRole } from '@/lib/clanService';
import type { ClanRole } from '@/models/ClanMember';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/clan/role — choisit son rôle pour la semaine.
 * Body : { role: 'attaquant' | 'defenseur' | 'soigneur' }
 *
 * Modifiable à volonté : le rôle n'est figé qu'à la résolution de minuit,
 * et ne rien choisir laisse « attaquant » par défaut.
 */
export async function POST(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`clan-role:${me.id}`, 30, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const result = await setRole(me.id, body?.role as ClanRole);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, role: body.role });
  } catch (error) {
    console.error('Erreur POST /api/clan/role:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
