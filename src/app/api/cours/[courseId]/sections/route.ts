import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";

export async function GET(
    req: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        await dbConnect();

        let user = null;
        try {
            user = await authMiddleware(req);
        } catch (err) {
            user = null;
        }

        const { courseId } = params;

        // Récupérer toutes les sections du cours
        const sections = await Section.find({ courseId })
            .sort({ order: 1 })
            .populate({ path: "lessons", options: { sort: { order: 1 } } })
            .populate({ path: "exercises", options: { sort: { order: 1 } } })
            .populate({ path: "quizzes", options: { sort: { order: 1 } } })
            .lean();

        // Ici, vous pouvez également vérifier si le cours est publié
        // (par ex. en allant chercher le statut dans Course.findById(courseId))
        // et vérifier si l'user a les droits d'accès.

        return NextResponse.json({ sections }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des sections :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les sections.", details: error.message },
            { status: 500 }
        );
    }
}
