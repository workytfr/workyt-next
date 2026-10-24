import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Revision from "@/models/Revision";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";
import { hasPermission } from "@/lib/roles";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { emitThreadItemNew } from "@/lib/realtime/emit";
import { COMMENT_MAX_CHARS, COMMENT_MIN_CHARS, canStillEdit } from "@/lib/comments";

connectDB();

async function loadContext(req: NextRequest, id: string) {
    const user = await authMiddleware(req).catch(() => null);
    if (!user || !user._id) {
        return { error: NextResponse.json({ error: "Non autorisé." }, { status: 401 }) };
    }
    if (!mongoose.isValidObjectId(id)) {
        return { error: NextResponse.json({ error: "ID invalide." }, { status: 400 }) };
    }
    const comment = await Comment.findById(id).populate({ path: "revision", select: "author" });
    if (!comment) {
        return { error: NextResponse.json({ error: "Commentaire introuvable." }, { status: 404 }) };
    }
    const userId = String(user._id);
    const revision = comment.revision as unknown as { _id: mongoose.Types.ObjectId; author?: unknown } | null;
    return {
        user,
        comment,
        revisionId: String(revision?._id ?? comment.revision),
        isCommentAuthor: String(comment.author) === userId,
        isFicheAuthor: String(revision?.author ?? "") === userId,
    };
}

/**
 * PATCH /api/comment/:id
 * - { content } : l'auteur corrige son commentaire (15 minutes après l'envoi)
 * - { pinned }  : l'auteur de la fiche ou la modération épingle un commentaire
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const ctx = await loadContext(req, id);
        if ("error" in ctx) return ctx.error;
        const { user, comment, revisionId } = ctx;

        const rl = rateLimit(`comment-edit:${user._id}`, 10, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const body = await req.json().catch(() => ({}));

        if (typeof body?.content === "string") {
            if (!ctx.isCommentAuthor) {
                return NextResponse.json({ error: "Seul l'auteur peut modifier ce commentaire." }, { status: 403 });
            }
            if (!canStillEdit(comment.createdAt)) {
                return NextResponse.json({ error: "Le délai de modification (15 minutes) est dépassé." }, { status: 403 });
            }
            const content = body.content.trim();
            if (content.length < COMMENT_MIN_CHARS || content.length > COMMENT_MAX_CHARS) {
                return NextResponse.json(
                    { error: `Le commentaire doit faire entre ${COMMENT_MIN_CHARS} et ${COMMENT_MAX_CHARS} caractères.` },
                    { status: 400 },
                );
            }
            if (content !== comment.content) {
                comment.content = content;
                comment.editedAt = new Date();
                await comment.save();
            }
            emitThreadItemNew(`fiche:${revisionId}`, { commentId: id });
            return NextResponse.json({ success: true, content: comment.content, editedAt: comment.editedAt ?? null });
        }

        if (typeof body?.pinned === "boolean") {
            const isModerator = await hasPermission(user, "fiche.delete").catch(() => false);
            if (!ctx.isFicheAuthor && !isModerator) {
                return NextResponse.json({ error: "Seul l'auteur de la fiche peut épingler un commentaire." }, { status: 403 });
            }
            if (comment.parent) {
                return NextResponse.json({ error: "On ne peut épingler qu'un commentaire principal." }, { status: 400 });
            }
            // Un seul commentaire épinglé par fiche
            if (body.pinned) {
                await Comment.updateMany({ revision: revisionId, pinned: true, _id: { $ne: comment._id } }, { $set: { pinned: false } });
            }
            await Comment.updateOne({ _id: comment._id }, { $set: { pinned: body.pinned } });
            emitThreadItemNew(`fiche:${revisionId}`, { commentId: id });
            return NextResponse.json({ success: true, pinned: body.pinned });
        }

        return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
    } catch (err: any) {
        console.error("Erreur modification commentaire :", err?.message ?? err);
        return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const ctx = await loadContext(req, id);
        if ("error" in ctx) return ctx.error;
        const { user, comment, revisionId } = ctx;

        // Auteur du commentaire OU auteur de la fiche OU modérateur/admin
        const isModerator = await hasPermission(user, "fiche.delete").catch(() => false);
        if (!ctx.isCommentAuthor && !ctx.isFicheAuthor && !isModerator) {
            return NextResponse.json(
                { error: "Tu n'es pas autorisé à supprimer ce commentaire." },
                { status: 403 },
            );
        }

        // Supprimer un commentaire supprime aussi ses réponses
        const replyIds = (await Comment.find({ parent: comment._id }).select("_id").lean()).map((r) => r._id);
        const ids = [comment._id, ...replyIds];

        await Revision.findByIdAndUpdate(revisionId, { $pull: { comments: { $in: ids } } });
        await Comment.deleteMany({ _id: { $in: ids } });

        emitThreadItemNew(`fiche:${revisionId}`, { commentId: id });

        return NextResponse.json({ success: true, deleted: ids.length }, { status: 200 });
    } catch (err: any) {
        console.error("Erreur suppression commentaire :", err?.message ?? err);
        return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
}
