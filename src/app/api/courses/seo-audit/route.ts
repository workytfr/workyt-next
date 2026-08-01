import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";
import { hasPermission } from "@/lib/roles";
import { auditCourseSeo, countSeoErrors } from "@/lib/seoCourseChecks";

/**
 * 🚀 GET - Audit SEO de tous les cours (Réservé au staff)
 *
 * Retourne la liste des cours avec leur score SEO et leurs problèmes,
 * triés du plus urgent au plus propre.
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (!(await hasPermission(session.user.role, "dashboard.access"))) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 📌 Tous les cours (les non publiés aussi : l'audit sert justement à les améliorer)
        const courses = await Course.find({})
            .select("title slug description image matiere niveau status verifiedBy updatedAt")
            .lean();

        const courseIds = courses.map((c: any) => c._id);

        // 📌 Compter les sections et les leçons par cours
        const sections = await Section.find({ courseId: { $in: courseIds } })
            .select("courseId")
            .lean();
        const sectionIds = sections.map((s: any) => s._id);

        const lessons = await Lesson.find({ sectionId: { $in: sectionIds } })
            .select("sectionId")
            .lean();

        const sectionsCountByCourse = new Map<string, number>();
        const courseIdBySection = new Map<string, string>();
        for (const s of sections as any[]) {
            const cid = s.courseId.toString();
            sectionsCountByCourse.set(cid, (sectionsCountByCourse.get(cid) || 0) + 1);
            courseIdBySection.set(s._id.toString(), cid);
        }

        const lessonsCountByCourse = new Map<string, number>();
        for (const l of lessons as any[]) {
            const cid = courseIdBySection.get(l.sectionId.toString());
            if (cid) lessonsCountByCourse.set(cid, (lessonsCountByCourse.get(cid) || 0) + 1);
        }

        // 🏷️ Audit de chaque cours
        const results = courses.map((course: any) => {
            const audit = auditCourseSeo({
                title: course.title,
                description: course.description,
                image: course.image,
                matiere: course.matiere,
                niveau: course.niveau,
                status: course.status,
                verifiedBy: course.verifiedBy,
                sectionsCount: sectionsCountByCourse.get(course._id.toString()) || 0,
                lessonsCount: lessonsCountByCourse.get(course._id.toString()) || 0,
            });

            return {
                _id: course._id.toString(),
                title: course.title,
                matiere: course.matiere,
                niveau: course.niveau,
                status: course.status,
                updatedAt: course.updatedAt,
                score: audit.score,
                errorsCount: countSeoErrors(audit),
                warningsCount: audit.checks.filter((c) => c.status === "warning").length,
                issues: audit.checks
                    .filter((c) => c.status !== "ok")
                    .map((c) => ({ id: c.id, label: c.label, status: c.status, advice: c.advice })),
            };
        });

        // 📊 Tri : erreurs d'abord, puis score croissant (les plus urgents en haut)
        results.sort((a, b) => b.errorsCount - a.errorsCount || a.score - b.score);

        const published = results.filter((r) => r.status === "publie");
        const avgScore = results.length
            ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
            : 0;

        return NextResponse.json({
            courses: results,
            stats: {
                total: results.length,
                published: published.length,
                avgScore,
                withErrors: results.filter((r) => r.errorsCount > 0).length,
                avgScorePublished: published.length
                    ? Math.round(published.reduce((sum, r) => sum + r.score, 0) / published.length)
                    : 0,
            },
        });
    } catch (error: any) {
        console.error("Erreur audit SEO cours:", error.message);
        return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
    }
}
