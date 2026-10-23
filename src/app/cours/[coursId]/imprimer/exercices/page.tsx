import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCourseByParam, getPrintableCourse } from "@/lib/courseReader";
import { extractKeyBlocks, renderLessonHtml } from "@/lib/lessonHtml";
import { courseHref, exercisesHref, quizzesHref } from "@/app/cours/_components/courseLinks";
import PrintToolbar from "../_components/PrintToolbar";
import PrintCover from "../_components/PrintCover";
import { AnswersPart, ChapterBanner, Essentials, ExercisesPart, HowToUse, QuizPart, chapterColor, numberExercises, qrSvg } from "../_components/Manual";
import "katex/dist/katex.min.css";
import "@/app/cours/_components/styles/notion-theme.css";
import "@/app/cours/_components/styles/lesson-blocks.css";
import "../_components/print.css";

interface PageProps {
    params: Promise<{ coursId: string }>;
}

export const revalidate = 300;
export function generateStaticParams() {
    return [];
}

const SITE = "https://workyt.fr";

async function load(params: PageProps["params"]) {
    const { coursId } = await params;
    const course = await findCourseByParam(coursId);
    if (!course || course.status !== "publie") return null;
    return getPrintableCourse(String(course._id));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = await load(params);
    return {
        title: data ? `Cahier d'exercices : ${data.curriculum.title} (PDF) | Workyt` : "Cours introuvable",
        robots: { index: false, follow: true },
    };
}

/**
 * Cahier d'exercices : pour chaque chapitre un rappel « Je retiens
 * l'essentiel », les questions pour se tester, puis les exercices par niveau ;
 * tous les corrigés en fin de cahier.
 */
export default async function PrintExercisesPage({ params }: PageProps) {
    const data = await load(params);
    if (!data) notFound();
    const { curriculum, sections } = data;

    const chapters = (
        await Promise.all(
            sections.map(async (s, i) => {
                const number = i + 1;
                const blocks = s.lessons.flatMap((l, j) =>
                    extractKeyBlocks(renderLessonHtml(l.content, `l${l._id.slice(-6)}-`).html).map((b) => ({ ...b, lesson: `${number}.${j + 1}` }))
                );
                return {
                    ...s,
                    number,
                    color: chapterColor(number),
                    blocks,
                    numbered: numberExercises(s.exercises),
                    qrChapter: await qrSvg(SITE + exercisesHref(curriculum, s)),
                    qrQuiz: s.questions.length > 0 ? await qrSvg(SITE + quizzesHref(curriculum, s)) : "",
                };
            })
        )
    ).filter((c) => c.numbered.length > 0 || c.questions.length > 0);
    if (chapters.length === 0) notFound();

    const total = chapters.reduce((n, c) => n + c.numbered.length, 0);
    const questionCount = chapters.reduce((n, c) => n + c.questions.length, 0);

    return (
        <div className="wk-print">
            <PrintToolbar backHref={courseHref(curriculum)} withAnswersToggle={total > 0} />

            <PrintCover
                curriculum={curriculum}
                kind="exercices"
                stickers={[`${total} exercice${total > 1 ? "s" : ""}`, `${chapters.length} chapitre${chapters.length > 1 ? "s" : ""}`]}
            />

            <section className="wk-sheet">
                <HowToUse withExercises={total > 0} withQuiz={questionCount > 0} />
            </section>

            {chapters.map((c) => (
                <section key={c._id} className="wk-sheet wk-chapter" style={{ ["--ch" as string]: c.color }}>
                    <ChapterBanner number={c.number} title={c.title} qr={c.qrChapter} />
                    <Essentials blocks={c.blocks} />
                    <QuizPart questions={c.questions} qr={c.qrQuiz} />
                    <ExercisesPart numbered={c.numbered} />
                </section>
            ))}

            <AnswersPart chapters={chapters} />
        </div>
    );
}
