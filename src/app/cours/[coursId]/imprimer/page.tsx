import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCourseByParam, getPrintableCourse } from "@/lib/courseReader";
import { extractKeyBlocks, renderLessonHtml } from "@/lib/lessonHtml";
import { courseHref, lessonHref, quizzesHref } from "@/app/cours/_components/courseLinks";
import PrintToolbar from "./_components/PrintToolbar";
import PrintCover from "./_components/PrintCover";
import {
    AnswersPart,
    ChapterOpener,
    Essentials,
    ExercisesPart,
    HowToUse,
    Lexicon,
    QuizPart,
    RubricTitle,
    chapterColor,
    numberExercises,
    pad,
    qrSvg,
} from "./_components/Manual";
import "katex/dist/katex.min.css";
import "@/components/ui/code-block.css";
import "@/app/cours/_components/styles/notion-theme.css";
import "@/app/cours/_components/styles/lesson-blocks.css";
import "./_components/print.css";

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
        title: data ? `${data.curriculum.title} (manuel PDF) | Workyt` : "Cours introuvable",
        robots: { index: false, follow: true },
    };
}

/**
 * Le cours en manuel scolaire : couverture, sommaire, mode d'emploi, puis pour
 * chaque chapitre une page d'ouverture, le cours, « Je retiens l'essentiel »,
 * « Je teste mes connaissances » et les exercices par niveau ; corrigés et
 * lexique en fin d'ouvrage.
 */
export default async function PrintCoursePage({ params }: PageProps) {
    const data = await load(params);
    if (!data) notFound();
    const { curriculum, sections } = data;

    const chapters = await Promise.all(
        sections.map(async (s, i) => {
            const number = i + 1;
            const lessons = s.lessons.map((l, j) => {
                const rendered = renderLessonHtml(l.content, `l${l._id.slice(-6)}-`);
                return { ...l, ref: `${number}.${j + 1}`, html: rendered.html, blocks: extractKeyBlocks(rendered.html) };
            });
            const firstLesson = s.lessons[0];
            const onlineUrl = SITE + (firstLesson ? lessonHref(curriculum, firstLesson) : courseHref(curriculum));
            return {
                ...s,
                number,
                color: chapterColor(number),
                lessons,
                numbered: numberExercises(s.exercises),
                qrChapter: await qrSvg(onlineUrl),
                qrQuiz: s.questions.length > 0 ? await qrSvg(SITE + quizzesHref(curriculum, s)) : "",
            };
        })
    );

    const lessonCount = chapters.reduce((n, c) => n + c.lessons.length, 0);
    const exerciseCount = chapters.reduce((n, c) => n + c.numbered.length, 0);
    const questionCount = chapters.reduce((n, c) => n + c.questions.length, 0);
    const lexicon = chapters.flatMap((c) =>
        c.lessons.flatMap((l) =>
            l.blocks.filter((b) => b.type === "definition" && b.title).map((b) => ({ term: b.title, chapter: c.number, lesson: l.ref }))
        )
    );

    return (
        <div className="wk-print">
            <PrintToolbar backHref={courseHref(curriculum)} withAnswersToggle={exerciseCount > 0} />

            <PrintCover
                curriculum={curriculum}
                kind="cours"
                stickers={[
                    `${lessonCount} leçon${lessonCount > 1 ? "s" : ""}`,
                    exerciseCount > 0 ? `${exerciseCount} exercice${exerciseCount > 1 ? "s" : ""} corrigé${exerciseCount > 1 ? "s" : ""}` : `${chapters.length} chapitre${chapters.length > 1 ? "s" : ""}`,
                ]}
            />

            {/* Sommaire */}
            <section className="wk-sheet">
                <div className="wk-eyebrow">Sommaire</div>
                <h2>
                    Au programme<span className="wk-dot">.</span>
                </h2>
                <ol className="wk-toc">
                    {chapters.map((c) => (
                        <li key={c._id} style={{ ["--ch" as string]: c.color }}>
                            <span className="wk-n">{pad(c.number)}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <h3>{c.title}</h3>
                                {c.lessons.length > 0 && (
                                    <ul>
                                        {c.lessons.map((l) => (
                                            <li key={l._id}>
                                                <b>{l.ref}</b> {l.title}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="wk-toc-tags">
                                    {c.lessons.some((l) => l.blocks.length > 0) && <span>Je retiens l&apos;essentiel</span>}
                                    {c.questions.length > 0 && <span>{c.questions.length} questions</span>}
                                    {c.numbered.length > 0 && <span>{c.numbered.length} exercices</span>}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
                {exerciseCount > 0 && <p className="wk-toc-end">Corrigés des exercices{lexicon.length >= 3 ? " · Lexique" : ""} : en fin de manuel.</p>}
            </section>

            {/* Mode d'emploi */}
            <section className="wk-sheet">
                <HowToUse withExercises={exerciseCount > 0} withQuiz={questionCount > 0} />
            </section>

            {/* Chapitres */}
            {chapters.map((c) => {
                const blocks = c.lessons.flatMap((l) => l.blocks.map((b) => ({ ...b, lesson: l.ref })));
                return (
                    <section key={c._id} className="wk-sheet wk-chapter" style={{ ["--ch" as string]: c.color }}>
                        <ChapterOpener
                            number={c.number}
                            title={c.title}
                            lessons={c.lessons}
                            skills={c.skills}
                            exerciseCount={c.numbered.length}
                            questionCount={c.questions.length}
                            qr={c.qrChapter}
                        />

                        {c.lessons.length > 0 && (
                            <div className="wk-part wk-course">
                                <RubricTitle rubric="cours" extra={`Chapitre ${c.number}`} />
                                {c.lessons.map((lesson) => (
                                    <article key={lesson._id} className="wk-lesson">
                                        <div className="wk-lesson-head">
                                            <span className="wk-lesson-tag">Leçon {lesson.ref}</span>
                                            <h3>{lesson.title}</h3>
                                        </div>
                                        <div className="prose notion-lesson-content wk-lesson-body" dangerouslySetInnerHTML={{ __html: lesson.html }} />
                                    </article>
                                ))}
                            </div>
                        )}

                        <Essentials blocks={blocks} />
                        <QuizPart questions={c.questions} qr={c.qrQuiz} />
                        <ExercisesPart numbered={c.numbered} />
                    </section>
                );
            })}

            <AnswersPart chapters={chapters} />
            <Lexicon entries={lexicon} />
        </div>
    );
}
