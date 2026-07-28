import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '../../friends/_auth';
import { getPlayableChallenge } from '@/lib/challengeService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/challenges/[id] — le défi tel que le joueur doit le voir.
 * Les bonnes réponses ne sont incluses qu'une fois le joueur arrivé au bout.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;
    const data = await getPlayableChallenge(id, me.id);
    if (!data) {
      return NextResponse.json({ error: 'Défi introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur GET /api/challenges/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
