import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../_auth';
import { removeFriend } from '@/lib/friendService';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/friends/[id] — retire un ami, annule une demande envoyée
 * ou retire une demande reçue. Les deux parties de la relation peuvent le faire.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;
    const result = await removeFriend(id, me.id);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/friends/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
