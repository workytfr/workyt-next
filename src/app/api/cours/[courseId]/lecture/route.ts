import { NextRequest, NextResponse } from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";
import {
    canPreviewCourse,
    getCurriculum,
    getLesson,
    getSectionExercises,
    getSectionQuizzes,
} from "@/lib/courseReader";
import { renderLessonHtml } from "@/lib/lessonHtml";

export const dynamic = "force-dynamic";

/**
 * GET /api/cours/[courseId]/lecture
 *   (sans paramètre)       → { curriculum }
 *   ?lesson=<id>           → { lesson, rendered }
 *   ?exercices=<sectionId> → { exercises }
 *   ?quiz=<sectionId>      → { quizzes }
 *
 * Mêmes données que les pages /cours/** rendues côté serveur. Sert à la
 * prévisualisation des brouillons (cours non publié, leçon non validée) par
 * leurs auteurs et la team ; le public n'obtient que le contenu publié.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const { courseId } = await params;
        const { searchParams } = new URL(req.url);

        let user = null;
        try {
            user = await authMiddleware(req);
        } catch {
            user = null;
        }
        const preview = await canPreviewCourse(user, courseId);

        // Le cours doit être visible pour ce lecteur avant tout le reste
        const curriculum = await getCurriculum(courseId, preview);
        if (!curriculum) {
            return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
        }

        const lessonId = searchParams.get("lesson");
        if (lessonId) {
            const lesson = await getLesson(courseId, lessonId, preview);
            if (!lesson || lesson === "pending") {
                return NextResponse.json({ error: "Leçon introuvable" }, { status: 404 });
            }
            return NextResponse.json({ lesson, rendered: renderLessonHtml(lesson.content) });
        }

        const exercisesOf = searchParams.get("exercices");
        if (exercisesOf) {
            const exercises = await getSectionExercises(courseId, exercisesOf);
            if (!exercises) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });
            return NextResponse.json({ exercises });
        }

        const quizzesOf = searchParams.get("quiz");
        if (quizzesOf) {
            const quizzes = await getSectionQuizzes(courseId, quizzesOf);
            if (!quizzes) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });
            return NextResponse.json({ quizzes });
        }

        return NextResponse.json({ curriculum });
    } catch (error) {
        console.error("Erreur lecture du cours :", error);
        return NextResponse.json({ error: "Impossible de charger le cours." }, { status: 500 });
    }
}
