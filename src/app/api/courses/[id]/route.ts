import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer un cours spécifique (Accès public)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const course = await Course.findById(params.id);
        if (!course) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }
        return NextResponse.json(course, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer le cours.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 PUT - Mettre à jour un cours (Réservé aux Auteurs, Correcteurs, Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const body = await req.json();
        const existingCourse = await Course.findById(params.id);

        if (!existingCourse) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }

        // Vérification des permissions : auteur du cours, correcteur ou admin
        if (user.role === "Rédacteur" && !existingCourse.authors.includes(user._id)) {
            return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres cours." }, { status: 403 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const updatedCourse = await Course.findByIdAndUpdate(params.id, body, { new: true });

        return NextResponse.json(updatedCourse, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour le cours.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 DELETE - Supprimer un cours (Réservé aux Admins uniquement)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (user.role !== "Admin") {
            return NextResponse.json({ error: "Seul un Admin peut supprimer un cours." }, { status: 403 });
        }

        const deletedCourse = await Course.findByIdAndDelete(params.id);
        if (!deletedCourse) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }

        return NextResponse.json({ message: "Cours supprimé avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la suppression du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de supprimer le cours.", details: error.message },
            { status: 500 }
        );
    }
}
