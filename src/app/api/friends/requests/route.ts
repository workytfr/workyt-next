import { NextResponse } from 'next/server';
import { currentUser } from '../_auth';
import { listPendingReceived, listPendingSent } from '@/lib/friendService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/friends/requests — demandes reçues (à traiter) et envoyées (à annuler).
 */
export async function GET() {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const [received, sent] = await Promise.all([
      listPendingReceived(me.id),
      listPendingSent(me.id)
    ]);

    return NextResponse.json({ success: true, data: { received, sent } });
  } catch (error) {
    console.error('Erreur GET /api/friends/requests:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
