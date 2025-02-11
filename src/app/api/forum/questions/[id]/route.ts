import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import Revision from "@/models/Revision";
import { generateSignedUrl } from "@/lib/b2Utils"; // Fonction pour générer des URLs signées

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Connexion à MongoDB
        await dbConnect();

        // Récupération des paramètres
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        // Vérifier si l'ID est fourni
        if (!params.id) {
            return NextResponse.json(
                { success: false, message: "ID de la question manquant." },
                { status: 400 }
            );
        }

        // Récupérer la question avec son auteur (username et points)
        const question = await Question.findById(params.id)
            .populate({
                path: "user",
                select: "username points", // Récupérer username et points de l'auteur
            });

        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }

        // Générer des URLs signées pour les fichiers joints
        const signedFileURLs = await Promise.all(
            (question.attachments || []).map(async (fileUrl: string) => {
                try {
                    const rawKey = fileUrl.split("/").slice(-1)[0]; // Extraire le nom brut
                    const fileKey = `uploads/${decodeURIComponent(rawKey)}`;
                    return await generateSignedUrl(process.env.B2_BUCKET_NAME!, fileKey);
                } catch (err) {
                    return null;
                }
            })
        ).then((results) => results.filter(Boolean));

        // Récupérer les réponses associées avec pagination et afficher le username des auteurs
        const answers = await Answer.find({ question: params.id })
            .populate({
                path: "user",
                select: "username points",
            })
            .sort({ createdAt: 1 }) // Trier par date décroissante
            .skip((page - 1) * limit)
            .limit(limit);

        // Nombre total de réponses associées à cette question
        const totalAnswers = await Answer.countDocuments({ question: params.id });

        // Extraction de mots-clés depuis le titre de la question
        const titleWords = question.title.split(" ").slice(0, 4).join("|"); // Prend les 4 premiers mots pour une recherche regex

        // Récupérer des fiches de révision liées à la matière et au niveau de la question
        const relatedRevisions = await Revision.find({
            subject: question.subject,
            level: question.classLevel,
            title: { $regex: titleWords, $options: "i" }, // Recherche partielle insensible à la casse
        })
            .populate("author", "username points") // ✅ Ajouté pour afficher l'auteur et ses points
            .select("title content author likes createdAt")
            .sort({ likes: -1 }) // Trier par popularité (likes)
            .limit(2); // Limiter à 2 fiches suggérées

        return NextResponse.json({
            success: true,
            question: {
                ...question.toObject(),
                attachments: signedFileURLs, // Remplace les URLs par des URLs signées sécurisées
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
        console.error("Erreur lors de la récupération de la question :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de récupérer la question.", details: error.message },
            { status: 500 }
        );
    }
}
