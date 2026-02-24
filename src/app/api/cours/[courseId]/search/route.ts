import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";
import Course from "@/models/Course";
import { isValidObjectId } from "mongoose";

// GET /api/cours/[courseId]/search?q=keyword
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
    try {
        await dbConnect();

        const { courseId } = await params;
        if (!isValidObjectId(courseId)) {
            return NextResponse.json({ error: "ID de cours invalide" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        // Verifier que le cours existe
        const course = await Course.findById(courseId).select("_id").lean();
        if (!course) {
            return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
        }

        // Trouver les sections du cours
        const sections = await Section.find({ courseId }).select("_id title").lean();
        const sectionIds = sections.map(s => s._id);
        const sectionMap = new Map(sections.map(s => [String(s._id), s.title]));

        // Chercher dans les lecons (titre et contenu)
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const lessons = await Lesson.find({
            sectionId: { $in: sectionIds },
            $or: [
                { title: { $regex: escapedQuery, $options: 'i' } },
                { content: { $regex: escapedQuery, $options: 'i' } },
            ],
        })
            .select("title sectionId content")
            .limit(20)
            .lean();

        // Construire les resultats avec snippets
        const results = lessons.map((lesson: any) => {
            const sectionTitle = sectionMap.get(String(lesson.sectionId)) || "Section inconnue";

            // Extraire un snippet du contenu
            let snippet = "";
            if (lesson.content) {
                const plainText = lesson.content.replace(/<[^>]*>/g, '');
                const lowerText = plainText.toLowerCase();
                const lowerQuery = query.toLowerCase();
                const idx = lowerText.indexOf(lowerQuery);

                if (idx >= 0) {
                    const start = Math.max(0, idx - 50);
                    const end = Math.min(plainText.length, idx + query.length + 50);
                    snippet = (start > 0 ? "..." : "") + plainText.slice(start, end) + (end < plainText.length ? "..." : "");
                } else {
                    snippet = plainText.slice(0, 100) + (plainText.length > 100 ? "..." : "");
                }
            }

            return {
                lessonId: String(lesson._id),
                lessonTitle: lesson.title,
                sectionId: String(lesson.sectionId),
                sectionTitle,
                snippet,
            };
        });

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Erreur search:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
