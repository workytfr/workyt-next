import { notFound } from "next/navigation";
import CourseShell from "@/app/cours/_components/reader/CourseShell";
import { findCourseByParam, getCurriculum } from "@/lib/courseReader";
import "@/app/cours/_components/styles/notion-theme.css";

/**
 * Coque commune à l'accueil du cours, aux leçons, exercices et quiz : le
 * sommaire reste monté d'une page à l'autre (pas de rechargement du menu).
 */
export default async function CourseReadingLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ coursId: string }>;
}) {
    const { coursId } = await params;
    const course = await findCourseByParam(coursId);
    if (!course) notFound();

    const courseId = String(course._id);
    // Brouillon : sommaire chargé côté client avec les droits de l'auteur
    const curriculum = course.status === "publie" ? await getCurriculum(courseId) : null;

    return (
        <CourseShell courseId={courseId} initialCurriculum={curriculum}>
            {children}
        </CourseShell>
    );
}
