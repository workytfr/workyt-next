import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Exercise, { DifficultyLevel } from "@/models/Exercise";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";
import { uploadFiles } from "@/lib/uploadFiles";
import { escapeRegex } from "@/utils/escapeRegex";

/**
 * GET - Récupérer les exercices avec pagination et filtres
 * Filtres : difficulty, sectionId, courseId, search, authorId
 * Pagination : page, limit
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const difficulty = searchParams.get("difficulty") as DifficultyLevel | null;
        const sectionId = searchParams.get("sectionId");
        const courseId = searchParams.get("courseId");
        const search = searchParams.get("search") || "";
        const authorId = searchParams.get("authorId") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        const filter: Record<string, any> = {};

        if (difficulty) filter.difficulty = difficulty;
        if (sectionId) filter.sectionId = sectionId;
        if (authorId) filter.author = authorId;
        if (search) {
            filter.title = { $regex: escapeRegex(search), $options: "i" };
        }

        // Si courseId est fourni, récupérer toutes les sections du cours puis filtrer
        if (courseId && !sectionId) {
            const sections = await Section.find({ courseId }).select("_id");
            const sectionIds = sections.map((s) => s._id);
            filter.sectionId = { $in: sectionIds };
        }

        const skip = (page - 1) * limit;

        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        const exercises = await Exercise.find(filter)
            .populate({
                path: "sectionId",
                select: "title courseId",
                populate: {
                    path: "courseId",
                    select: "title",
                },
            })
            .populate("author", "name")
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Exercise.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            exercises,
            total,
            page,
            totalPages,
        }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des exercices :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les exercices." },
            { status: 500 }
        );
    }
}

/**
 * POST - Créer un nouvel exercice (Réservé aux Helpeurs, Rédacteurs, Correcteurs, Admins)
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!user.role || typeof user.role !== 'string' || !["Helpeur", "Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
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
            { error: "Impossible de créer l'exercice." },
            { status: 500 }
        );
    }
}
