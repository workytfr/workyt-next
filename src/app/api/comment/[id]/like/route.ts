import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

connectDB();

/** POST /api/comment/:id/like : marque (ou retire) un commentaire comme utile. */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const user = await authMiddleware(req).catch(() => null);
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const rl = rateLimit(`comment-like:${user._id}`, 30, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide." }, { status: 400 });
        }

        const comment = await Comment.findById(id).select("author likedBy").lean();
        if (!comment) {
            return NextResponse.json({ error: "Commentaire introuvable." }, { status: 404 });
        }
        if (String(comment.author) === String(user._id)) {
            return NextResponse.json({ error: "Tu ne peux pas marquer ton propre commentaire comme utile." }, { status: 400 });
        }

        // Mises à jour atomiques : le filtre garantit que le compteur suit la liste
        const liked = (comment.likedBy ?? []).some((u) => String(u) === String(user._id));
        const updated = liked
            ? await Comment.findOneAndUpdate(
                { _id: id, likedBy: user._id },
                { $pull: { likedBy: user._id }, $inc: { likes: -1 } },
                { new: true },
            ).select("likes").lean()
            : await Comment.findOneAndUpdate(
                { _id: id, likedBy: { $ne: user._id } },
                { $addToSet: { likedBy: user._id }, $inc: { likes: 1 } },
                { new: true },
            ).select("likes").lean();

        const fresh = updated ?? (await Comment.findById(id).select("likes").lean());
        return NextResponse.json({ success: true, liked: !liked, likes: Math.max(0, fresh?.likes ?? 0) });
    } catch (err: any) {
        console.error("Erreur « utile » commentaire :", err?.message ?? err);
        return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
}
