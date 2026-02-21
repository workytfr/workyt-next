import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 PUT - Réorganiser l'ordre des sections (Drag & Drop)
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

        const { sections } = await req.json();

        if (!sections || !Array.isArray(sections)) {
            return NextResponse.json({ error: "Format invalide." }, { status: 400 });
        }

        // Mise à jour de l'ordre de chaque section
        const updatePromises = sections.map((section, index) =>
            Section.findByIdAndUpdate(section._id, { order: index + 1 })
        );
        await Promise.all(updatePromises);

        return NextResponse.json({ message: "Sections réorganisées avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors du réarrangement des sections :", error.message);
        return NextResponse.json(
            { error: "Impossible de réorganiser les sections." },
            { status: 500 }
        );
    }
}
