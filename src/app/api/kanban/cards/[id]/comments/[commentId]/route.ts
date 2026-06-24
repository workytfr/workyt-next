import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import KanbanCard from '@/models/KanbanCard';
import { canAccessBoard } from '@/lib/kanban';

// DELETE /api/kanban/cards/[id]/comments/[commentId]
// Seul l'auteur du commentaire ou un Admin peut le supprimer.
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id, commentId } = await params;
        await dbConnect();

        const card = await KanbanCard.findById(id);
        if (!card) {
            return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 });
        }
        if (!canAccessBoard(session.user.role, card.board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const comment = (card.comments as any).id(commentId);
        if (!comment) {
            return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
        }
        if (comment.kind !== 'comment') {
            return NextResponse.json({ error: "L'activité ne peut pas être supprimée" }, { status: 400 });
        }
        const isOwner = comment.author && String(comment.author) === session.user.id;
        if (!isOwner && session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
        }

        comment.deleteOne();
        await card.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur kanban comment DELETE:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
