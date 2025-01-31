import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import User from "@/models/User";

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

        // Construction du filtre
        let filter: any = {};
        if (subject) filter.subject = subject;
        if (classLevel) filter.classLevel = classLevel;
        if (status) filter.status = status;
        if (title) filter.title = { $regex: title, $options: "i" }; // Recherche insensible à la casse

        // Récupération des questions avec pagination et tri
        const questions = await Question.find(filter)
            .populate({
                path: "user",
                select: "username points", // Correction : Utilisation de "username" au lieu de "name"
            })
            .sort({ createdAt: -1 }) // Trier par date décroissante
            .skip(skip)
            .limit(limit);

        // Nombre total de questions correspondant au filtre
        const totalQuestions = await Question.countDocuments(filter);

        return NextResponse.json({
            success: true,
            data: questions,
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
