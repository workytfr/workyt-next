import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import User from "@/models/User";

// Forcer le rendu dynamique pour éviter l'erreur
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        // Connexion à MongoDB
        await dbConnect();

        // Extraction des paramètres de requête
        const { searchParams } = new URL(req.url);
        const subject = searchParams.get("subject");
        const classLevel = searchParams.get("classLevel");
        const status = searchParams.get("status");
        const title = searchParams.get("title"); // Recherche par titre
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        // Construction du filtre avec recherche améliorée
        let filter: any = {};
        if (subject) filter.subject = subject;
        if (classLevel) filter.classLevel = classLevel;
        if (status) filter.status = status;
        
        // Recherche améliorée : titre + contenu + description
        if (title) {
            const searchTerms = title.trim().split(/\s+/);
            const regexPatterns = searchTerms.map(term => ({
                $or: [
                    { title: { $regex: term, $options: "i" } },
                    { "description.whatIDid": { $regex: term, $options: "i" } },
                    { "description.whatINeed": { $regex: term, $options: "i" } }
                ]
            }));
            
            if (regexPatterns.length === 1) {
                filter.$or = regexPatterns[0].$or;
            } else {
                filter.$and = regexPatterns;
            }
        }

        // Récupération des questions avec pagination et tri
        const questions = await Question.find(filter)
            .populate({
                path: "user",
                select: "username points",
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Récupération du nombre de réponses pour chaque question
        const questionIds = questions.map(q => q._id);
        const answerCounts = await Answer.aggregate([
            { $match: { question: { $in: questionIds } } },
            { $group: { _id: "$question", count: { $sum: 1 } } }
        ]);

        // Création d'un mapping questionId -> nombre de réponses
        const answerCountMap = answerCounts.reduce((acc, item) => {
            acc[item._id.toString()] = item.count;
            return acc;
        }, {});

        // Ajout du nombre de réponses à chaque question
        const questionsWithAnswers = questions.map(question => ({
            ...question.toObject(),
            answerCount: answerCountMap[question._id.toString()] || 0
        }));

        // Nombre total de questions correspondant au filtre
        const totalQuestions = await Question.countDocuments(filter);

        return NextResponse.json({
            success: true,
            data: questionsWithAnswers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalQuestions / limit),
                totalQuestions,
            },
        });
    } catch (error: any) {
        console.error("❌ Erreur lors de la récupération des questions :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de récupérer les questions.", details: error.message },
            { status: 500 }
        );
    }
}
