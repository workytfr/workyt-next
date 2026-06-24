import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { canAccessBoard, isValidBoard } from '@/lib/kanban';

// GET /api/kanban/members?board=Rédacteur — utilisateurs assignables (membres du board)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const board = new URL(req.url).searchParams.get('board') || '';
        if (!isValidBoard(board)) {
            return NextResponse.json({ error: 'Board invalide' }, { status: 400 });
        }
        if (!canAccessBoard(session.user.role, board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();
        const members = await User.find({ role: board })
            .select('username image role')
            .sort({ username: 1 })
            .lean();

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Erreur kanban members GET:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
