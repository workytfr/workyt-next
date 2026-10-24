import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

// Connexion à la base de données
connectDB();

// Utilitaire pour centraliser les erreurs
function handleError(message: string, status: number = 500) {
    return NextResponse.json({ success: false, message }, { status });
}

type LikeContext =
    | { error: Response }
    | { userId: mongoose.Types.ObjectId; revisionId: string };

async function readContext(req: NextRequest, revisionId: unknown): Promise<LikeContext> {
    const user = await authMiddleware(req).catch(() => null);
    if (!user || !user._id) {
        return { error: handleError("Connecte-toi pour aimer une fiche.", 401) };
    }
    // Large pour une lecture normale, bloque les rafales de clics automatisées
    const rl = rateLimit(`fiche-like:${user._id}`, 20, 60_000);
    if (!rl.success) return { error: rateLimitResponse(rl.retryAfterMs) };

    if (typeof revisionId !== "string" || !mongoose.Types.ObjectId.isValid(revisionId)) {
        return { error: handleError("ID de la fiche invalide.", 400) };
    }
    return { userId: user._id as mongoose.Types.ObjectId, revisionId };
}

/**
 * Récompenses de l'auteur (points, quête, badges, notification) : uniquement au
 * PREMIER like de chaque élève sur cette fiche. Retirer puis remettre son like
 * ne rapporte plus rien, il n'y a donc rien à gagner à faire des allers-retours.
 */
async function rewardAuthor(authorId: string, revisionId: string, likerId: string) {
    const { addPointsWithBoost } = await import("@/lib/pointsService");
    await addPointsWithBoost(authorId, 5, "likeRevision", { revision: revisionId });

    const { QuestService } = await import("@/lib/questService");
    await QuestService.updateQuestProgress(authorId, "fiche_like_received");

    const { BadgeService } = await import("@/lib/badgeService");
    await BadgeService.triggerBadgeCheck(authorId);

    const { NotificationService } = await import("@/lib/notificationService");
    await NotificationService.notifyFicheLiked(revisionId, likerId);
}

/** POST /api/likes { revisionId } : aimer une fiche */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const ctx = await readContext(req, body?.revisionId);
        if ("error" in ctx) return ctx.error;
        const { userId, revisionId } = ctx;

        const revision = await Revision.findById(revisionId).select("author likes");
        if (!revision) return handleError("Fiche non trouvée.", 404);
        if (revision.author.toString() === userId.toString()) {
            return handleError("Tu ne peux pas aimer ta propre fiche.", 403);
        }

        // Atomique : le filtre empêche un double like (double clic, deux onglets)
        const before = await Revision.findOneAndUpdate(
            { _id: revisionId, "likedBy.userId": { $ne: userId } },
            {
                $inc: { likes: 1 },
                $push: { likedBy: { userId, likedAt: new Date() } },
                $addToSet: { likeHistory: userId },
            },
            { new: false, projection: { likes: 1, likeHistory: 1 } },
        ).lean<{ likes: number; likeHistory?: mongoose.Types.ObjectId[] }>();

        if (!before) {
            return NextResponse.json({ success: true, likes: revision.likes, hasLiked: true });
        }

        const firstTime = !(before.likeHistory ?? []).some((id) => id.toString() === userId.toString());
        if (firstTime) {
            await rewardAuthor(revision.author.toString(), revisionId, userId.toString());
        }

        return NextResponse.json(
            { success: true, message: "Fiche aimée !", likes: before.likes + 1, hasLiked: true },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("Erreur lors du like de fiche :", error.message);
        return handleError("Erreur interne du serveur.");
    }
}

/** DELETE /api/likes?revisionId=… : retirer son like (clic par erreur) */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ctx = await readContext(req, searchParams.get("revisionId"));
        if ("error" in ctx) return ctx.error;
        const { userId, revisionId } = ctx;

        // L'élève reste dans likeHistory : un nouveau like ne redonnera pas de points
        const updated = await Revision.findOneAndUpdate(
            { _id: revisionId, "likedBy.userId": userId },
            {
                $inc: { likes: -1 },
                $pull: { likedBy: { userId } },
                $addToSet: { likeHistory: userId },
            },
            { new: true, projection: { likes: 1 } },
        ).lean<{ likes: number }>();

        const likes = updated?.likes
            ?? (await Revision.findById(revisionId).select("likes").lean<{ likes: number }>())?.likes
            ?? 0;
        return NextResponse.json({ success: true, likes: Math.max(0, likes), hasLiked: false });
    } catch (error: any) {
        console.error("Erreur lors du retrait du like :", error.message);
        return handleError("Erreur interne du serveur.");
    }
}

/** GET /api/likes?revisionId=… : le visiteur a-t-il aimé la fiche ? */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req).catch(() => null);
        if (!user || !user._id) {
            return handleError("Non autorisé. Veuillez vous connecter.", 401);
        }

        const revisionId = new URL(req.url).searchParams.get("revisionId");
        if (!revisionId || !mongoose.Types.ObjectId.isValid(revisionId)) {
            return handleError("ID de la fiche invalide.", 400);
        }

        const revision = await Revision.findById(revisionId).select("likedBy likes author").lean<{
            likes: number;
            author: mongoose.Types.ObjectId;
            likedBy: { userId: mongoose.Types.ObjectId }[];
        }>();
        if (!revision) {
            return handleError("Fiche non trouvée.", 404);
        }

        const userId = user._id.toString();
        return NextResponse.json({
            success: true,
            hasLiked: revision.likedBy.some((like) => like.userId?.toString() === userId),
            isAuthor: revision.author?.toString() === userId,
            totalLikes: revision.likes,
        }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la vérification du like :", error.message);
        return handleError("Erreur lors de la vérification du like.");
    }
}
