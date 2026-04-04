import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Exercise, { DifficultyLevel } from "@/models/Exercise";
import authMiddleware from "@/middlewares/authMiddleware";
import { uploadFiles } from "@/lib/uploadFiles";
import { hasPermission } from "@/lib/roles";

/**
 * 🚀 GET - Récupérer un exercice spécifique (Accès public)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const exercise = await Exercise.findById(id);
        if (!exercise) {
            return NextResponse.json({ error: "Exercice non trouvé." }, { status: 404 });
        }
        return NextResponse.json(exercise, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération de l'exercice :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer l'exercice." },
            { status: 500 }
        );
    }
}

/**
 * 🚀 PUT - Mettre à jour un exercice (Réservé aux Helpeurs, Rédacteurs, Correcteurs, Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!(await hasPermission(user.role, 'course.edit'))) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // Utiliser formData pour récupérer les données et les fichiers
        const formData = await req.formData();

        // Extraire les champs du formData dans un objet
        const body: any = {};
        for (const [key, value] of formData.entries()) {
            body[key] = value;
        }

        // Vérifier si la difficulté est valide
        if (body.difficulty) {
            const validDifficulties: DifficultyLevel[] = [
                'Facile 1', 'Facile 2', 'Moyen 1', 'Moyen 2', 'Difficile 1', 'Difficile 2', 'Élite'
            ];
            if (!validDifficulties.includes(body.difficulty)) {
                return NextResponse.json({ error: "Niveau de difficulté invalide." }, { status: 400 });
            }
        }

        // Gestion de l'upload des images si de nouveaux fichiers sont envoyés
        if (formData.get("image") instanceof File) {
            const imageFile = formData.get("image") as File;
            const uploadedImages = await uploadFiles([imageFile]);
            if (uploadedImages.length > 0) {
                body.image = uploadedImages[0];
            }
        }

        if (formData.get("correctionImage") instanceof File) {
            const correctionImageFile = formData.get("correctionImage") as File;
            const uploadedCorrectionImages = await uploadFiles([correctionImageFile]);
            if (uploadedCorrectionImages.length > 0) {
                // On met à jour la correction en ajoutant ou en modifiant la propriété image
                body.correction = {
                    text: body.correctionText || "",
                    image: uploadedCorrectionImages[0],
                };
                // On peut supprimer correctionText du body si nécessaire
                delete body.correctionText;
            }
        } else {
            // Si aucune image de correction n'est envoyée, on s'assure que le champ correction.text est mis à jour
            body.correction = {
                text: body.correctionText || "",
                image: body.correctionImage || null,
            };
            delete body.correctionText;
            delete body.correctionImage;
        }

        // Mettre à jour l'exercice dans la base de données
        const { id } = await params;
        const updatedExercise = await Exercise.findByIdAndUpdate(id, body, { new: true });
        if (!updatedExercise) {
            return NextResponse.json({ error: "Exercice non trouvé." }, { status: 404 });
        }

        return NextResponse.json(updatedExercise, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour de l'exercice :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour l'exercice." },
            { status: 500 }
        );
    }
}