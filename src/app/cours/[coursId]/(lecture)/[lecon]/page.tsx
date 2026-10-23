import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { jsonLd as serializeJsonLd } from "@/lib/jsonLd";
import { findCourseByParam, getLesson } from "@/lib/courseReader";
import { renderLessonHtml } from "@/lib/lessonHtml";
import { LessonPage } from "@/app/cours/_components/reader/ReaderPages";
import { courseHref, lessonHref } from "@/app/cours/_components/courseLinks";
import { extractIdFromSlug } from "@/utils/slugify";

interface PageProps {
    params: Promise<{ coursId: string; lecon: string }>;
}

// Rendu à la première visite puis mis en cache (ISR), régénéré au plus toutes
// les 5 min ; une modification de la leçon revalide immédiatement (revalidateCoursePages).
export const revalidate = 300;
export function generateStaticParams() {
    return [];
}

/** Cours + leçon publiés ; `draft` quand seule la prévisualisation peut l'afficher */
async function load(params: PageProps["params"]) {
    const { coursId, lecon } = await params;
    const course = await findCourseByParam(coursId);
    const lessonId = extractIdFromSlug(lecon);
    if (!course || !lessonId) return null;

    const courseId = String(course._id);
    if (course.status !== "publie") return { course, courseId, lessonId, lesson: null, draft: true as const };

    const lesson = await getLesson(courseId, lessonId);
    if (!lesson) return null;
    if (lesson === "pending") return { course, courseId, lessonId, lesson: null, draft: true as const };
    return { course, courseId, lessonId, lesson, draft: false as const };
}

const plainText = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\$[^$]*\$/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = await load(params);
    if (!data) return { title: "Leçon introuvable" };
    if (!data.lesson) return { title: "Prévisualisation", robots: { index: false, follow: false } };

    const { course, lesson } = data;
    const url = `https://workyt.fr${lessonHref(course, lesson)}`;
    const text = plainText(lesson.content);
    const description = text ? `${text.slice(0, 155).trimEnd()}…` : `Leçon « ${lesson.title} » du cours ${course.title}.`;
    const image = course.image || "https://workyt.fr/workytcours.png";

    return {
        title: { absolute: `${lesson.title} - ${course.title} | Workyt` },
        description,
        alternates: { canonical: url },
        openGraph: {
            title: `${lesson.title} - ${course.title}`,
            description,
            url,
            siteName: "Workyt",
            type: "article",
            locale: "fr_FR",
            images: [{ url: image, width: 1200, height: 630, alt: course.title }],
        },
        twitter: { card: "summary_large_image", title: lesson.title, description, images: [image], creator: "@workyt_fr" },
    };
}

export default async function LessonRoute({ params }: PageProps) {
    const data = await load(params);
    if (!data) notFound();

    const { course, courseId, lessonId } = data;
    if (data.draft || !data.lesson) {
        return <LessonPage courseId={courseId} lessonId={lessonId} initial={null} />;
    }

    const { lesson } = data;
    const { coursId, lecon } = await params;
    const canonical = lessonHref(course, lesson);
    if (`/cours/${coursId}/${lecon}` !== canonical) redirect(canonical);

    const rendered = renderLessonHtml(lesson.content);
    const url = `https://workyt.fr${canonical}`;
    const schemas = [
        {
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: lesson.title,
            url,
            inLanguage: "fr",
            isAccessibleForFree: true,
            learningResourceType: "Leçon",
            educationalLevel: course.niveau,
            about: { "@type": "Thing", name: course.matiere },
            timeRequired: `PT${rendered.readingTime}M`,
            dateCreated: lesson.createdAt,
            dateModified: lesson.updatedAt,
            isPartOf: { "@type": "Course", name: course.title, url: `https://workyt.fr${courseHref(course)}` },
            provider: { "@type": "Organization", name: "Workyt", url: "https://workyt.fr" },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Cours", item: "https://workyt.fr/cours" },
                { "@type": "ListItem", position: 2, name: course.title, item: `https://workyt.fr${courseHref(course)}` },
                { "@type": "ListItem", position: 3, name: lesson.title, item: url },
            ],
        },
    ];

    return (
        <>
            {schemas.map((schema, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
            ))}
            <LessonPage
                courseId={courseId}
                lessonId={lessonId}
                initial={{
                    lesson: {
                        _id: lesson._id,
                        title: lesson.title,
                        audioUrl: lesson.audioUrl,
                        sectionId: lesson.sectionId,
                        sectionTitle: lesson.sectionTitle,
                    },
                    rendered,
                }}
            />
        </>
    );
}
