import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment, { IComment } from "@/models/Comment";
import Revision from "@/models/Revision";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";

connectDB();

export async function POST(req: NextRequest) {
    try {
        // Authentification : Récupérer et valider l'utilisateur
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            console.error("AuthMiddleware : Utilisateur non trouvé ou non autorisé");
            return NextResponse.json(
                { error: "Non autorisé. Utilisateur non trouvé ou token invalide." },
                { status: 401 }
            );
        }

        // Lecture des données de la requête
        const body = await req.json();
        const { revisionId, content } = body;

        // Validation des données
        if (!revisionId || !content) {
            return NextResponse.json(
                { error: "L'ID de la fiche et le contenu sont requis." },
                { status: 400 }
            );
        }

        // Vérification de l'existence de la fiche de révision
        const revision = await Revision.findById(revisionId);
        if (!revision) {
            return NextResponse.json(
                { error: "Fiche de révision introuvable." },
                { status: 404 }
            );
        }

        // Création du commentaire
        const newComment: mongoose.Document<unknown, any, IComment> & IComment = await Comment.create({
            content,
            author: user._id,
            revision: revisionId,
            createdAt: new Date(),
        });

        // Mise à jour de la liste des commentaires de la fiche
        if (newComment._id instanceof mongoose.Types.ObjectId) {
            revision.comments.push(newComment._id);
        } else {
            throw new Error("Invalid ObjectId format for newComment._id.");
        }

        await revision.save();

        // Notification de l'auteur de la fiche
        const { NotificationService } = await import('@/lib/notificationService');
        await NotificationService.notifyNewFicheComment(revisionId, user._id.toString());

        return NextResponse.json(
            { success: true, data: newComment },
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

export async function GET(req: NextRequest) {
    try {
        // Récupération des paramètres de la requête
        const { searchParams } = new URL(req.url);
        const revisionId = searchParams.get("revisionId");
        const page = parseInt(searchParams.get("page") || "1", 10); // Page actuelle
        const limit = parseInt(searchParams.get("limit") || "5", 10); // Nombre de commentaires par page

        if (!revisionId) {
            return NextResponse.json(
                { error: "L'ID de la fiche de révision est requis." },
                { status: 400 }
            );
        }

        if (page < 1 || limit < 1) {
            return NextResponse.json(
                { error: "Les paramètres 'page' et 'limit' doivent être supérieurs à 0." },
                { status: 400 }
            );
        }

        // Calcul pour la pagination
        const skip = (page - 1) * limit;

        // Récupération des commentaires pour la fiche de révision avec les informations des utilisateurs
        const comments = await Comment.find({ revision: revisionId })
            .populate({
                path: "author", // Récupère les données de l'utilisateur
                select: "username name _id", // Champs à inclure
            })
            .sort({ createdAt: -1 }) // Trier par date de création (les plus récents en premier)
            .skip(skip) // Ignorer les commentaires précédents
            .limit(limit) // Limiter le nombre de résultats
            .lean();

        // Récupération du nombre total de commentaires
        const totalComments = await Comment.countDocuments({ revision: revisionId });

        // Structuration de la réponse
        const response = {
            comments: comments.map((comment) => ({
                id: comment._id,
                content: comment.content,
                username: (comment.author as any)?.username || "Utilisateur inconnu",
                userId: (comment.author as any)?._id || null,
                createdAt: comment.createdAt,
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalComments / limit),
                totalComments,
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