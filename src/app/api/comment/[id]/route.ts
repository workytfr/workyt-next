import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Revision from "@/models/Revision";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";
import { hasPermission } from "@/lib/roles";

connectDB();

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide." }, { status: 400 });
        }

        const comment = await Comment.findById(id).populate({ path: "revision", select: "author" });
        if (!comment) {
            return NextResponse.json({ error: "Commentaire introuvable." }, { status: 404 });
        }

        const commentAuthorId = String(comment.author);
        const ficheAuthorId = String((comment.revision as any)?.author ?? "");
        const userId = String(user._id);

        // Auteur du commentaire OU auteur de la fiche OU modérateur/admin
        const isCommentAuthor = commentAuthorId === userId;
        const isFicheAuthor = ficheAuthorId === userId;
        const isModerator = await hasPermission(user.role, "fiche.delete").catch(() => false);

        if (!isCommentAuthor && !isFicheAuthor && !isModerator) {
            return NextResponse.json(
                { error: "Tu n'es pas autorisé à supprimer ce commentaire." },
                { status: 403 },
            );
        }

        // Retirer du tableau de la fiche
        await Revision.findByIdAndUpdate(comment.revision, {
            $pull: { comments: comment._id },
        });

        await Comment.findByIdAndDelete(id);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("Erreur suppression commentaire :", err?.message ?? err);
        return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
}
