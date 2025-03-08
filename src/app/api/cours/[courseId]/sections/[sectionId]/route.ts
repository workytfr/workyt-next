import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";

export async function GET(
    req: NextRequest,
    { params }: { params: { courseId: string; sectionId: string } }
) {
    try {
        await dbConnect();

        let user = null;
        try {
            user = await authMiddleware(req);
        } catch (err) {
            user = null;
        }

        const { courseId, sectionId } = params;

        // On récupère la section demandée, en vérifiant qu'elle appartient bien au cours
        const section = await Section.findOne({ _id: sectionId, courseId })
            .populate({ path: "lessons", options: { sort: { order: 1 } } })
            .populate({ path: "exercises", options: { sort: { order: 1 } } })
            .populate({ path: "quizzes", options: { sort: { order: 1 } } })
            .lean();

        if (!section) {
            return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
        }

        // Vous pouvez aussi vérifier que le cours parent est publié, etc.

        return NextResponse.json({ section }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération de la section :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer la section.", details: error.message },
            { status: 500 }
        );
    }
}
