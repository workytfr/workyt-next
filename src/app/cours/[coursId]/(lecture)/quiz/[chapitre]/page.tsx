import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { findCourseByParam, getSectionQuizzes } from "@/lib/courseReader";
import { QuizzesPage } from "@/app/cours/_components/reader/ReaderPages";
import { quizzesHref } from "@/app/cours/_components/courseLinks";
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
    if (course.status !== "publie") return { course, courseId, sectionId, quizzes: null };

    const quizzes = await getSectionQuizzes(courseId, sectionId);
    if (!quizzes || quizzes.quizzes.length === 0) return null;
    return { course, courseId, sectionId, quizzes };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = await load(params);
    if (!data) return { title: "Quiz introuvables" };
    if (!data.quizzes) return { title: "Prévisualisation", robots: { index: false, follow: false } };

    const { course, quizzes } = data;
    const url = `https://workyt.fr${quizzesHref(course, { _id: quizzes.sectionId, title: quizzes.sectionTitle })}`;
    const description = `${quizzes.quizzes.length} quiz pour réviser « ${quizzes.sectionTitle} » (${course.matiere}, ${course.niveau}).`;
    return {
        title: { absolute: `Quiz : ${quizzes.sectionTitle} - ${course.title} | Workyt` },
        description,
        alternates: { canonical: url },
        openGraph: { title: `Quiz : ${quizzes.sectionTitle}`, description, url, siteName: "Workyt", type: "article", locale: "fr_FR" },
    };
}

export default async function QuizzesRoute({ params }: PageProps) {
    const data = await load(params);
    if (!data) notFound();

    const { course, courseId, sectionId, quizzes } = data;
    if (quizzes) {
        const { coursId, chapitre } = await params;
        const canonical = quizzesHref(course, { _id: quizzes.sectionId, title: quizzes.sectionTitle });
        if (`/cours/${coursId}/quiz/${chapitre}` !== canonical) redirect(canonical);
    }

    return <QuizzesPage courseId={courseId} sectionId={sectionId} initial={quizzes ? { quizzes } : null} />;
}
