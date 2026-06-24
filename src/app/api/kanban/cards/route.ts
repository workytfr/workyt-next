import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import KanbanCard from '@/models/KanbanCard';
import '@/models/User'; // garantit l'enregistrement du modèle pour populate
import { NotificationService } from '@/lib/notificationService';
import {
    canAccessBoard,
    isValidBoard,
    isValidColumn,
    randomFoxyEmotion,
    COLUMN_IDS,
    COLUMNS,
} from '@/lib/kanban';

const PRIORITIES = ['low', 'medium', 'high'];
const LINK_TYPES = ['none', 'course', 'forum', 'evaluation'];

// Retire les images (balises <img>, dont base64) de la description.
function stripImages(html: any): string {
    if (typeof html !== 'string') return '';
    return html.replace(/<img\b[^>]*>/gi, '').trim();
}

// Normalise les sous-tâches (checklist)
function buildChecklist(raw: any) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((i: any) => i && typeof i.text === 'string' && i.text.trim())
        .slice(0, 50)
        .map((i: any) => ({ text: i.text.trim().slice(0, 300), done: !!i.done }));
}

// Normalise les étiquettes
function buildLabels(raw: any) {
    if (!Array.isArray(raw)) return [];
    return raw.filter((l: any) => typeof l === 'string').slice(0, 10);
}

// Normalise et valide le sous-document de liaison
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

// GET /api/kanban/cards?board=Rédacteur — cartes du board
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
            return NextResponse.json({ error: 'Accès refusé à ce board' }, { status: 403 });
        }

        const includeArchived = new URL(req.url).searchParams.get('archived') === '1';

        await dbConnect();
        const filter: any = { board };
        if (!includeArchived) filter.archived = { $ne: true };
        const cards = await KanbanCard.find(filter)
            .sort({ column: 1, order: 1 })
            .populate('assignees', 'username image role')
            .populate('createdBy', 'username image')
            .lean();

        return NextResponse.json({ cards });
    } catch (error) {
        console.error('Erreur kanban cards GET:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST /api/kanban/cards — créer une carte
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const board = body.board;
        if (!isValidBoard(board)) {
            return NextResponse.json({ error: 'Board invalide' }, { status: 400 });
        }
        if (!canAccessBoard(session.user.role, board)) {
            return NextResponse.json({ error: 'Accès refusé à ce board' }, { status: 403 });
        }

        const title = typeof body.title === 'string' ? body.title.trim() : '';
        if (!title) {
            return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 });
        }

        const column =
            typeof body.column === 'string' && isValidColumn(body.column)
                ? body.column
                : 'todo';

        await dbConnect();

        // Place la carte en fin de colonne
        const last = await KanbanCard.findOne({ board, column })
            .sort({ order: -1 })
            .select('order')
            .lean<{ order: number }>();
        const order = (last?.order ?? -1) + 1;

        const assignees = Array.isArray(body.assignees) ? body.assignees : [];
        const actorName = (session.user as any).username || 'Un membre';

        const card = await KanbanCard.create({
            board,
            column,
            order,
            title,
            description: stripImages(body.description),
            priority: PRIORITIES.includes(body.priority) ? body.priority : 'medium',
            labels: buildLabels(body.labels),
            checklist: buildChecklist(body.checklist),
            assignees,
            link: buildLink(body.link),
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            createdBy: session.user.id,
            comments: [
                { kind: 'activity', text: `Carte créée par ${actorName}`, foxy: randomFoxyEmotion(), createdAt: new Date() },
            ],
        });

        // Notifie les membres assignés (sauf l'auteur)
        for (const a of assignees) {
            NotificationService.notifyKanbanAssigned(String(a), session.user.id as string, String(card._id), title);
        }

        const populated = await KanbanCard.findById(card._id)
            .populate('assignees', 'username image role')
            .populate('createdBy', 'username image')
            .lean();

        return NextResponse.json({ card: populated }, { status: 201 });
    } catch (error) {
        console.error('Erreur kanban cards POST:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PATCH /api/kanban/cards — réordonnancement en masse (drag & drop)
// body: { board, moves: [{ id, column, order }] }
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const board = body.board;
        if (!isValidBoard(board) || !canAccessBoard(session.user.role, board)) {
            return NextResponse.json({ error: 'Accès refusé à ce board' }, { status: 403 });
        }

        const moves = (Array.isArray(body.moves) ? body.moves : []).filter(
            (m: any) => m?.id && COLUMN_IDS.includes(m.column) && typeof m.order === 'number'
        );

        if (moves.length === 0) {
            return NextResponse.json({ success: true });
        }

        await dbConnect();

        // Pour journaliser les changements de colonne, on lit l'état actuel
        const ids = moves.map((m: any) => m.id);
        const current = await KanbanCard.find({ _id: { $in: ids }, board })
            .select('column')
            .lean<{ _id: any; column: string }[]>();
        const colMap = new Map(current.map((c) => [String(c._id), c.column]));
        const actorName = (session.user as any).username || 'Un membre';

        const ops = moves.map((m: any) => {
            const update: any = { $set: { column: m.column, order: m.order, updatedAt: new Date() } };
            const oldCol = colMap.get(m.id);
            if (oldCol && oldCol !== m.column) {
                const label = COLUMNS.find((c) => c.id === m.column)?.label || m.column;
                update.$push = {
                    comments: {
                        kind: 'activity',
                        text: `${actorName} a déplacé la carte en « ${label} »`,
                        foxy: randomFoxyEmotion(),
                        createdAt: new Date(),
                    },
                };
            }
            return { updateOne: { filter: { _id: m.id, board }, update } };
        });

        await KanbanCard.bulkWrite(ops);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur kanban cards PATCH:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
