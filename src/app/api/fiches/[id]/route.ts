import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from "@/models/User";
import Comment from "@/models/Comment";
import Report from "@/models/Report";
import { generateSignedUrl, deleteFileFromStorage, extractFileKeyFromUrl } from "@/lib/b2Utils";

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
            .populate("author", "username points role")
            .populate({
                path: "likedBy.userId",
                select: "username",
            });

        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        // Générer des URLs signées pour les fichiers (format upload: fiches/uuid-file.pdf)
        const signedFileURLs = await Promise.all(
            (fiche.files || []).map(async (fileUrl: string) => {
                try {
                    let fileKey = extractFileKeyFromUrl(fileUrl);
                    if (!fileKey) {
                        const rawKey = fileUrl.split("/").pop()?.split("?")[0] || "";
                        fileKey = rawKey.includes("/") ? rawKey : `fiches/${decodeURIComponent(rawKey)}`;
                    }
                    return await generateSignedUrl(process.env.S3_BUCKET_NAME!, fileKey);
                } catch (err) {
                    return null;
                }
            })
        ).then((results) => results.filter(Boolean));

        const data = {
            ...fiche.toObject(),
            files: signedFileURLs,
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
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
        }

        if (!session.user.role || typeof session.user.role !== 'string' || !["Admin", "Correcteur", "Rédacteur", "Helpeur"].includes(session.user.role)) {
            return NextResponse.json(
                { success: false, message: "Accès refusé. Vous n'avez pas les permissions nécessaires pour modifier cette fiche." },
                { status: 403 }
            );
        }

        const fiche = await Revision.findById(id);
        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        const body = await req.json();

        const allowedFields = ['title', 'content', 'subject', 'level', 'status', 'files'];
        const updatedData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updatedData[field] = body[field];
            }
        }

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
export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID de la fiche requis." }, { status: 400 });
    }

    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
        }

        const fiche = await Revision.findById(id);
        if (!fiche) {
            return NextResponse.json({ success: false, message: "Fiche non trouvée." }, { status: 404 });
        }

        const isAdmin = session.user.role === "Admin";
        const isModerator = session.user.role === "Modérateur";
        const isCreator = fiche.author.toString() === session.user.id;

        if (!isAdmin && !isModerator && !isCreator) {
            return NextResponse.json(
                { success: false, message: "Accès refusé. Seuls les créateurs de fiches, les modérateurs et les administrateurs peuvent supprimer cette fiche." },
                { status: 403 }
            );
        }

        // Vérifier qu'il existe un signalement actif pour ce contenu (uniquement pour les modérateurs)
        if (isModerator && !isAdmin && !isCreator) {
            const existingReport = await Report.findOne({
                'reportedContent.type': 'revision',
                'reportedContent.id': id,
                status: { $in: ['en_attente', 'en_cours'] }
            });
            
            if (!existingReport) {
                return NextResponse.json(
                    { success: false, message: "Vous ne pouvez supprimer ce contenu que s'il fait l'objet d'un signalement actif." },
                    { status: 403 }
                );
            }
        }

        if (fiche.files && fiche.files.length > 0) {
            console.log(`Suppression de ${fiche.files.length} fichier(s) associé(s) à la fiche...`);

            const deletionPromises = fiche.files.map(async (fileUrl: string) => {
                try {
                    if (!fileUrl || fileUrl.includes('undefined')) {
                        console.warn(`URL de fichier invalide ignorée: ${fileUrl}`);
                        return;
                    }

                    const fileKey = extractFileKeyFromUrl(fileUrl);
                    if (!fileKey) {
                        console.warn(`Impossible d'extraire la clé du fichier: ${fileUrl}`);
                        return;
                    }

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

        await Comment.deleteMany({ revision: id });
        await Revision.findByIdAndDelete(id);

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
