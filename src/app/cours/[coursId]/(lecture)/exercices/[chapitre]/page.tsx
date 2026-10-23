import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { findCourseByParam, getSectionExercises } from "@/lib/courseReader";
import { ExercisesPage } from "@/app/cours/_components/reader/ReaderPages";
import { exercisesHref } from "@/app/cours/_components/courseLinks";
import { extractIdFromSlug } from "@/utils/slugify";

interface PageProps {
    params: Promise<{ coursId: string; chapitre: string }>;
}

export const revalidate = 300;
export function generateStaticParams() {
    return [];
}

async function load(params: PageProps["params"]) {
    const { coursId, chapitre } = await params;
    const course = await findCourseByParam(coursId);
    const sectionId = extractIdFromSlug(chapitre);
    if (!course || !sectionId) return null;

    const courseId = String(course._id);
    if (course.status !== "publie") return { course, courseId, sectionId, exercises: null };

    const exercises = await getSectionExercises(courseId, sectionId);
    if (!exercises || exercises.exercises.length === 0) return null;
    return { course, courseId, sectionId, exercises };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = await load(params);
    if (!data) return { title: "Exercices introuvables" };
    if (!data.exercises) return { title: "Prévisualisation", robots: { index: false, follow: false } };

    const { course, exercises } = data;
    const url = `https://workyt.fr${exercisesHref(course, { _id: exercises.sectionId, title: exercises.sectionTitle })}`;
    const description = `${exercises.exercises.length} exercices corrigés sur « ${exercises.sectionTitle} » (${course.matiere}, ${course.niveau}).`;
    return {
        title: { absolute: `Exercices : ${exercises.sectionTitle} - ${course.title} | Workyt` },
        description,
        alternates: { canonical: url },
        openGraph: { title: `Exercices : ${exercises.sectionTitle}`, description, url, siteName: "Workyt", type: "article", locale: "fr_FR" },
    };
}

export default async function ExercisesRoute({ params }: PageProps) {
    const data = await load(params);
    if (!data) notFound();

    const { course, courseId, sectionId, exercises } = data;
    if (exercises) {
        const { coursId, chapitre } = await params;
        const canonical = exercisesHref(course, { _id: exercises.sectionId, title: exercises.sectionTitle });
        if (`/cours/${coursId}/exercices/${chapitre}` !== canonical) redirect(canonical);
    }

    return <ExercisesPage courseId={courseId} sectionId={sectionId} initial={exercises ? { exercises } : null} />;
}
