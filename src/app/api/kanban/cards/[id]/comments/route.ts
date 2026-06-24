import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import KanbanCard from '@/models/KanbanCard';
import '@/models/User';
import { NotificationService } from '@/lib/notificationService';
import { canAccessBoard } from '@/lib/kanban';

// POST /api/kanban/cards/[id]/comments — ajoute un commentaire
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!text) {
            return NextResponse.json({ error: 'Le commentaire est vide' }, { status: 400 });
        }

        await dbConnect();
        const card = await KanbanCard.findById(id);
        if (!card) {
            return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 });
        }
        if (!canAccessBoard(session.user.role, card.board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const actorId = session.user.id as string;
        card.comments.push({ kind: 'comment', author: actorId, text } as any);
        await card.save();

        // Notifie les personnes concernées (assignés + créateur), sauf l'auteur
        const recipients = [
            ...(card.assignees || []).map((a: any) => String(a)),
            String(card.createdBy),
        ];
        NotificationService.notifyKanbanComment(recipients, actorId, String(card._id), card.title);

        // Renvoie le commentaire fraîchement créé, peuplé
        const fresh = await KanbanCard.findById(card._id)
            .select('comments')
            .populate('comments.author', 'username image')
            .lean<any>();
        const newComment = fresh?.comments?.[fresh.comments.length - 1] || null;

        return NextResponse.json({ comment: newComment }, { status: 201 });
    } catch (error) {
        console.error('Erreur kanban comment POST:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
