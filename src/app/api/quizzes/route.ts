import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer tous les quizz (Accès public)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const quizzes = await Quiz.find();
        return NextResponse.json(quizzes, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des quizz :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les quizz.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 POST - Créer un nouveau quizz (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!["Rédacteur", "Correcteur", "Admin", "Helpeur"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, questions } = body;

        if (!title || !questions || questions.length === 0) {
            return NextResponse.json({ error: "Données obligatoires manquantes." }, { status: 400 });
        }

        const newQuiz = await Quiz.create({
            title,
            description,
            questions,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json(newQuiz, { status: 201 });
    } catch (error: any) {
        console.error("Erreur lors de la création du quizz :", error.message);
        return NextResponse.json(
            { error: "Impossible de créer le quizz.", details: error.message },
            { status: 500 }
        );
    }
}
