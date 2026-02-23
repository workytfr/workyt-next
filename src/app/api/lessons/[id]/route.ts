import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 PUT - Mettre à jour une leçon (Réservé aux Rédacteurs pour leurs propres leçons, aux Correcteurs et Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        // 🔹 Await the params Promise
        const resolvedParams = await params;

        const body = await req.json();
        const existingLesson = await Lesson.findById(resolvedParams.id);

        if (!existingLesson) {
            return NextResponse.json({ error: "Leçon non trouvée." }, { status: 404 });
        }

        // Vérification des permissions
        if (user.role === "Rédacteur" && String(existingLesson.author) !== String(user._id)) {
            return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres leçons." }, { status: 403 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // Mise à jour de la leçon
        const updatedLesson = await Lesson.findByIdAndUpdate(resolvedParams.id, body, { new: true });

        return NextResponse.json(updatedLesson, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour de la leçon :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour la leçon." },
            { status: 500 }
        );
    }
}

/**
 * 🚀 DELETE - Supprimer une leçon (Réservé aux Admins uniquement)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        // 🔹 Await the params Promise
        const resolvedParams = await params;

        if (user.role !== "Admin") {
            return NextResponse.json({ error: "Seul un Admin peut supprimer une leçon." }, { status: 403 });
        }

        const deletedLesson = await Lesson.findByIdAndDelete(resolvedParams.id);
        if (!deletedLesson) {
            return NextResponse.json({ error: "Leçon non trouvée." }, { status: 404 });
        }

        return NextResponse.json({ message: "Leçon supprimée avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la suppression de la leçon :", error.message);
        return NextResponse.json(
            { error: "Impossible de supprimer la leçon." },
            { status: 500 }
        );
    }
}