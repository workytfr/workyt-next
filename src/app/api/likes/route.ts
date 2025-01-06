import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import {ObjectId} from "bson"; // Pour récupérer l'utilisateur via un JWT

// Connexion à la base de données
connectDB();

// POST : Permet à l'utilisateur de liker ou disliker une fiche
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.JWT_SECRET });

        // Vérifier si l'utilisateur est connecté
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Non autorisé. Veuillez vous connecter." },
                { status: 401 }
            );
        }

        const { revisionId } = await req.json();

        // Vérifier si l'ID de la fiche est fourni
        if (!revisionId) {
            return NextResponse.json(
                { success: false, message: "ID de la fiche requis." },
                { status: 400 }
            );
        }

        // Récupérer la fiche
        const revision = await Revision.findById(revisionId);
        if (!revision) {
            return NextResponse.json(
                { success: false, message: "Fiche non trouvée." },
                { status: 404 }
            );
        }

        const userId = token.sub;

        // Vérifier si l'utilisateur a liké dans les dernières 24 heures
        const existingLike = revision.likedBy.find(
            like => like.userId.toString() === userId
        );

        if (existingLike) {
            const now = new Date();
            const lastLikedAt = new Date(existingLike.likedAt);

            // Vérifier si le dernier like est dans les 24 heures
            const diffInHours = Math.abs(now.getTime() - lastLikedAt.getTime()) / (1000 * 60 * 60);
            if (diffInHours < 24) {
                return NextResponse.json(
                    { success: false, message: "Vous ne pouvez liker ou disliker qu'une fois par jour." },
                    { status: 429 }
                );
            }
        }

        const hasLiked = !!existingLike;

        if (hasLiked) {
            // L'utilisateur retire son like (dislike)
            revision.likes -= 1;
            revision.likedBy = revision.likedBy.filter(like => like.userId.toString() !== userId);

            // Enlever 5 points à l'auteur
            await User.findByIdAndUpdate(revision.author, { $inc: { points: -5 } });
        } else {
            // L'utilisateur ajoute un like
            revision.likes += 1;

            if (existingLike) {
                // Si un like existe, mettre à jour la date
                (existingLike as any).likedAt = new Date();
            } else {
                revision.likedBy.push({ userId: new ObjectId(userId), likedAt: new Date() });
            }

            // Ajouter 5 points à l'auteur
            await User.findByIdAndUpdate(revision.author, { $inc: { points: 5 } });
        }

        // Sauvegarder les modifications
        await revision.save();

        return NextResponse.json(
            { success: true, message: hasLiked ? "Like retiré." : "Fiche likée." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors du traitement des likes :", error);
        return NextResponse.json(
            { success: false, message: "Erreur lors du traitement des likes." },
            { status: 500 }
        );
    }
}

// GET : Vérifier si un utilisateur a déjà liké une fiche
export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.JWT_SECRET });

        // Vérifier si l'utilisateur est connecté
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Non autorisé. Veuillez vous connecter." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url!);
        const revisionId = searchParams.get("revisionId");

        // Vérifier si l'ID de la fiche est fourni
        if (!revisionId) {
            return NextResponse.json(
                { success: false, message: "ID de la fiche requis." },
                { status: 400 }
            );
        }

        // Récupérer la fiche
        const revision = await Revision.findById(revisionId);
        if (!revision) {
            return NextResponse.json(
                { success: false, message: "Fiche non trouvée." },
                { status: 404 }
            );
        }

        const userId = token.sub;

        // Vérifier si l'utilisateur a déjà liké la fiche
        const hasLiked = revision.likedBy.some(
            like => like.userId.toString() === userId
        );

        return NextResponse.json(
            { success: true, hasLiked },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de la vérification du like :", error);
        return NextResponse.json(
            { success: false, message: "Erreur lors de la vérification du like." },
            { status: 500 }
        );
    }
}
