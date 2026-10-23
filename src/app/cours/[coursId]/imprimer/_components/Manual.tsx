/**
 * Briques du manuel imprimable (composants serveur) : ouverture de chapitre,
 * cours, « Je retiens l'essentiel », « Je teste mes connaissances »,
 * exercices par niveau, corrigés et lexique. Mise en page : print.css.
 */
import QRCode from "qrcode";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { BookOpen, CheckSquare, Dumbbell, Key, Lightbulb, MessageCircle, Rocket, Target } from "lucide-react";
import type { KeyBlock } from "@/lib/lessonHtml";
import type { PrintableQuestion } from "@/lib/courseReader";

/* ─────────────── Couleurs et rubriques ─────────────── */

/** Une couleur de la charte par chapitre, comme les onglets d'un manuel */
export const CHAPTER_COLORS = ["#ff6a1a", "#6ec1e4", "#7ed957", "#ffb547", "#f72585", "#970ce3"];
export const chapterColor = (n: number) => CHAPTER_COLORS[(n - 1) % CHAPTER_COLORS.length];

export const pad = (n: number) => String(n).padStart(2, "0");

export const RUBRICS = {
    cours: { label: "Cours", Icon: BookOpen, hint: "Les leçons du chapitre, avec définitions, propriétés et exemples." },
    essentiel: { label: "Je retiens l'essentiel", Icon: Lightbulb, hint: "Les définitions et propriétés à connaître par cœur, sur une page." },
    teste: { label: "Je teste mes connaissances", Icon: CheckSquare, hint: "Des questions rapides pour vérifier que tu as compris. Réponses en ligne." },
    entraine: { label: "Je m'entraîne", Icon: Dumbbell, hint: "Des exercices d'application directe du cours." },
    approfondis: { label: "J'approfondis", Icon: Target, hint: "Des exercices qui mélangent plusieurs notions." },
    loin: { label: "Je vais plus loin", Icon: Rocket, hint: "Des défis pour les plus motivés." },
    corriges: { label: "Corrigés", Icon: Key, hint: "Toutes les corrections, en fin de manuel. Cherche d'abord !" },
} as const;

type ExerciseRubric = "entraine" | "approfondis" | "loin";

function rubricOf(difficulty: string): ExerciseRubric {
    if (difficulty.startsWith("Moyen")) return "approfondis";
    if (difficulty.startsWith("Difficile") || difficulty === "Élite") return "loin";
    return "entraine";
}

export interface NumberedExercise {
    ex: any;
    n: number;
    rubric: ExerciseRubric;
}

/** Exercices regroupés par niveau puis numérotés 1, 2, 3… dans le chapitre */
export function numberExercises(exercises: any[]): NumberedExercise[] {
    const order: ExerciseRubric[] = ["entraine", "approfondis", "loin"];
    let n = 0;
    return order.flatMap((rubric) =>
        exercises.filter((ex) => rubricOf(ex.difficulty || "") === rubric).map((ex) => ({ ex, n: ++n, rubric }))
    );
}

export const hasAnswer = (ex: any) => !!(ex.correction?.text || ex.correction?.image);

/* ─────────────── Utilitaires ─────────────── */

export async function qrSvg(url: string) {
    return QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1a1512", light: "#00000000" } });
}

export function Markdown({ children, inline = false }: { children: string; inline?: boolean }) {
    return (
        <div className={inline ? "wk-md-inline" : "prose"}>
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {children}
            </ReactMarkdown>
        </div>
    );
}

export function RubricTitle({ rubric, extra }: { rubric: keyof typeof RUBRICS; extra?: string }) {
    const { label, Icon } = RUBRICS[rubric];
    return (
        <div className="wk-rubric">
            <span className="wk-rubric-icon">
                <Icon />
            </span>
            <span className="wk-rubric-label">{label}</span>
            {extra && <span className="wk-rubric-extra">{extra}</span>}
        </div>
    );
}

/* ─────────────── Mode d'emploi ─────────────── */

