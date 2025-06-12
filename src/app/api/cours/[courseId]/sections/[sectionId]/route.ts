import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";
import { isValidObjectId } from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string; sectionId: string }> }
) {
    try {
        await dbConnect();

        // Tentative d'authentification optionnelle
        let user = null;
        try {
            user = await authMiddleware(req);
        } catch (err) {
            user = null;
        }

        const { courseId, sectionId } = await params;

        // Validation des IDs
        if (!isValidObjectId(courseId) || !isValidObjectId(sectionId)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        // Vérifier que le cours parent existe
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return NextResponse.json({ error: "Cours non trouvé" }, { status: 404 });
        }

        // Si l'utilisateur n'est pas authentifié (ou n'est pas staff),
        // n'autoriser l'accès qu'aux cours publiés.
        if (
            (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) &&
            course.status !== "publie"
        ) {
            return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
        }

        // Récupération de la section en s'assurant qu'elle appartient bien au cours
        const section = await Section.findOne({ _id: sectionId, courseId })
            .populate({ path: "lessons", options: { sort: { order: 1 } } })
            .populate({ path: "exercises", options: { sort: { order: 1 } } })
            .populate({ path: "quizzes", options: { sort: { order: 1 } } })
            .lean();

        if (!section) {
            return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
        }

        return NextResponse.json({ section }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération de la section :", error.message);

        // Don't expose internal error details in production
        const isDevelopment = process.env.NODE_ENV === "development";

        return NextResponse.json(
            {
                error: "Impossible de récupérer la section.",
                ...(isDevelopment && { details: error.message }),
            },
            { status: 500 }
        );
    }
}