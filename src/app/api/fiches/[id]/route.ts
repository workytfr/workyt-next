import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import authMiddleware from "@/middlewares/authMiddleware";
import User from "@/models/User";
import Comment from "@/models/Comment"; // Assurez-vous d'importer le modèle
import { generateSignedUrl } from "@/lib/b2Utils"; // Fonction pour générer des URLs signées

// Connexion à MongoDB
connectDB();

/**
 * Gérer la méthode GET pour récupérer une fiche spécifique
 */
export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID de la fiche requis." }, { status: 400 });
    }

    try {
        // Récupérer la fiche et peupler les données nécessaires
        const fiche = await Revision.findById(id)
            .populate("author", "username points") // Inclure le champ "points" avec "username"
            .populate({
                path: "likedBy.userId",
                select: "username",
            }); // Peupler les utilisateurs ayant liké

        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        // Générer des URLs signées pour les fichiers
        const signedFileURLs = await Promise.all(
            (fiche.files || []).map(async (fileUrl: string) => {
                try {
                    const rawKey = fileUrl.split("/").slice(-1)[0]; // Extraire le nom brut
                    const fileKey = `uploads/${decodeURIComponent(rawKey)}`; // Ajouter le chemin et corriger l'encodage
                    return await generateSignedUrl(process.env.B2_BUCKET_NAME!, fileKey);
                } catch (err) {
                    return null;
                }
            })
        ).then((results) => results.filter(Boolean)); // Supprimer les fichiers pour lesquels une URL n'a pas pu être générée

        const data = {
            ...fiche.toObject(),
            files: signedFileURLs, // Ajouter les URLs signées
        };

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur GET :", error.message);
        return NextResponse.json({ success: false, message: "Erreur lors de la récupération." }, { status: 500 });
    }
};
/**
 * Gérer la méthode PUT pour mettre à jour une fiche
 */
export const PUT = async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID de la fiche requis." }, { status: 400 });
    }

    try {
        const user = await authMiddleware(req); // Authentification de l'utilisateur

        const fiche = await Revision.findById(id);
        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        // Vérification des permissions
        const canEdit =
            user.role === "Admin" ||
            user.role === "Correcteur" ||
            user.role === "Rédacteur" ||
            fiche.author.toString() === user._id.toString();

        if (!canEdit) {
            return NextResponse.json({ success: false, message: "Accès refusé. Permissions insuffisantes." }, { status: 403 });
        }

        const updatedData = await req.json(); // Données de la mise à jour
        const updatedFiche = await Revision.findByIdAndUpdate(id, updatedData, { new: true });

        return NextResponse.json({ success: true, data: updatedFiche }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur PUT :", error.message);
        return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour." }, { status: 500 });
    }
};

/**
 * Gérer la méthode DELETE pour supprimer une fiche
 */
export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID de la fiche requis." }, { status: 400 });
    }

    try {
        const user = await authMiddleware(req); // Authentification de l'utilisateur

        if (user.role !== "Admin") {
            return NextResponse.json({ success: false, message: "Accès refusé. Seuls les administrateurs peuvent supprimer." }, { status: 403 });
        }

        const fiche = await Revision.findByIdAndDelete(id);
        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        // Déduire 10 points de l'auteur
        await User.findByIdAndUpdate(fiche.author, { $inc: { points: -10 } });

        return NextResponse.json({ success: true, message: "Fiche supprimée avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur DELETE :", error.message);
        return NextResponse.json({ success: false, message: "Erreur lors de la suppression." }, { status: 500 });
    }
};
