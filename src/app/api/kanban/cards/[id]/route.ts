import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import KanbanCard from '@/models/KanbanCard';
import User from '@/models/User';
import { NotificationService } from '@/lib/notificationService';
import { canAccessBoard, isValidColumn, randomFoxyEmotion, COLUMNS } from '@/lib/kanban';

const PRIORITIES = ['low', 'medium', 'high'];
const LINK_TYPES = ['none', 'course', 'forum', 'evaluation'];

function buildChecklist(raw: any) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((i: any) => i && typeof i.text === 'string' && i.text.trim())
        .slice(0, 50)
        .map((i: any) => ({ text: i.text.trim().slice(0, 300), done: !!i.done }));
}

function buildLabels(raw: any) {
    if (!Array.isArray(raw)) return [];
    return raw.filter((l: any) => typeof l === 'string').slice(0, 10);
}

function buildLink(raw: any) {
    if (!raw || !LINK_TYPES.includes(raw.type) || raw.type === 'none') {
        return { type: 'none' as const };
    }
    return {
        type: raw.type,
        refId: raw.refId || undefined,
        label: typeof raw.label === 'string' ? raw.label.slice(0, 300) : undefined,
        url: typeof raw.url === 'string' ? raw.url.slice(0, 500) : undefined,
    };
}

// GET /api/kanban/cards/[id] — carte unique avec son fil (commentaires + activité)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const card = await KanbanCard.findById(id)
            .populate('assignees', 'username image role')
            .populate('createdBy', 'username image')
            .populate('comments.author', 'username image')
            .lean();

        if (!card) {
            return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 });
        }
        if (!canAccessBoard(session.user.role, (card as any).board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Erreur kanban card GET:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PATCH /api/kanban/cards/[id] — édition d'une carte
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const card = await KanbanCard.findById(id);
        if (!card) {
            return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 });
        }
        if (!canAccessBoard(session.user.role, card.board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const body = await req.json();
        const actorName = (session.user as any).username || 'Un membre';
        const actorId = session.user.id as string;
        const activities: { kind: 'activity'; text: string; foxy: string; createdAt: Date }[] = [];
        const addActivity = (text: string) =>
            activities.push({ kind: 'activity', text, foxy: randomFoxyEmotion(), createdAt: new Date() });

        const prevAssignees = (card.assignees || []).map((a: any) => String(a));

        if (typeof body.title === 'string') {
            const t = body.title.trim();
            if (!t) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 });
            card.title = t;
        }
        if (typeof body.description === 'string') card.description = body.description;
        if (PRIORITIES.includes(body.priority)) card.priority = body.priority;
        if (typeof body.column === 'string' && isValidColumn(body.column) && body.column !== card.column) {
            const label = COLUMNS.find((c) => c.id === body.column)?.label || body.column;
            addActivity(`${actorName} a déplacé la carte en « ${label} »`);
            card.column = body.column;
        }
        if (typeof body.order === 'number') card.order = body.order;

        let newlyAssigned: string[] = [];
        if (Array.isArray(body.assignees)) {
            const next = body.assignees.map((a: any) => String(a));
            newlyAssigned = next.filter((a: string) => !prevAssignees.includes(a));
            const removed = prevAssignees.filter((a: string) => !next.includes(a));
            card.assignees = body.assignees;
            if (newlyAssigned.length || removed.length) {
                // Récupère les noms pour un message lisible
                const users = await User.find({ _id: { $in: [...newlyAssigned, ...removed] } })
                    .select('username')
                    .lean<{ _id: any; username: string }[]>();
                const nameOf = (uid: string) => users.find((u) => String(u._id) === uid)?.username || 'un membre';
                if (newlyAssigned.length) addActivity(`${actorName} a assigné ${newlyAssigned.map(nameOf).join(', ')}`);
                if (removed.length) addActivity(`${actorName} a retiré ${removed.map(nameOf).join(', ')}`);
            }
        }
        if (Array.isArray(body.labels)) card.labels = buildLabels(body.labels);
        if (Array.isArray(body.checklist)) card.checklist = buildChecklist(body.checklist);
        if (typeof body.archived === 'boolean' && body.archived !== card.archived) {
            addActivity(body.archived ? `${actorName} a archivé la carte` : `${actorName} a désarchivé la carte`);
            card.archived = body.archived;
        }
        if (body.link !== undefined) card.link = buildLink(body.link);
        if (body.dueDate !== undefined) card.dueDate = body.dueDate ? new Date(body.dueDate) : undefined;

        if (activities.length) card.comments.push(...(activities as any));

        await card.save();

        // Notifie les nouveaux assignés (sauf l'acteur)
        for (const a of newlyAssigned) {
            NotificationService.notifyKanbanAssigned(a, actorId, String(card._id), card.title);
        }

        const populated = await KanbanCard.findById(card._id)
            .populate('assignees', 'username image role')
            .populate('createdBy', 'username image')
            .lean();

        return NextResponse.json({ card: populated });
    } catch (error) {
        console.error('Erreur kanban card PATCH:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE /api/kanban/cards/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const card = await KanbanCard.findById(id);
        if (!card) {
            return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 });
        }
        if (!canAccessBoard(session.user.role, card.board)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await card.deleteOne();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur kanban card DELETE:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
