import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CourseProgress from "@/models/CourseProgress";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";
import { isValidObjectId } from "mongoose";

// GET - Retourne la progression de l'utilisateur pour un cours
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
    try {
        await dbConnect();

        let user = null;
        try {
            user = await authMiddleware(req);
        } catch {
            // Utilisateur non connecte
            return NextResponse.json({ progress: null });
        }

        const { courseId } = await params;
        if (!isValidObjectId(courseId)) {
            return NextResponse.json({ error: "ID de cours invalide" }, { status: 400 });
        }

        const progress = await CourseProgress.findOne({
            userId: user._id,
            courseId,
        }).lean();

        if (!progress) {
            return NextResponse.json({ progress: null });
        }

        // Compter le total de lecons dans le cours
        const sections = await Section.find({ courseId })
            .populate({ path: "lessons", select: "_id" })
            .lean({ virtuals: true });

        let totalLessons = 0;
        sections.forEach((s: any) => {
            totalLessons += (s.lessons?.length || 0);
        });

        const lessonsReadCount = progress.lessonsRead?.length || 0;
        const percentage = totalLessons > 0 ? Math.round((lessonsReadCount / totalLessons) * 100) : 0;

        return NextResponse.json({
            progress: {
                lessonsRead: progress.lessonsRead?.map(String) || [],
                totalLessons,
                percentage,
                sectionsCompleted: progress.sectionsCompleted?.map(String) || [],
                totalSections: sections.length,
                lastLessonId: progress.lastLessonId ? String(progress.lastLessonId) : null,
                lastSectionId: progress.lastSectionId ? String(progress.lastSectionId) : null,
            }
        });
    } catch (error) {
        console.error("Erreur progress GET:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// POST - Marque une lecon comme lue
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
    try {
        await dbConnect();

        let user;
        try {
            user = await authMiddleware(req);
        } catch {
            return NextResponse.json({ error: "Non autorise" }, { status: 401 });
        }

        const { courseId } = await params;
        if (!isValidObjectId(courseId)) {
            return NextResponse.json({ error: "ID de cours invalide" }, { status: 400 });
        }

        const body = await req.json();
        const { lessonId, sectionId } = body;

        if (!lessonId || !isValidObjectId(lessonId)) {
            return NextResponse.json({ error: "lessonId invalide" }, { status: 400 });
        }

        // Upsert la progression
        let progress = await CourseProgress.findOneAndUpdate(
            { userId: user._id, courseId },
            {
                $addToSet: { lessonsRead: lessonId },
                $set: {
                    lastLessonId: lessonId,
                    lastSectionId: sectionId || undefined,
                    lastAccessedAt: new Date(),
                },
                $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true, new: true }
        );

        // Verifier si la section est completee
        if (sectionId && isValidObjectId(sectionId)) {
            const section = await Section.findById(sectionId)
                .populate({ path: "lessons", select: "_id" })
                .lean({ virtuals: true });

            if (section) {
                const sectionLessonIds = ((section as any).lessons || []).map((l: any) => String(l._id));
                const readIds = new Set(progress.lessonsRead.map(String));
                const allRead = sectionLessonIds.every((id: string) => readIds.has(id));

                if (allRead) {
                    await CourseProgress.updateOne(
                        { _id: progress._id },
                        { $addToSet: { sectionsCompleted: sectionId } }
                    );
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur progress POST:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
