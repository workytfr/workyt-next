import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer toutes les sections d'un cours
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json({ error: "courseId est requis." }, { status: 400 });
        }

        const sections = await Section.find({ courseId }).sort({ order: 1 });
        return NextResponse.json(sections, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des sections :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les sections.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 POST - Mettre à jour / Ajouter des sections
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const body = await req.json();
        const { courseId, sections } = body;

        if (!courseId || !sections || !Array.isArray(sections)) {
            return NextResponse.json({ error: "Données obligatoires manquantes." }, { status: 400 });
        }

        const existingSections = await Section.find({ courseId }) as { _id: string; title: string; order: number }[];

        // Vérification de l'existence des sections
        const sectionMap = new Map<string, { _id: string; title: string; order: number }>();
        existingSections.forEach((s) => {
            if (s && s._id) {
                sectionMap.set(s._id.toString(), s);
            }
        });

        const updatedSections = [];

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            if (section._id && sectionMap.has(section._id)) {
                // ✅ Mise à jour de la section existante sans changer l'ID
                const updatedSection = await Section.findByIdAndUpdate(
                    section._id,
                    { title: section.title, order: i + 1 },
                    { new: true }
                );
                updatedSections.push(updatedSection);
            } else {
                // ✅ Création d'une nouvelle section uniquement si elle n'existe pas
                const newSection = await Section.create({
                    courseId,
                    title: section.title,
                    order: i + 1,
                });
                updatedSections.push(newSection);
            }
        }

        // ✅ Suppression des anciennes sections qui ne sont plus utilisées
        const sectionIdsToKeep = updatedSections.map((s) => s?._id?.toString()).filter(Boolean) as string[];
        await Section.deleteMany({ courseId, _id: { $nin: sectionIdsToKeep } });

        return NextResponse.json(updatedSections, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour des sections :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour les sections.", details: error.message },
            { status: 500 }
        );
    }
}
