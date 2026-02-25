import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * PUT - Réorganiser l'ordre des leçons (Drag & Drop)
 */
export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const { lessons } = await req.json();

        if (!lessons || !Array.isArray(lessons)) {
            return NextResponse.json({ error: "Format invalide." }, { status: 400 });
        }

        const updatePromises = lessons.map((lesson: any, index: number) =>
            Lesson.findByIdAndUpdate(lesson._id, { order: index + 1 })
        );
        await Promise.all(updatePromises);

        return NextResponse.json({ message: "Leçons réorganisées avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors du réarrangement des leçons :", error.message);
        return NextResponse.json(
            { error: "Impossible de réorganiser les leçons." },
            { status: 500 }
        );
    }
}
