import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Exercise, { DifficultyLevel } from "@/models/Exercise";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer un exercice spécifique (Accès public)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const exercise = await Exercise.findById(params.id);
        if (!exercise) {
            return NextResponse.json({ error: "Exercice non trouvé." }, { status: 404 });
        }
        return NextResponse.json(exercise, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération de l'exercice :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer l'exercice.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 PUT - Mettre à jour un exercice (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const body = await req.json();

        // Vérifier si la difficulté est valide si elle est mise à jour
        if (body.difficulty) {
            const validDifficulties: DifficultyLevel[] = [
                'Facile 1', 'Facile 2', 'Moyen 1', 'Moyen 2', 'Difficile 1', 'Difficile 2', 'Élite'
            ];
            if (!validDifficulties.includes(body.difficulty)) {
                return NextResponse.json({ error: "Niveau de difficulté invalide." }, { status: 400 });
            }
        }

        const updatedExercise = await Exercise.findByIdAndUpdate(params.id, body, { new: true });

        if (!updatedExercise) {
            return NextResponse.json({ error: "Exercice non trouvé." }, { status: 404 });
        }

        return NextResponse.json(updatedExercise, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour de l'exercice :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour l'exercice.", details: error.message },
            { status: 500 }
        );
    }
}