export function HowToUse({ withExercises, withQuiz }: { withExercises: boolean; withQuiz: boolean }) {
    const items: (keyof typeof RUBRICS)[] = [
        "cours",
        "essentiel",
        ...(withQuiz ? (["teste"] as const) : []),
        ...(withExercises ? (["entraine", "approfondis", "loin", "corriges"] as const) : []),
    ];
    return (
        <div className="wk-howto">
            <div className="wk-eyebrow">Mode d&apos;emploi</div>
            <h2>
                Comment utiliser ton manuel<span className="wk-dot">.</span>
            </h2>
            <p className="wk-lead">Chaque chapitre suit le même chemin : tu découvres, tu retiens, tu vérifies, puis tu t&apos;entraînes.</p>
            <div className="wk-howto-grid">
                {items.map((key) => {
                    const { label, Icon, hint } = RUBRICS[key];
                    return (
                        <div key={key} className="wk-howto-card">
                            <span className="wk-rubric-icon">
                                <Icon />
                            </span>
                            <div>
                                <h4>{label}</h4>
                                <p>{hint}</p>
                            </div>
                        </div>
                    );
                })}
                <div className="wk-howto-card ink">
                    <span className="wk-rubric-icon">
                        <MessageCircle />
                    </span>
                    <div>
                        <h4>Une question ?</h4>
                        <p>Scanne le QR code du chapitre, sélectionne le passage qui te bloque et pose ta question : un bénévole te répond.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────── Ouverture de chapitre ─────────────── */

export function ChapterOpener({
    number,
    title,
    lessons,
    skills,
    exerciseCount,
    questionCount,
    qr,
}: {
    number: number;
    title: string;
    lessons: { _id: string; title: string }[];
    skills: string[];
    exerciseCount: number;
    questionCount: number;
    qr: string;
}) {
    return (
        <div className="wk-opener">
            <div className="wk-opener-top wk-dotgrid">
                <div className="wk-eyebrow">Chapitre</div>
                <div className="wk-opener-num">{pad(number)}</div>
                <h1>
                    {title}
                    <span className="wk-dot">.</span>
                </h1>
            </div>

            <div className="wk-opener-grid">
                <div className="wk-opener-card tint">
                    <span className="wk-label">Dans ce chapitre</span>
                    <ol className="wk-opener-lessons">
                        {lessons.map((l, i) => (
                            <li key={l._id}>
                                <b>
                                    {number}.{i + 1}
                                </b>
                                {l.title}
                            </li>
                        ))}
                    </ol>
                    {(exerciseCount > 0 || questionCount > 0) && (
                        <div className="wk-opener-chips">
                            {questionCount > 0 && <span className="wk-chip white">{questionCount} questions pour te tester</span>}
                            {exerciseCount > 0 && <span className="wk-chip white">{exerciseCount} exercice{exerciseCount > 1 ? "s" : ""} corrigé{exerciseCount > 1 ? "s" : ""}</span>}
                        </div>
                    )}
                </div>

                <div className="wk-opener-side">
                    {skills.length > 0 && (
                        <div className="wk-opener-card">
                            <span className="wk-label">Je vais apprendre à</span>
                            <ul className="wk-skills">
                                {skills.slice(0, 6).map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="wk-opener-card ink wk-qr-card">
                        <div className="wk-qr" dangerouslySetInnerHTML={{ __html: qr }} />
                        <div>
                            <span className="wk-label">Ce chapitre en ligne</span>
                            <p>Écoute les leçons, fais les quiz et pose tes questions sur workyt.fr.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────── Je retiens l'essentiel ─────────────── */

export function Essentials({ blocks }: { blocks: (KeyBlock & { lesson: string })[] }) {
    if (blocks.length === 0) return null;
    return (
        <div className="wk-part wk-essentials">
            <RubricTitle rubric="essentiel" />
            <div className="wk-essentials-grid notion-lesson-content">
                {blocks.map((b, i) => (
                    <div key={i} className="wk-essential" dangerouslySetInnerHTML={{ __html: b.html }} />
                ))}
            </div>
        </div>
    );
}

/* ─────────────── Je teste mes connaissances ─────────────── */

const LETTERS = "ABCDEFGH";

export function QuizPart({ questions, qr }: { questions: PrintableQuestion[]; qr: string }) {
    if (questions.length === 0) return null;
    return (
        <div className="wk-part wk-quiz">
            <RubricTitle rubric="teste" extra={`${questions.length} question${questions.length > 1 ? "s" : ""}`} />
            <ol className="wk-quiz-list">
                {questions.map((q, i) => (
                    <li key={i} className="wk-quiz-item">
                        <span className="wk-quiz-n">{i + 1}</span>
                        <div className="wk-quiz-body">
                            <Markdown inline>{q.question}</Markdown>
                            {q.questionType === "Réponse courte" ? (
                                <div className="wk-writing short" />
                            ) : (
                                <ul className={`wk-choices${q.answers.length > 2 ? " two" : ""}`}>
                                    {(q.questionType === "Vrai/Faux" && q.answers.length === 0 ? ["Vrai", "Faux"] : q.answers).map((a, j) => (
                                        <li key={j}>
                                            <span className="wk-box" />
                                            <b>{LETTERS[j]}.</b> <Markdown inline>{a}</Markdown>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
            <div className="wk-quiz-foot">
                <div className="wk-qr small" dangerouslySetInnerHTML={{ __html: qr }} />
                <p>
                    <b>Vérifie tes réponses en ligne :</b> fais le quiz sur workyt.fr, ta correction s&apos;affiche tout de suite et tu gagnes des points.
                </p>
            </div>
        </div>
    );
}

/* ─────────────── Exercices ─────────────── */

const LEVEL_DOTS: Record<string, number> = { "Facile 1": 1, "Facile 2": 2, "Moyen 1": 1, "Moyen 2": 2, "Difficile 1": 1, "Difficile 2": 2, "Élite": 3 };

export function ExercisesPart({ numbered }: { numbered: NumberedExercise[] }) {
    if (numbered.length === 0) return null;
    const groups = (["entraine", "approfondis", "loin"] as ExerciseRubric[])
        .map((rubric) => ({ rubric, items: numbered.filter((e) => e.rubric === rubric) }))
        .filter((g) => g.items.length > 0);

    return (
        <div className="wk-part wk-exercises">
            {groups.map(({ rubric, items }) => (
                <div key={rubric} className={`wk-ex-group ${rubric}`}>
                    <RubricTitle rubric={rubric} />
                    {items.map(({ ex, n }) => {
                        const short = (ex.content || "").length < 900 && !ex.image;
                        return (
                            <article key={ex._id} className={`wk-exercise${short ? " short" : ""}`}>
                                <div className="wk-exercise-head">
                                    <span className="wk-exercise-n">{n}</span>
                                    <h4>{ex.title}</h4>
                                    <span className="wk-level" title={ex.difficulty}>
                                        {"●".repeat(LEVEL_DOTS[ex.difficulty] ?? 1)}
                                        <span>{"●".repeat(3 - (LEVEL_DOTS[ex.difficulty] ?? 1))}</span>
                                    </span>
                                </div>
                                <Markdown>{ex.content || ""}</Markdown>
                                {ex.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={ex.image} alt="" />
                                )}
                            </article>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

/* ─────────────── Corrigés ─────────────── */

export function AnswersPart({ chapters }: { chapters: { number: number; title: string; numbered: NumberedExercise[] }[] }) {
    const withAnswers = chapters.filter((c) => c.numbered.some(({ ex }) => hasAnswer(ex)));
    if (withAnswers.length === 0) return null;

    return (
        <section className="wk-sheet wk-print-answers">
            <div className="wk-ink-card">
                <div className="wk-eyebrow">Fin du manuel</div>
                <h2 style={{ color: "var(--paper)" }}>
                    Corrigés<span className="wk-dot">.</span>
                </h2>
                <p className="wk-lead">Compare avec ta réponse, puis refais l&apos;exercice sans regarder. Une erreur ? Relis la partie « Je retiens l&apos;essentiel » du chapitre.</p>
            </div>
            <div className="wk-answers">
                {withAnswers.map((c) => (
                    <div key={c.number} className="wk-answers-chapter" style={{ ["--ch" as string]: chapterColor(c.number) }}>
                        <h3>
                            <span>{pad(c.number)}</span> {c.title}
                        </h3>
                        {c.numbered.map(({ ex, n }) =>
                            hasAnswer(ex) ? (
                                <div key={ex._id} className={`wk-answer${(ex.correction.text || "").length < 700 && !ex.correction.image ? " short" : ""}`}>
                                    <span className="wk-exercise-n">{n}</span>
                                    <div className="wk-answer-body">
                                        {ex.correction.text && <Markdown>{ex.correction.text}</Markdown>}
                                        {ex.correction.image && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={ex.correction.image} alt="" />
                                        )}
                                    </div>
                                </div>
                            ) : null
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ─────────────── Lexique ─────────────── */

export function Lexicon({ entries }: { entries: { term: string; chapter: number; lesson: string }[] }) {
    if (entries.length < 3) return null;
    const sorted = [...entries].sort((a, b) => a.term.localeCompare(b.term, "fr"));
    return (
        <section className="wk-sheet">
            <div className="wk-eyebrow">Index</div>
            <h2>
                Lexique<span className="wk-dot">.</span>
            </h2>
            <p className="wk-lead">Les mots définis dans le manuel, et où les retrouver.</p>
            <ul className="wk-lexicon">
                {sorted.map((e, i) => (
                    <li key={i}>
                        <b>{e.term}</b>
                        <span>
                            Ch. {e.chapter} · {e.lesson}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/* ─────────────── Bandeau de chapitre (cahier d'exercices) ─────────────── */

export function ChapterBanner({ number, title, qr }: { number: number; title: string; qr: string }) {
    return (
        <div className="wk-banner">
            <div className="wk-banner-num">{pad(number)}</div>
            <div className="wk-banner-text">
                <div className="wk-eyebrow">Chapitre {pad(number)}</div>
                <h2>
                    {title}
                    <span className="wk-dot">.</span>
                </h2>
            </div>
            <div className="wk-qr small" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
    );
}
