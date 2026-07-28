import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from './_auth';
import { listFriends } from '@/lib/friendService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/friends?page=1 — liste paginée de mes amis.
 */
export async function GET(req: NextRequest) {
  try {
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1);
    const { friends, total } = await listFriends(me.id, page);

    return NextResponse.json({ success: true, data: { friends, total, page } });
  } catch (error) {
    console.error('Erreur GET /api/friends:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
