import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 PUT - Mettre à jour une section (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const body = await req.json();
        const existingSection = await Section.findById(params.id);

        if (!existingSection) {
            return NextResponse.json({ error: "Section non trouvée." }, { status: 404 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const updatedSection = await Section.findByIdAndUpdate(params.id, body, { new: true });

        return NextResponse.json(updatedSection, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour de la section :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour la section.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 DELETE - Supprimer une section (Réservé aux Admins uniquement)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (user.role !== "Admin") {
            return NextResponse.json({ error: "Seul un Admin peut supprimer une section." }, { status: 403 });
        }

        const deletedSection = await Section.findByIdAndDelete(params.id);
        if (!deletedSection) {
            return NextResponse.json({ error: "Section non trouvée." }, { status: 404 });
        }

        // Réorganiser l'ordre des sections après suppression
        await Section.updateMany(
            { courseId: deletedSection.courseId, order: { $gt: deletedSection.order } },
            { $inc: { order: -1 } }
        );

        return NextResponse.json({ message: "Section supprimée avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la suppression de la section :", error.message);
        return NextResponse.json(
            { error: "Impossible de supprimer la section.", details: error.message },
            { status: 500 }
        );
    }
}
