"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCodeBlockCopy } from "@/components/ui/CodeBlock";
import LessonTableOfContents from "../LessonTableOfContents";
import AudioPlayer from "./AudioPlayer";
import SelectionBubble from "./SelectionBubble";
import { useCourse } from "./CourseShell";
import { useLessonQuestions, LESSON_QUESTIONS_LIMIT, type LessonQuestion } from "./useLessonQuestions";
import { locateAnchor, unwrapAll, wrapRange, type PassageAnchor } from "./passageAnchor";
import type { RenderedLesson } from "@/lib/lessonHtml";
import "katex/dist/katex.min.css";
import "@/components/ui/code-block.css";
import "../styles/lesson-blocks.css";

// Chargés à la première interaction : la lecture seule n'en a pas besoin
const QuestionsPanel = dynamic(() => import("./QuestionsPanel"), { ssr: false });
const AskQuestionModal = dynamic(() => import("./AskQuestionModal"), { ssr: false });

export interface ReaderLesson {
    _id: string;
    title: string;
    audioUrl?: string | null;
    sectionId: string;
    sectionTitle: string;
}

/** Délai avant de compter la leçon comme lue */
const READ_DELAY_MS = 5000;

export default function LessonReader({ lesson, rendered }: { lesson: ReaderLesson; rendered: RenderedLesson }) {
    const { curriculum, readLessons, markLessonRead } = useCourse();
    const contentRef = useRef<HTMLDivElement>(null);
    useCodeBlockCopy(contentRef);

    const { questions, total, add } = useLessonQuestions(lesson._id);
    const [panelOpen, setPanelOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [orphans, setOrphans] = useState<Set<string>>(new Set());
    const [ask, setAsk] = useState<{ anchor: PassageAnchor | null } | null>(null);
    // Panneau et fenêtre ne sont chargés qu'une fois sollicités
    const [panelUsed, setPanelUsed] = useState(false);

    const chapterIndex = curriculum.sections.findIndex((s) => s._id === lesson.sectionId);

    // Leçon lue après quelques secondes passées dessus
    useEffect(() => {
        if (readLessons.has(lesson._id)) return;
        const t = setTimeout(() => markLessonRead(lesson._id, lesson.sectionId), READ_DELAY_MS);
        return () => clearTimeout(t);
    }, [lesson._id, lesson.sectionId, readLessons, markLessonRead]);

    // Lien direct vers une question (#question-<id>, depuis le forum)
    useEffect(() => {
        const match = window.location.hash.match(/^#question-([a-f0-9]{24})$/);
        if (!match) return;
        // Après l'hydratation, pour que les surlignages s'appliquent au contenu rendu
        const frame = requestAnimationFrame(() => {
            setActiveId(match[1]);
            setPanelOpen(true);
            setPanelUsed(true);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    // Surlignage des passages commentés, seulement quand le panneau est ouvert
    useEffect(() => {
        const root = contentRef.current;
        if (!root || !panelOpen) return;

        const missing = new Set<string>();
        const spans = new Map<string, { start: number; end: number; ids: string[] }>();
        for (const q of questions) {
            if (!q.anchor?.exact) continue;
            const pos = locateAnchor(root, q.anchor);
            if (!pos) {
                missing.add(q._id);
                continue;
            }
            const key = `${pos[0]}:${pos[1]}`;
            const span = spans.get(key);
            if (span) span.ids.push(q._id);
            else spans.set(key, { start: pos[0], end: pos[1], ids: [q._id] });
        }
        setOrphans(missing);

        let n = 0;
        for (const span of spans.values()) {
            const hl = `hl${n++}`;
            wrapRange(root, span.start, span.end, { "data-qid": span.ids[0], "data-hl": hl });
            const marks = root.querySelectorAll(`mark[data-hl="${hl}"]`);
            marks[marks.length - 1]?.setAttribute("data-count", String(span.ids.length));
        }

        return () => unwrapAll(root);
    }, [panelOpen, questions]);

    // Passage de la question ouverte : mis en avant et ramené à l'écran
    useEffect(() => {
        const root = contentRef.current;
        if (!root || !panelOpen) return;
        root.querySelectorAll("mark.wk-qmark").forEach((m) => m.classList.toggle("is-active", m.getAttribute("data-qid") === activeId));
        if (activeId) root.querySelector(`mark[data-qid="${activeId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [activeId, panelOpen, questions]);

    // Clic sur un passage surligné → sa discussion
    const onContentClick = (e: React.MouseEvent) => {
        const mark = (e.target as HTMLElement).closest("mark.wk-qmark");
        if (mark) setActiveId(mark.getAttribute("data-qid"));
    };

    const onCreated = (q: LessonQuestion) => {
        add({ ...q, answerCount: 0 });
        setActiveId(q._id);
        setPanelOpen(true);
        setPanelUsed(true);
        toast.success("Question publiée sur le forum", { description: "On te prévient dès qu'on te répond." });
    };

    const openPanel = () => {
        setActiveId(null);
        setPanelOpen(true);
        setPanelUsed(true);
    };

    return (
        <article className="max-w-none">
            <header className="mb-8 border-b border-[rgba(26,21,18,0.1)] pb-6">
                <div className="font-mono-ui flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.55)]">
                    <span className="inline-flex items-center gap-1.5 text-[var(--wk-accent)]">
                        <BookOpen className="h-3.5 w-3.5" />
                        {chapterIndex >= 0 ? `Chapitre ${chapterIndex + 1}` : "Leçon"}
                    </span>
                    <span>{lesson.sectionTitle}</span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ~{rendered.readingTime} min
                    </span>
                </div>

                <h1 className="font-serif-display mt-3 text-3xl leading-[1.05] md:text-[2.6rem]">{lesson.title}</h1>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={openPanel}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,21,18,0.12)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--wk-accent)] print:hidden"
                    >
                        <MessageCircle className="h-4 w-4 text-[var(--wk-accent)]" />
                        {total > 0 ? `${total} question${total > 1 ? "s" : ""}` : "Questions"}
                    </button>
                    {lesson.audioUrl && (
                        <div className="min-w-[260px] flex-1">
                            <AudioPlayer audioUrl={lesson.audioUrl} />
                        </div>
                    )}
                </div>
                <p className="mt-3 text-xs text-[rgba(26,21,18,0.5)] print:hidden">
                    Astuce : sélectionne un passage pour poser une question dessus.
                </p>
            </header>

            <div
                ref={contentRef}
                onClick={onContentClick}
                className="prose prose-lg max-w-none notion-lesson-content"
                style={{ lineHeight: "1.8" }}
                dangerouslySetInnerHTML={{ __html: rendered.html }}
            />

            {rendered.toc.length > 0 && <LessonTableOfContents items={rendered.toc} />}

            {/* Accès aux questions, toujours visible pendant la lecture */}
            {!panelOpen && (
                <button
                    type="button"
                    onClick={openPanel}
                    aria-label="Questions sur cette leçon"
                    className="fixed bottom-6 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--wk-ink)] px-4 py-3 text-sm font-semibold text-[var(--wk-paper)] shadow-[0_10px_30px_rgba(26,21,18,0.25)] transition hover:bg-black lg:right-16 print:hidden"
                >
                    <MessageCircle className="h-4 w-4 text-[var(--wk-accent-2)]" />
                    {total > 0 ? total : <span className="hidden sm:inline">Questions</span>}
                </button>
            )}

            <SelectionBubble rootRef={contentRef} onAsk={(anchor) => setAsk({ anchor })} />

            {panelUsed && (
            <QuestionsPanel
                open={panelOpen}
                onClose={() => {
                    setPanelOpen(false);
                    setActiveId(null);
                }}
                lessonId={lesson._id}
                questions={questions}
                total={total}
                limit={LESSON_QUESTIONS_LIMIT}
                activeId={activeId}
                onSelect={setActiveId}
                orphans={orphans}
                onAskLesson={() => setAsk({ anchor: null })}
            />
            )}

            {ask && (
            <AskQuestionModal
                open={!!ask}
                onClose={() => setAsk(null)}
                contextType="lesson"
                contextId={lesson._id}
                contextTitle={lesson.title}
                anchor={ask?.anchor}
                onCreated={(q) => onCreated(q as unknown as LessonQuestion)}
            />
            )}
        </article>
    );
}
