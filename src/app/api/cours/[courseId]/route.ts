import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
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

        // On récupère le cours et juste la liste des sections (id + titre)
        const cours = await Course.findById(courseId)
            .populate({
                path: "sections",
                select: "title order", // On ne récupère que le titre et l'ordre
                options: { sort: { order: 1 } },
            })
            .lean();

        if (!cours) {
            return NextResponse.json({ error: "Cours non trouvé" }, { status: 404 });
        }

        // Vérification du statut du cours
        if (
            (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) &&
            cours.status !== "publie"
        ) {
            return NextResponse.json({ error: "Cours non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ cours }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer le cours.", details: error.message },
            { status: 500 }
        );
    }
}
