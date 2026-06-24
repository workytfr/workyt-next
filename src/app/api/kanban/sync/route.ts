import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { canAccessBoard, isValidBoard } from '@/lib/kanban';
import { syncBoard, boardHasAutoSources } from '@/lib/kanbanSync';

// POST /api/kanban/sync — body { board }
// Génère les cartes auto-créées pour ce board (évaluations à corriger,
// questions forum, cours à vérifier…) et clôt celles qui sont résolues.
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { board } = await req.json();
        if (!isValidBoard(board)) {
            return NextResponse.json({ error: 'Board invalide' }, { status: 400 });
        }
        if (!canAccessBoard(session.user.role, board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        if (!boardHasAutoSources(board)) {
            return NextResponse.json({ created: 0, resolved: 0, autoSources: false });
        }

        const result = await syncBoard(board, session.user.id as string);
        return NextResponse.json({ ...result, autoSources: true });
    } catch (error) {
        console.error('Erreur kanban sync POST:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
