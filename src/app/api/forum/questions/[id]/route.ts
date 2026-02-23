import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import Revision from "@/models/Revision";
import { generateSignedUrl } from "@/lib/b2Utils"; // Fonction pour générer des URLs signées

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
                        const rawKey = decodeURIComponent(fileUrl.split("/").slice(-1)[0]); // 🔹 Extraire le nom de fichier proprement
                        const fileKey = `uploads/${rawKey}`; // 🔹 Vérifier si `uploads/` est déjà inclus
                        return await generateSignedUrl(process.env.S3_BUCKET_NAME!, fileKey);
                    } catch (err) {
                        console.error("❌ Erreur de signature de l'URL :", err);
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