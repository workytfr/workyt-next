import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Exercise, { DifficultyLevel } from "@/models/Exercise";
import authMiddleware from "@/middlewares/authMiddleware";
import { uploadFiles } from "@/lib/uploadFiles";

/**
 * 🚀 GET - Récupérer tous les exercices (Accès public)
 * ➜ Possibilité de filtrer par `difficulty`
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Récupérer le paramètre `difficulty` de l'URL
        const { searchParams } = new URL(req.url);
        const difficulty = searchParams.get("difficulty") as DifficultyLevel | null;

        // Filtrer par difficulté si un niveau est spécifié
        const filter = difficulty ? { difficulty } : {};
        const exercises = await Exercise.find(filter);

        return NextResponse.json(exercises, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des exercices :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les exercices.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 POST - Créer un nouvel exercice (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // ✅ Gestion de `FormData`
        const formData = await req.formData();
        const sectionId = formData.get("sectionId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const difficulty = formData.get("difficulty") as DifficultyLevel;

        const correctionText = formData.get("correctionText") as string;
        const correctionImageFile = formData.get("correctionImage") as File | null;
        const imageFile = formData.get("image") as File | null;

        if (!sectionId || !title || !content || !difficulty) {
            return NextResponse.json({ error: "Données obligatoires manquantes." }, { status: 400 });
        }

        // ✅ Vérification difficulté
        const validDifficulties: DifficultyLevel[] = [
            'Facile 1', 'Facile 2', 'Moyen 1', 'Moyen 2', 'Difficile 1', 'Difficile 2', 'Élite'
        ];
        if (!validDifficulties.includes(difficulty)) {
            return NextResponse.json({ error: "Niveau de difficulté invalide." }, { status: 400 });
        }

        // ✅ Upload de l'image principale
        let imageUrl = "";
        if (imageFile) {
            const uploadedImages = await uploadFiles([imageFile]);
            if (uploadedImages.length > 0) {
                imageUrl = uploadedImages[0];
            }
        }

        // ✅ Upload de l'image de correction
        let correctionImageUrl = "";
        if (correctionImageFile) {
            const uploadedCorrectionImages = await uploadFiles([correctionImageFile]);
            if (uploadedCorrectionImages.length > 0) {
                correctionImageUrl = uploadedCorrectionImages[0];
            }
        }

        // ✅ Création de l'exercice
        const newExercise = await Exercise.create({
            sectionId,
            author: user._id,
            title,
            content,
            image: imageUrl || null,
            correction: {
                text: correctionText || "",
                image: correctionImageUrl || null,
            },
            difficulty,
            createdAt: new Date(),
        });

        return NextResponse.json(newExercise, { status: 201 });
    } catch (error: any) {
        console.error("Erreur lors de la création de l'exercice :", error.message);
        return NextResponse.json(
            { error: "Impossible de créer l'exercice.", details: error.message },
            { status: 500 }
        );
    }
}