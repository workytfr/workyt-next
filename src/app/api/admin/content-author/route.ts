import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Quiz from "@/models/Quiz";
import Evaluation from "@/models/Evaluation";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * Types de contenu dont l'auteur peut être réassigné par un admin.
 * - course      → champ `authors` (tableau) : réassigné à [authorId]
 * - lesson      → champ `author`
 * - exercise    → champ `author`
 * - quiz        → champ `author`
 * - evaluation  → champ `createdBy`
 */
type ContentType = "course" | "lesson" | "exercise" | "quiz" | "evaluation";

const CONTENT_CONFIG: Record<
    ContentType,
    { model: any; field: "authors" | "author" | "createdBy"; isArray: boolean }
> = {
    course: { model: Course, field: "authors", isArray: true },
    lesson: { model: Lesson, field: "author", isArray: false },
    exercise: { model: Exercise, field: "author", isArray: false },
    quiz: { model: Quiz, field: "author", isArray: false },
    evaluation: { model: Evaluation, field: "createdBy", isArray: false },
};

/**
 * 🚀 PATCH - Réassigner l'auteur d'un contenu (Réservé aux Admins)
 *
 * Body : { type: ContentType, id: string, authorId: string }
 */
export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();

        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (user.role !== "Admin") {
            return NextResponse.json(
                { error: "Accès refusé. Réservé aux administrateurs." },
                { status: 403 }
            );
        }

        const { type, id, authorId } = await req.json();

        if (!type || !id || !authorId) {
            return NextResponse.json(
                { error: "Paramètres manquants (type, id, authorId)." },
                { status: 400 }
            );
        }

        const config = CONTENT_CONFIG[type as ContentType];
        if (!config) {
            return NextResponse.json({ error: "Type de contenu invalide." }, { status: 400 });
        }

        // Vérifier que le nouvel auteur existe
        const newAuthor = await User.findById(authorId).select("_id name username role points");
        if (!newAuthor) {
            return NextResponse.json({ error: "Utilisateur (auteur) introuvable." }, { status: 404 });
        }

        // Construire la mise à jour selon le champ (tableau ou non)
        const update = config.isArray
            ? { [config.field]: [authorId] }
            : { [config.field]: authorId };

        const updated = await config.model.findByIdAndUpdate(
            id,
            { ...update, updatedAt: new Date() },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
        }

        return NextResponse.json(
            {
                message: "Auteur réassigné avec succès.",
                author: {
                    _id: String(newAuthor._id),
                    name: newAuthor.name,
                    username: newAuthor.username,
                    role: newAuthor.role,
                    points: newAuthor.points,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Erreur lors de la réassignation de l'auteur :", error.message);
        return NextResponse.json(
            { error: "Impossible de réassigner l'auteur." },
            { status: 500 }
        );
    }
}
