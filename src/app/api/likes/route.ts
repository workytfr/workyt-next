import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";
import PointTransaction from '@/models/PointTransaction';
import mongoose from "mongoose";

// Connexion à la base de données
connectDB();

// Cache pour le rate limiting en mémoire (en production, utilisez Redis)
const rateLimitCache = new Map();

// Configuration du rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_LIKES_PER_WINDOW = 1; // Max 10 likes par minute par utilisateur

// Utilitaire pour centraliser les erreurs
function handleError(message: string, status: number = 500) {
    return NextResponse.json({ success: false, message }, { status });
}

// Fonction de rate limiting
function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userKey = `like_${userId}`;

    if (!rateLimitCache.has(userKey)) {
        rateLimitCache.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    const userLimit = rateLimitCache.get(userKey);

    // Reset si la fenêtre est expirée
    if (now > userLimit.resetTime) {
        rateLimitCache.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    // Vérifier si la limite est atteinte
    if (userLimit.count >= MAX_LIKES_PER_WINDOW) {
        return false;
    }

    // Incrémenter le compteur
    userLimit.count++;
    return true;
}

// Fonction pour nettoyer le cache (optionnel, pour éviter la fuite mémoire)
function cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
        if (now > value.resetTime) {
            rateLimitCache.delete(key);
        }
    }
}

// Fonction pour ajouter un like avec opérations atomiques
async function likeRevision(revision: any, userId: mongoose.Types.ObjectId) {
    try {
        // Vérifier à nouveau que l'utilisateur n'a pas déjà liké (double-check)
        const updatedRevision = await Revision.findById(revision._id);

        if (!updatedRevision) {
            throw new Error("Révision introuvable");
        }

        const alreadyLiked = updatedRevision.likedBy.some((like: any) =>
            like.userId.toString() === userId.toString()
        );

        if (alreadyLiked) {
            throw new Error("Déjà liké");
        }

        // Mettre à jour la révision de manière atomique
        const revisionResult = await Revision.findByIdAndUpdate(
            revision._id,
            {
                $inc: { likes: 1 },
                $push: { likedBy: { userId: userId.toString(), likedAt: new Date() } }
            },
            { new: true }
        );

        if (!revisionResult) {
            throw new Error("Erreur lors de la mise à jour de la révision");
        }

        // Mettre à jour les points de l'auteur
        await User.findByIdAndUpdate(
            revision.author,
            { $inc: { points: 5 } }
        );

        // Créer la transaction de points
        await PointTransaction.create({
            user: revision.author,
            revision: revision._id,
            action: 'likeRevision',
            type: 'gain',
            points: 5
        });

        // Mettre à jour la progression des quêtes pour l'auteur de la fiche
        const { QuestService } = await import('@/lib/questService');
        await QuestService.updateQuestProgress(revision.author.toString(), 'fiche_like_received');

        // Mettre à jour l'objet local pour la réponse
        revision.likes += 1;
        revision.likedBy.push({ userId: userId.toString(), likedAt: new Date() });

    } catch (error) {
        console.error("Erreur lors de l'ajout du like :", error);
        throw error;
    }
}


export async function POST(req: NextRequest) {
    try {
        // Authentification via authMiddleware
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return handleError("Non autorisé. Veuillez vous connecter.", 401);
        }

        const userId = user._id.toString();

        // Vérification du rate limiting
        if (!checkRateLimit(userId)) {
            return handleError("Trop de tentatives. Veuillez patienter avant de réessayer.", 429);
        }

        const body = await req.json();
        const { revisionId } = body;

        // Validation de l'ID de la fiche
        if (!revisionId || !mongoose.Types.ObjectId.isValid(revisionId)) {
            return handleError("ID de la fiche invalide.", 400);
        }

        // Vérification si la fiche existe et récupération des données nécessaires
        const revision = await Revision.findById(revisionId).select("likes likedBy author");
        if (!revision) {
            return handleError("Fiche non trouvée.", 404);
        }

        // Empêcher l'auto-like (optionnel)
        if (revision.author.toString() === userId) {
            return handleError("Vous ne pouvez pas liker votre propre fiche.", 403);
        }

        // Vérification si l'utilisateur a déjà liké
        const existingLike = revision.likedBy.find((like: any) =>
            like.userId.toString() === userId
        );

        if (existingLike) {
            return handleError("Vous avez déjà liké cette fiche.", 409);
        }

        // Ajouter le like
        await likeRevision(revision, new mongoose.Types.ObjectId(userId));

        // Nettoyer le cache périodiquement
        if (Math.random() < 0.1) { // 10% de chance
            cleanExpiredCache();
        }

        return NextResponse.json(
            {
                success: true,
                message: "Fiche likée avec succès !",
                likes: revision.likes,
                hasLiked: true
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Erreur lors du traitement des likes :", error.message);

        // Gestion spécifique des erreurs de transaction
        if (error.message === "Déjà liké" || error.message === "Révision introuvable") {
            return handleError("Vous avez déjà liké cette fiche.", 409);
        }

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
        const revision = await Revision.findById(revisionId).select("likedBy likes");
        if (!revision) {
            return handleError("Fiche non trouvée.", 404);
        }

        const userId = user._id.toString();
        const hasLiked = revision.likedBy.some((like: any) =>
            like.userId.toString() === userId
        );

        return NextResponse.json({
            success: true,
            hasLiked,
            totalLikes: revision.likes
        }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la vérification du like :", error.message);
        return handleError("Erreur lors de la vérification du like.");
    }
}