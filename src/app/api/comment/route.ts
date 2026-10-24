import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment, { COMMENT_KINDS, type CommentKind } from "@/models/Comment";
import Revision from "@/models/Revision";
import authMiddleware, { optionalAuthMiddleware } from "@/middlewares/authMiddleware";
import mongoose from "mongoose";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { emitThreadItemNew } from '@/lib/realtime/emit';
import { hasPermission } from "@/lib/roles";
import { COMMENT_MAX_CHARS, COMMENT_MIN_CHARS, type CommentDTO } from "@/lib/comments";
import { serializeComment } from "@/lib/commentsServer";

connectDB();

export async function POST(req: NextRequest) {
    try {
        // Authentification : Récupérer et valider l'utilisateur
        const user = await authMiddleware(req).catch(() => null);
        if (!user || !user._id) {
            return NextResponse.json(
                { error: "Non autorisé. Utilisateur non trouvé ou token invalide." },
                { status: 401 }
            );
        }

        // Rate limit : 4 commentaires (ou réponses) par minute par compte
        const rl = rateLimit(`comment:${user._id}`, 4, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const body = await req.json().catch(() => ({}));
        const revisionId = body?.revisionId;
        const content = typeof body?.content === "string" ? body.content.trim() : "";
        const parentId = body?.parentId;

        if (!revisionId || !mongoose.isValidObjectId(revisionId) || !content) {
            return NextResponse.json(
                { error: "L'ID de la fiche et le contenu sont requis." },
                { status: 400 }
            );
        }
        if (content.length < COMMENT_MIN_CHARS || content.length > COMMENT_MAX_CHARS) {
            return NextResponse.json(
                { error: `Le commentaire doit faire entre ${COMMENT_MIN_CHARS} et ${COMMENT_MAX_CHARS} caractères.` },
                { status: 400 }
            );
        }

        const revision = await Revision.findById(revisionId);
        if (!revision) {
            return NextResponse.json(
                { error: "Fiche de révision introuvable." },
                { status: 404 }
            );
        }

        // Réponse : un seul niveau. Répondre à une réponse revient à répondre au fil.
        let parent: { _id: mongoose.Types.ObjectId; author: mongoose.Types.ObjectId } | null = null;
        if (parentId) {
            if (!mongoose.isValidObjectId(parentId)) {
                return NextResponse.json({ error: "Commentaire parent invalide." }, { status: 400 });
            }
            const target = await Comment.findById(parentId).select("revision parent author").lean();
            if (!target || String(target.revision) !== String(revisionId)) {
                return NextResponse.json({ error: "Commentaire parent introuvable." }, { status: 404 });
            }
            const root = target.parent
                ? await Comment.findById(target.parent).select("author").lean()
                : target;
            parent = root
                ? { _id: root._id as mongoose.Types.ObjectId, author: root.author as mongoose.Types.ObjectId }
                : null;
            if (!parent) {
                return NextResponse.json({ error: "Commentaire parent introuvable." }, { status: 404 });
            }
        }

        // La nature (question, erreur…) ne concerne que les commentaires principaux
        const kind: CommentKind = !parent && COMMENT_KINDS.includes(body?.kind) ? body.kind : "avis";

        const newComment = await Comment.create({
            content,
            author: user._id,
            revision: revisionId,
            parent: parent?._id ?? null,
            kind,
            createdAt: new Date(),
        });

        // Mise à jour de la liste des commentaires de la fiche (compteur)
        revision.comments.push(newComment._id as mongoose.Types.ObjectId);
        await revision.save();

        const { NotificationService } = await import('@/lib/notificationService');
        if (parent) {
            // Prévenir l'auteur du commentaire auquel on répond
            await NotificationService.notifyFicheCommentReply(
                revisionId,
                String(parent.author),
                user._id.toString()
            );
        } else {
            // Prévenir l'auteur de la fiche
            await NotificationService.notifyNewFicheComment(revisionId, user._id.toString(), kind);
        }

        // Temps réel : prévenir les membres présents sur la fiche
        emitThreadItemNew(`fiche:${revisionId}`, { commentId: newComment._id.toString() });

        const comment: CommentDTO = serializeComment(
            { ...newComment.toObject(), author: { _id: user._id, username: user.username } },
            { viewerId: user._id.toString(), canModerate: false, isFicheAuthor: false }
        );

        return NextResponse.json(
            { success: true, data: newComment, comment },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Erreur lors de la création du commentaire :", error.message);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}

/**
 * GET /api/comment?revisionId=…&offset=0&limit=10&sort=recent|useful
 * Commentaires principaux (le commentaire épinglé d'abord) avec leurs réponses.
 * `page` reste accepté pour les anciens clients.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const revisionId = searchParams.get("revisionId");
        const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "5", 10) || 5, 1), 50);
        const offsetParam = searchParams.get("offset");
        const skip = offsetParam !== null
            ? Math.max(parseInt(offsetParam, 10) || 0, 0)
            : (page - 1) * limit;
        const sortBy = searchParams.get("sort") === "useful" ? "useful" : "recent";

        if (!revisionId || !mongoose.isValidObjectId(revisionId)) {
            return NextResponse.json(
                { error: "L'ID de la fiche de révision est requis." },
                { status: 400 }
            );
        }

        // Visiteur (facultatif) : sert à savoir ce qu'il a aimé et ce qu'il peut faire
        const viewer = await optionalAuthMiddleware(req).catch(() => null);
        const viewerId = viewer?._id ? String(viewer._id) : null;
        const revision = await Revision.findById(revisionId).select("author").lean<{ author: unknown }>();
        const isFicheAuthor = !!viewerId && String(revision?.author ?? "") === viewerId;
        const canModerate = viewer ? await hasPermission(viewer, "fiche.delete").catch(() => false) : false;
        const ctx = { viewerId, isFicheAuthor, canModerate };

        const topFilter = { revision: revisionId, parent: null };
        const sort: Record<string, 1 | -1> = sortBy === "useful"
            ? { pinned: -1, likes: -1, createdAt: -1 }
            : { pinned: -1, createdAt: -1 };

        const [comments, totalComments, totalTopLevel] = await Promise.all([
            Comment.find(topFilter)
                .populate({ path: "author", select: "username _id" })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments({ revision: revisionId }),
            Comment.countDocuments(topFilter),
        ]);

        const replies = comments.length
            ? await Comment.find({ parent: { $in: comments.map((c) => c._id) } })
                .populate({ path: "author", select: "username _id" })
                .sort({ createdAt: 1 })
                .lean()
            : [];

        const response = {
            comments: comments.map((c) => ({
                ...serializeComment(c, ctx),
                replies: replies
                    .filter((r) => String(r.parent) === String(c._id))
                    .map((r) => serializeComment(r, ctx)),
            })),
            viewer: { canPin: isFicheAuthor || canModerate, canModerate },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTopLevel / limit),
                totalComments,
                totalTopLevel,
                limit,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des commentaires :", error.message);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}
