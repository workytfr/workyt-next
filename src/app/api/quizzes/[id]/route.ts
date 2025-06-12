import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer un quizz spécifique (Accès public)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        // 🔹 Await the params Promise
        const resolvedParams = await params;

        const quiz = await Quiz.findById(resolvedParams.id);
        if (!quiz) {
            return NextResponse.json({ error: "Quizz non trouvé." }, { status: 404 });
        }
        return NextResponse.json(quiz, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération du quizz :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer le quizz.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 PUT - Mettre à jour un quizz (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!["Rédacteur", "Correcteur", "Admin", "Helpeur"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 🔹 Await the params Promise
        const resolvedParams = await params;

        const body = await req.json();
        const updatedQuiz = await Quiz.findByIdAndUpdate(resolvedParams.id, body, { new: true });

        if (!updatedQuiz) {
            return NextResponse.json({ error: "Quizz non trouvé." }, { status: 404 });
        }

        return NextResponse.json(updatedQuiz, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du quizz :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour le quizz.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 DELETE - Supprimer un quizz (Réservé aux Admins)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (user.role !== "Admin") {
            return NextResponse.json({ error: "Seul un Admin peut supprimer un quizz." }, { status: 403 });
        }

        // 🔹 Await the params Promise
        const resolvedParams = await params;

        const deletedQuiz = await Quiz.findByIdAndDelete(resolvedParams.id);
        if (!deletedQuiz) {
            return NextResponse.json({ error: "Quizz non trouvé." }, { status: 404 });
        }

        return NextResponse.json({ message: "Quizz supprimé avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la suppression du quizz :", error.message);
        return NextResponse.json(
            { error: "Impossible de supprimer le quizz.", details: error.message },
            { status: 500 }
        );
    }
}