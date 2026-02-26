import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import Revision from "@/models/Revision";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";
import Report from "@/models/Report";
import { generateSignedUrl, extractFileKeyFromUrl, deleteFileFromStorage } from "@/lib/b2Utils";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Connexion à MongoDB
        await dbConnect();

        // Récupération des paramètres
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        // 🔹 Await the params Promise
        const resolvedParams = await params;

        // Vérifier si l'ID est fourni
        if (!resolvedParams.id) {
            return NextResponse.json(
                { success: false, message: "ID de la question manquant." },
                { status: 400 }
            );
        }

        const question = await Question.findById(resolvedParams.id).populate({
            path: "user",
            select: "username points",
        });

        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }

        // 🔹 Générer des URLs signées pour les pièces jointes
        let signedFileURLs: string[] = [];
        if (question.attachments && question.attachments.length > 0) {
            signedFileURLs = await Promise.all(
                question.attachments.map(async (fileUrl: string) => {
                    try {
                        let fileKey = extractFileKeyFromUrl(fileUrl);
                        if (!fileKey) {
                            const rawKey = fileUrl.split("/").pop()?.split("?")[0] || "";
                            fileKey = rawKey.includes("/") ? rawKey : `uploads/${decodeURIComponent(rawKey)}`;
                        }
                        return await generateSignedUrl(process.env.S3_BUCKET_NAME!, fileKey);
                    } catch (err) {
                        console.error("Erreur signature URL pièce jointe:", err);
                        return null;
                    }
                })
            ).then((results) => results.filter(Boolean));
        }

        // 🔹 Récupérer les réponses avec pagination et username des auteurs
        const answers = await Answer.find({ question: resolvedParams.id })
            .populate({
                path: "user",
                select: "username points",
            })
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalAnswers = await Answer.countDocuments({ question: resolvedParams.id });

        // 🔹 Extraction des mots-clés du titre pour rechercher des fiches de révision
        // Échapper les caractères spéciaux de regex pour éviter les erreurs
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const titleWords = question.title
            .split(" ")
            .slice(0, 4)
            .map((word: string) => escapeRegex(word))
            .join("|");

        const relatedRevisions = await Revision.find({
            subject: question.subject,
            level: question.classLevel,
            title: { $regex: titleWords, $options: "i" },
        })
            .populate("author", "username points")
            .select("title content author likes createdAt")
            .sort({ likes: -1 })
            .limit(2);

        return NextResponse.json({
            success: true,
            question: {
                ...question.toObject(),
                attachments: signedFileURLs, // 🔹 URLs signées sécurisées
            },
            answers,
            revisions: relatedRevisions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalAnswers / limit),
                totalAnswers,
            },
        });
    } catch (error: any) {
        console.error("❌ Erreur lors de la récupération de la question :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de récupérer la question." },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/forum/questions/[id] - Supprimer une question (modérateur/admin uniquement)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Non authentifié." },
                { status: 401 }
            );
        }
        
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Utilisateur non trouvé." },
                { status: 404 }
            );
        }
        
        // Vérifier que l'utilisateur est modérateur ou admin
        if (user.role !== 'Admin' && user.role !== 'Modérateur') {
            return NextResponse.json(
                { success: false, message: "Accès non autorisé. Rôle modérateur requis." },
                { status: 403 }
            );
        }
        
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID de la question requis." },
                { status: 400 }
            );
        }
        
        // Récupérer la question
        const question = await Question.findById(id);
        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }
        
        // Vérifier qu'il existe un signalement actif pour ce contenu (uniquement pour les modérateurs)
        const isAdmin = user.role === 'Admin';
        if (!isAdmin) {
            const existingReport = await Report.findOne({
                'reportedContent.type': 'forum_question',
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
        
        // Supprimer les pièces jointes de B2 si présentes
        if (question.attachments && question.attachments.length > 0) {
            console.log(`Suppression de ${question.attachments.length} pièce(s) jointe(s)...`);
            
            const deletionPromises = question.attachments.map(async (fileUrl: string) => {
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
        
        // Récupérer toutes les réponses pour traitement
        const answers = await Answer.find({ question: id });
        
        // Pour chaque réponse validée ou meilleure réponse, retirer les points
        for (const answer of answers) {
            if (answer.status === 'Validée' || answer.status === 'Meilleure Réponse') {
                // Retirer les points à l'auteur de la réponse
                await User.findByIdAndUpdate(answer.user, { $inc: { points: -question.points } });
                
                // Enregistrer la transaction de points (retrait)
                await PointTransaction.create({
                    user: answer.user,
                    question: question._id,
                    answer: answer._id,
                    action: "deleteQuestion",
                    type: "perte",
                    points: -question.points,
                    createdAt: new Date(),
                });
            }
        }
        
        // Supprimer toutes les réponses associées
        await Answer.deleteMany({ question: id });
        
        // Supprimer la question
        await Question.findByIdAndDelete(id);
        
        return NextResponse.json(
            { success: true, message: "Question et réponses associées supprimées avec succès." },
            { status: 200 }
        );
        
    } catch (error: any) {
        console.error("❌ Erreur lors de la suppression de la question:", error.message);
        return NextResponse.json(
            { success: false, message: "Erreur lors de la suppression de la question." },
            { status: 500 }
        );
    }
}