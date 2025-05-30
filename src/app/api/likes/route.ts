import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";
import PointTransaction from '@/models/PointTransaction';
import mongoose from "mongoose";

// Connexion à la base de données
connectDB();

// Utilitaire pour centraliser les erreurs
function handleError(message: string, status: number = 500) {
    return NextResponse.json({ success: false, message }, { status });
}

// Fonction pour ajouter un like
async function likeRevision(revision: any, userId: mongoose.Types.ObjectId) {
    revision.likes += 1;
    revision.likedBy.push({ userId: userId.toString(), likedAt: new Date() });
    await User.findByIdAndUpdate(revision.author, { $inc: { points: 5 } });
    await PointTransaction.create({
        user:     revision.author,
        revision: revision._id,
        action:   'likeRevision',
        type:     'gain',
        points:   5
    });
}

// Fonction pour retirer un like
async function dislikeRevision(revision: any, userId: mongoose.Types.ObjectId) {
    revision.likes -= 1;
    revision.likedBy.filter((like: any) => like.userId.toString() !== userId.toString());
    await User.findByIdAndUpdate(revision.author, { $inc: { points: -5 } });
    await PointTransaction.create({
        user:     revision.author,
        revision: revision._id,
        action:   'unlikeRevision',
        type:     'perte',
        points:   -5
    });
}

export async function POST(req: NextRequest) {
    try {
        // Authentification via authMiddleware
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return handleError("Non autorisé. Veuillez vous connecter.", 401);
        }

        const { revisionId } = await req.json();

        // Validation de l'ID de la fiche
        if (!revisionId || !mongoose.Types.ObjectId.isValid(revisionId)) {
            return handleError("ID de la fiche invalide.", 400);
        }

        // Vérification si la fiche existe
        const revision = await Revision.findById(revisionId).select("likes likedBy author");
        if (!revision) {
            return handleError("Fiche non trouvée.", 404);
        }

        const userId = user._id.toString();

        // Vérification si l'utilisateur a déjà liké
        const existingLike = revision.likedBy.find((like: any) => like.userId.equals(userId));

        if (existingLike) {
            // Retirer le like
            await dislikeRevision(revision, new mongoose.Types.ObjectId(userId));
        } else {
            // Ajouter un like
            await likeRevision(revision, new mongoose.Types.ObjectId(userId));
        }

        // Sauvegarde des changements
        await revision.save();

        return NextResponse.json(
            {
                success: true,
                message: existingLike ? "Like retiré." : "Fiche likée.",
                likes: revision.likes,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Erreur lors du traitement des likes :", error.message);
        return handleError("Erreur interne du serveur.");
    }
}

export async function GET(req: NextRequest) {
    try {
        // Authentification via authMiddleware
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return handleError("Non autorisé. Veuillez vous connecter.", 401);
        }

        const { searchParams } = new URL(req.url!);
        const revisionId = searchParams.get("revisionId");

        // Validation de l'ID de la fiche
        if (!revisionId || !mongoose.Types.ObjectId.isValid(revisionId)) {
            return handleError("ID de la fiche invalide.", 400);
        }

        // Vérification si la fiche existe
        const revision = await Revision.findById(revisionId).select("likedBy");
        if (!revision) {
            return handleError("Fiche non trouvée.", 404);
        }

        const userId = new mongoose.Types.ObjectId(user._id.toString());
        const hasLiked = revision.likedBy.some((like: any) => like.userId.equals(userId));

        return NextResponse.json({ success: true, hasLiked }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la vérification du like :", error.message);
        return handleError("Erreur lors de la vérification du like.");
    }
}
