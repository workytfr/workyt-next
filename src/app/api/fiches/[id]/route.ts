import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import authMiddleware from "@/middlewares/authMiddleware";
import User from "@/models/User";
import Comment from "@/models/Comment"; // Assurez-vous d'importer le modèle
import { generateSignedUrl, deleteFileFromStorage, extractFileKeyFromUrl } from "@/lib/b2Utils"; // Fonctions pour générer des URLs signées et supprimer des fichiers

// Connexion à MongoDB
connectDB();

/**
 * Gérer la méthode GET pour récupérer une fiche spécifique
 */
export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

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
                    const fileKey = `fiches/${decodeURIComponent(rawKey)}`; // Ajouter le chemin et corriger l'encodage
                    return await generateSignedUrl(process.env.S3_BUCKET_NAME!, fileKey); // Générer l'URL signée
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
export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID de la fiche requis." }, { status: 400 });
    }

    try {
        const user = await authMiddleware(req); // Authentification de l'utilisateur

        if (!user.role || typeof user.role !== 'string' || !["Admin", "Correcteur", "Rédacteur"].includes(user.role)) {
            return NextResponse.json(
                { success: false, message: "Accès refusé. Vous n'avez pas les permissions nécessaires pour modifier cette fiche." },
                { status: 403 }
            );
        }

        const fiche = await Revision.findById(id);
        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
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
 * Permet aux créateurs de supprimer leurs propres fiches et aux admins de supprimer toutes les fiches
 */
export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID de la fiche requis." }, { status: 400 });
    }

    try {
        const user = await authMiddleware(req); // Authentification de l'utilisateur

        // Récupérer la fiche pour vérifier le créateur
        const fiche = await Revision.findById(id);
        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        // Vérifier les permissions : Admin ou créateur de la fiche
        const isAdmin = user.role === "Admin";
        const isCreator = fiche.author.toString() === user._id.toString();

        if (!isAdmin && !isCreator) {
            return NextResponse.json(
                { success: false, message: "Accès refusé. Seuls les créateurs de fiches et les administrateurs peuvent supprimer cette fiche." },
                { status: 403 }
            );
        }

        // Supprimer les fichiers associés du cloud storage
        if (fiche.files && fiche.files.length > 0) {
            console.log(`Suppression de ${fiche.files.length} fichier(s) associé(s) à la fiche...`);
            
            const deletionPromises = fiche.files.map(async (fileUrl: string) => {
                try {
                    const fileKey = extractFileKeyFromUrl(fileUrl);
                    const deletionSuccess = await deleteFileFromStorage(process.env.S3_BUCKET_NAME!, fileKey);
                    
                    if (deletionSuccess) {
                        console.log(`Fichier supprimé avec succès: ${fileKey}`);
                    } else {
                        console.warn(`Échec de la suppression du fichier: ${fileKey}`);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la suppression du fichier ${fileUrl}:`, error);
                }
            });

            await Promise.all(deletionPromises);
        }

        // Supprimer les commentaires associés à la fiche
        await Comment.deleteMany({ revision: id });

        // Supprimer la fiche de la base de données
        await Revision.findByIdAndDelete(id);

        // Retirer les points à l'auteur (seulement si ce n'est pas un admin qui supprime)
        if (!isAdmin) {
            await User.findByIdAndUpdate(fiche.author, { $inc: { points: -10 } });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Fiche et fichiers associés supprimés avec succès." 
        }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur DELETE :", error.message);
        return NextResponse.json({ success: false, message: "Erreur lors de la suppression." }, { status: 500 });
    }
};