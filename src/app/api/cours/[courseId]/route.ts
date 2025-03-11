import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import authMiddleware from "@/middlewares/authMiddleware";
import { isValidObjectId } from "mongoose";

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

        // Vérifier que l'ID est un ObjectId valide
        if (!isValidObjectId(courseId)) {
            return NextResponse.json(
                { error: "ID de cours invalide" },
                { status: 400 }
            );
        }

        // Récupération du cours et de ses sections (id + titre)
        const cours = await Course.findById(courseId)
            .populate({
                path: "sections",
                select: "title order", // On récupère uniquement le titre et l'ordre
                options: { sort: { order: 1 } },
            })
            .lean();

        if (!cours) {
            return NextResponse.json({ error: "Cours non trouvé" }, { status: 404 });
        }

        // Pour les utilisateurs publics, n'afficher que les cours publiés.
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
