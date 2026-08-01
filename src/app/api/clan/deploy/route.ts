import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import { deploySoldiers, setDailyOrder, setMyGate, cancelPurchase } from '@/lib/clanSoldiers';
import type { GateName } from '@/models/Clan';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const GATES = ['nord', 'est', 'sud'];
const isGate = (g: unknown): g is GateName => typeof g === 'string' && GATES.includes(g);

/**
 * POST /api/clan/deploy — actions tactiques de la journée.
 *
 * Une seule route pour quatre gestes, tous modifiables jusqu'à minuit :
 *   { action: 'garrison', assignments: [...] }  capitaine — déploie la garnison
 *   { action: 'order', gate }                   capitaine — publie l'ordre du jour
 *   { action: 'gate', gate }                    joueur    — sa porte
 *   { action: 'cancel', soldierId }             n'importe qui — annule un achat
 */
export async function POST(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const rl = rateLimit(`clan-deploy:${me.id}`, 120, 60 * 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? '');

    let result: { success: boolean; message?: string; updated?: number };

    switch (action) {
      case 'garrison': {
        const raw = Array.isArray(body?.assignments) ? body.assignments : [];
        const assignments = raw.map((a: any) => ({
          soldierId: String(a?.soldierId ?? ''),
          gate: isGate(a?.gate) ? a.gate : null,
          stance: a?.stance === 'assaut' || a?.stance === 'garnison' ? a.stance : null
        }));
        result = await deploySoldiers(me.id, assignments);
        break;
      }
      case 'order':
        result = await setDailyOrder(me.id, isGate(body?.gate) ? body.gate : null);
        break;
      case 'gate':
        result = await setMyGate(me.id, isGate(body?.gate) ? body.gate : null);
        break;
      case 'cancel':
        result = await cancelPurchase(me.id, String(body?.soldierId ?? ''));
        break;
      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    console.error('Erreur POST /api/clan/deploy:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
