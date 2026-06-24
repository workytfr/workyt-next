import dbConnect from '@/lib/mongodb';
import KanbanCard from '@/models/KanbanCard';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import Course from '@/models/Course';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import '@/models/User';
import '@/models/Evaluation';
import { buildIdSlug } from '@/utils/slugify';
import type { BoardId } from '@/lib/kanban';
import type { KanbanSourceKind } from '@/models/KanbanCard';

/**
 * Auto-création de cartes Kanban à partir du travail réel de la plateforme.
 *
 * Règles :
 *  - chaque source alimente UN SEUL board (pas de doublon inter-board) ;
 *  - dédup par source.refId (+ index unique partiel en base) ;
 *  - une carte dont la source n'est plus « en attente » passe en « Terminé ».
 */

export interface DesiredCard {
    kind: KanbanSourceKind;
    refId: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    link: { type: 'none' | 'course' | 'forum' | 'evaluation'; refId?: string; label?: string; url?: string };
}

// ─── Fournisseurs de sources ────────────────────────────────────────────────────

async function evaluationSubmissions(): Promise<DesiredCard[]> {
    const subs = await EvaluationSubmission.find({ status: 'pending_review' })
        .sort({ submittedAt: 1 })
        .limit(200)
        .populate('evaluationId', 'title')
        .populate('userId', 'username')
        .lean<any[]>();

    return subs.map((s) => ({
        kind: 'evaluation_submission',
        refId: String(s._id),
        title: `Corriger : ${s.evaluationId?.title || 'évaluation'}`,
        description: s.userId?.username ? `Soumission de ${s.userId.username}` : '',
        priority: 'medium',
        link: {
            type: 'evaluation',
            refId: s.evaluationId?._id ? String(s.evaluationId._id) : undefined,
            label: s.evaluationId?.title,
            url: `/dashboard/evaluations/${s._id}`,
        },
    }));
}

async function courseReviews(): Promise<DesiredCard[]> {
    const courses = await Course.find({ status: 'en_attente_verification' })
        .select('title')
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean<any[]>();

    return courses.map((c) => ({
        kind: 'course_review',
        refId: String(c._id),
        title: `Vérifier le cours : ${c.title}`,
        priority: 'medium',
        link: {
            type: 'course',
            refId: String(c._id),
            label: c.title,
            url: `/cours/${buildIdSlug(String(c._id), c.title)}`,
        },
    }));
}

async function forumUnanswered(): Promise<DesiredCard[]> {
    const answered = await Answer.distinct('question');
    const qs = await Question.find({ status: 'Validée', _id: { $nin: answered } })
        .select('title')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean<any[]>();

    return qs.map((q) => ({
        kind: 'forum_unanswered',
        refId: String(q._id),
        title: `Répondre : ${q.title}`,
        priority: 'medium',
        link: {
            type: 'forum',
            refId: String(q._id),
            label: q.title,
            url: `/forum/${buildIdSlug(String(q._id), q.title)}`,
        },
    }));
}

async function forumModeration(): Promise<DesiredCard[]> {
    const qs = await Question.find({ status: 'Non validée' })
        .select('title')
        .sort({ createdAt: 1 })
        .limit(200)
        .lean<any[]>();

    return qs.map((q) => ({
        kind: 'forum_moderation',
        refId: String(q._id),
        title: `Valider la question : ${q.title}`,
        priority: 'high',
        link: {
            type: 'forum',
            refId: String(q._id),
            label: q.title,
            url: `/forum/${buildIdSlug(String(q._id), q.title)}`,
        },
    }));
}

// ─── Mapping board → sources ─────────────────────────────────────────────────────

const SOURCES: Partial<Record<BoardId, () => Promise<DesiredCard[]>>> = {
    Correcteur: async () => [...(await evaluationSubmissions()), ...(await courseReviews())],
    Helpeur: forumUnanswered,
    Modérateur: forumModeration,
};

/** Indique si un board possède des sources d'auto-création. */
export function boardHasAutoSources(board: string): boolean {
    return board in SOURCES;
}

/** Liste des boards alimentés automatiquement. */
export const AUTO_BOARDS = Object.keys(SOURCES);

// ─── Synchronisation ─────────────────────────────────────────────────────────────

export async function syncBoard(
    board: string,
    actorId: string
): Promise<{ created: number; resolved: number }> {
    const provider = SOURCES[board as BoardId];
    if (!provider) return { created: 0, resolved: 0 };

    await dbConnect();
    const desired = await provider();
    const desiredIds = new Set(desired.map((d) => d.refId));

    const existing = await KanbanCard.find({ board, 'source.refId': { $exists: true } })
        .select('source column archived')
        .lean<any[]>();
    const existingIds = new Set(existing.map((e) => String(e.source.refId)));

    // Création des cartes manquantes
    let created = 0;
    for (const item of desired) {
        if (existingIds.has(item.refId)) continue;
        const last = await KanbanCard.findOne({ board, column: 'todo' })
            .sort({ order: -1 })
            .select('order')
            .lean<{ order: number }>();
        const order = (last?.order ?? -1) + 1;
        try {
            await KanbanCard.create({
                board,
                column: 'todo',
                order,
                title: item.title,
                description: item.description || '',
                priority: item.priority || 'medium',
                link: item.link,
                source: { kind: item.kind, refId: item.refId },
                createdBy: actorId,
            });
            created++;
        } catch (e: any) {
            if (e?.code !== 11000) throw e; // ignore les doublons (course concurrente)
        }
    }

    // Résolution : cartes auto dont la source n'est plus en attente → « Terminé »
    const toResolve = existing.filter(
        (e) => !e.archived && e.column !== 'done' && !desiredIds.has(String(e.source.refId))
    );
    let resolved = 0;
    if (toResolve.length > 0) {
        await KanbanCard.updateMany(
            { _id: { $in: toResolve.map((e) => e._id) } },
            { $set: { column: 'done', updatedAt: new Date() } }
        );
        resolved = toResolve.length;
    }

    return { created, resolved };
}
