"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    Check,
    X,
    Sparkles,
    Zap,
    Clock,
    Award,
    CheckCircle2,
    AlertCircle,
    Flame,
    Target,
    Lightbulb,
    Calendar,
} from "lucide-react";

/* ==========================================================================
 *  DATA — reflète fidèlement les modèles Workyt (Exercise, Quiz, CompetencyProgress)
 *  ======================================================================== */

// Niveaux de difficulté du modèle Exercise.ts
type Difficulty =
    | "Facile 1"
    | "Facile 2"
    | "Moyen 1"
    | "Moyen 2"
    | "Difficile 1"
    | "Difficile 2"
    | "Élite";

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string; dot: string }> = {
    "Facile 1": { bg: "#dcfce7", text: "#14532d", dot: "#22c55e" },
    "Facile 2": { bg: "#d1fae5", text: "#064e3b", dot: "#10b981" },
    "Moyen 1": { bg: "#fef3c7", text: "#78350f", dot: "#f59e0b" },
    "Moyen 2": { bg: "#fed7aa", text: "#7a3a0a", dot: "#ff6a1a" },
    "Difficile 1": { bg: "#fecaca", text: "#7f1d1d", dot: "#ef4444" },
    "Difficile 2": { bg: "#fca5a5", text: "#7f1d1d", dot: "#dc2626" },
    Élite: { bg: "#ede9fe", text: "#4c1d95", dot: "#7c3aed" },
};

// Statuts du modèle CompetencyProgress.ts
type CompetencyStatus = "not_started" | "in_progress" | "failed" | "mastered";

const STATUS_CONFIG: Record<
    CompetencyStatus,
    { label: string; bg: string; text: string; icon: typeof CheckCircle2; pct: number }
> = {
    not_started: { label: "Non commencé", bg: "#f3f4f6", text: "#6b7280", icon: Clock, pct: 0 },
    in_progress: { label: "En cours", bg: "#fef3c7", text: "#78350f", icon: Clock, pct: 55 },
    failed: { label: "À retravailler", bg: "#fecaca", text: "#7f1d1d", icon: AlertCircle, pct: 25 },
    mastered: { label: "Maîtrisée", bg: "#dcfce7", text: "#14532d", icon: CheckCircle2, pct: 92 },
};

// Types de questions du modèle Quiz.ts
type QuestionType =
    | "QCM"
    | "Réponse courte"
    | "Vrai/Faux"
    | "Texte à trous"
    | "Classement"
    | "Glisser-déposer"
    | "Slider"
    | "Code";

/* ==========================================================================
 *  MAIN SECTION
 *  ======================================================================== */

export default function LearningSimulations() {
    return (
        <section
            id="simulations"
            className="relative overflow-hidden bg-[#fff8ee] px-4 py-20 md:py-28"
        >
            {/* Notebook pattern */}
            <div
                className="wk-cahier pointer-events-none absolute inset-0 opacity-[0.35]"
                aria-hidden="true"
            />
            {/* Sparkles décoratives */}
            {[
                { top: "12%", left: "8%", size: 14, delay: "0s" },
                { top: "20%", left: "92%", size: 12, delay: "0.6s" },
                { top: "72%", left: "6%", size: 10, delay: "1.2s" },
                { top: "82%", left: "88%", size: 14, delay: "1.8s" },
            ].map((s, i) => (
                <div
                    key={i}
                    className="wk-twinkle pointer-events-none absolute z-[1]"
                    style={{ top: s.top, left: s.left, animationDelay: s.delay }}
                    aria-hidden="true"
                >
                    <Sparkles
                        className="text-[var(--wk-accent)]"
                        style={{ width: s.size, height: s.size }}
                    />
                </div>
            ))}

            <div className="relative z-[2] mx-auto max-w-[1400px]">
                {/* Header */}
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                            <span>07</span>
                            <span>Simulations live</span>
                        </div>
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
                            Regarde Workyt en{" "}
                            <span className="italic text-[var(--wk-accent)]">action</span>.
                        </h2>
                        <p className="mt-4 max-w-xl text-[rgba(26,21,18,0.7)]">
                            Trois briques qui font tourner la plateforme : un exercice avec correction, un quiz noté, et la validation des compétences du programme officiel.
                        </p>
                    </div>
                    <Link href="/cours" className="wk-btn-ink self-start md:self-end">
                        Essayer pour de vrai
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* 3 simulations cards */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <ExerciseSimulation />
                    <QuizSimulation />
                    <CompetencySimulation />
                </div>
            </div>
        </section>
    );
}

/* ==========================================================================
 *  1️⃣  EXERCISE SIMULATION
 *  ======================================================================== */

function ExerciseSimulation() {
    const [showCorrection, setShowCorrection] = useState(false);
    const difficulty: Difficulty = "Moyen 2";
    const diffColor = DIFFICULTY_COLORS[difficulty];

    return (
        <div className="wk-tilt relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 shadow-sm">
            {/* Ruban couleur matière */}
            <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "linear-gradient(90deg, #ff6a1a, #ffb547)" }}
            />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <span className="wk-chip !border-[#ffd8a8] !bg-[#fff3e0] !text-[#7a3a0a]">
                    <Target className="h-3 w-3" />
                    EXERCICE · MATHS
                </span>
                <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                        background: diffColor.bg,
                        color: diffColor.text,
                        borderColor: diffColor.dot,
                    }}
                >
                    <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: diffColor.dot }}
                    />
                    {difficulty}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-serif-display text-2xl leading-tight">
                Équation du 2<sup>nd</sup> degré
            </h3>
            <p className="font-mono-ui mt-1 text-[11px] text-[rgba(26,21,18,0.5)]">
                Section · Chapitre 02 · 1<sup>re</sup> générale
            </p>

            {/* Content — notebook style */}
            <div className="wk-cahier mt-4 rounded-2xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] p-4">
                <div className="font-mono-ui mb-2 text-[10px] uppercase tracking-widest text-[rgba(26,21,18,0.5)]">
                    Énoncé
                </div>
                <p className="text-sm leading-relaxed">
                    Résoudre dans ℝ l&apos;équation :
                </p>
                <div className="font-serif-display mt-2 text-2xl md:text-3xl">
                    x² − 5x + 6 = 0
                </div>
            </div>

            {/* Correction toggle */}
            <button
                onClick={() => setShowCorrection((v) => !v)}
                className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-[rgba(26,21,18,0.15)] bg-[var(--wk-paper)] px-4 py-3 text-left text-sm transition hover:bg-[rgba(255,106,26,0.05)] hover:border-[var(--wk-accent)]"
            >
                <span className="flex items-center gap-2 font-semibold">
                    <Lightbulb className="h-4 w-4 text-[var(--wk-accent)]" />
                    {showCorrection ? "Cacher la correction" : "Voir la correction"}
                </span>
                <span
                    className={`font-mono-ui text-[10px] font-semibold transition ${
                        showCorrection ? "rotate-90 text-[var(--wk-accent)]" : ""
                    }`}
                >
                    ▸
                </span>
            </button>

            {showCorrection && (
                <div className="wk-bounce-in mt-3 rounded-2xl border border-[rgba(126,217,87,0.3)] bg-[rgba(126,217,87,0.08)] p-4">
                    <div className="font-mono-ui mb-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#1a5a1a]">
                        <Check className="h-3 w-3" /> Correction
                    </div>
                    <p className="text-xs leading-relaxed text-[rgba(26,21,18,0.75)]">
                        Discriminant : Δ = 25 − 24 = 1 &gt; 0, deux solutions réelles.
                    </p>
                    <div className="font-serif-display mt-2 text-xl">
                        x₁ = 2, x₂ = 3
                    </div>
                </div>
            )}

            {/* Footer — exercice = pas de points, juste correction + entraînement */}
            <div className="mt-auto flex items-center justify-between border-t border-dashed border-[rgba(26,21,18,0.1)] pt-4">
                <div className="flex items-center gap-1 text-xs text-[rgba(26,21,18,0.6)]">
                    <Flame className="h-3.5 w-3.5 text-[var(--wk-accent)]" />
                    Série +7
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[rgba(126,217,87,0.15)] px-3 py-1 text-xs font-bold text-[#1a5a1a]">
                    <Lightbulb className="h-3 w-3" /> Correction guidée
                </div>
            </div>
        </div>
    );
}

/* ==========================================================================
 *  2️⃣  QUIZ SIMULATION
 *  ======================================================================== */

type QuizAnswer = {
    text: string;
    correct: boolean;
};

function QuizSimulation() {
    const questionType: QuestionType = "QCM";
    const [selected, setSelected] = useState<number | null>(null);

    const answers: QuizAnswer[] = [
        { text: "Le joule (J)", correct: false },
        { text: "Le newton (N)", correct: true },
        { text: "Le pascal (Pa)", correct: false },
        { text: "Le watt (W)", correct: false },
    ];

    const answered = selected !== null;
    const isCorrect = answered && answers[selected!].correct;

    return (
        <div className="wk-tilt relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 shadow-sm">
            <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "linear-gradient(90deg, #6ec1e4, #3b82f6)" }}
            />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <span className="wk-chip !border-[#93c5fd] !bg-[#dbeafe] !text-[#1e3a8a]">
                    <Zap className="h-3 w-3" />
                    QUIZ · PHYSIQUE
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(126,217,87,0.4)] bg-[rgba(126,217,87,0.15)] px-2 py-0.5 text-[10px] font-semibold text-[#1a5a1a]">
                    <Clock className="h-3 w-3" />
                    30s &middot; +15%
                </span>
            </div>

            {/* Title + question type */}
            <div className="flex items-center gap-2">
                <h3 className="font-serif-display text-2xl leading-tight">
                    Unité de la force
                </h3>
            </div>
            <p className="font-mono-ui mt-1 text-[11px] text-[rgba(26,21,18,0.5)]">
                Type · {questionType} · Réponse unique
            </p>

            {/* Question */}
            <div className="mt-4 rounded-2xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] p-4">
                <div className="font-mono-ui mb-2 text-[10px] uppercase tracking-widest text-[rgba(26,21,18,0.5)]">
                    Question 3 / 5
                </div>
                <p className="text-sm font-semibold leading-snug">
                    Dans le système international d&apos;unités (SI), quelle est
                    l&apos;unité de la force ?
                </p>
            </div>

            {/* Answers */}
            <div className="mt-3 space-y-2">
                {answers.map((a, i) => {
                    const chosen = selected === i;
                    const reveal = answered;
                    const showAsCorrect = reveal && a.correct;
                    const showAsWrong = reveal && chosen && !a.correct;

                    return (
                        <button
                            key={i}
                            onClick={() => setSelected(i)}
                            disabled={answered}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                showAsCorrect
                                    ? "border-[#7ed957] bg-[rgba(126,217,87,0.2)] text-[#1a5a1a]"
                                    : showAsWrong
                                    ? "border-[#ef4444] bg-[rgba(239,68,68,0.1)] text-[#7f1d1d]"
                                    : chosen
                                    ? "border-[var(--wk-accent)] bg-[rgba(255,106,26,0.08)]"
                                    : "border-[rgba(26,21,18,0.1)] bg-white hover:border-[rgba(26,21,18,0.3)]"
                            }`}
                        >
                            <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                    showAsCorrect
                                        ? "border-[#7ed957] bg-[#7ed957] text-white"
                                        : showAsWrong
                                        ? "border-[#ef4444] bg-[#ef4444] text-white"
                                        : "border-[rgba(26,21,18,0.2)] bg-white"
                                }`}
                            >
                                {showAsCorrect ? (
                                    <Check className="h-3 w-3" />
                                ) : showAsWrong ? (
                                    <X className="h-3 w-3" />
                                ) : (
                                    String.fromCharCode(65 + i)
                                )}
                            </span>
                            <span className="flex-1 font-medium">{a.text}</span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback message */}
            {answered && (
                <div
                    className={`wk-bounce-in mt-3 rounded-2xl border p-3 text-xs ${
                        isCorrect
                            ? "border-[rgba(126,217,87,0.3)] bg-[rgba(126,217,87,0.08)] text-[#1a5a1a]"
                            : "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] text-[#7f1d1d]"
                    }`}
                >
                    <div className="mb-1 flex items-center gap-1 font-bold">
                        {isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {isCorrect ? "Bonne réponse !" : "Presque !"}
                    </div>
                    <p className="leading-relaxed opacity-80">
                        Le newton est défini par F = m × a (1 N = 1 kg·m/s²).
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-dashed border-[rgba(26,21,18,0.1)] pt-4">
                <div className="flex items-center gap-1 text-xs text-[rgba(26,21,18,0.6)]">
                    <Target className="h-3.5 w-3.5 text-[var(--wk-accent-3)]" />
                    Score&nbsp;: {answered ? (isCorrect ? "1/1" : "0/1") : "—"}
                </div>
                <div
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        !answered
                            ? "bg-[rgba(26,21,18,0.06)] text-[rgba(26,21,18,0.5)]"
                            : isCorrect
                            ? "bg-[rgba(255,106,26,0.12)] text-[var(--wk-accent)]"
                            : "bg-[rgba(26,21,18,0.06)] text-[rgba(26,21,18,0.5)]"
                    }`}
                >
                    <Zap className="h-3 w-3" />
                    {answered ? (isCorrect ? "+20 pts" : "+0 pt") : "+20 pts max"}
                </div>
            </div>
        </div>
    );
}

/* ==========================================================================
 *  3️⃣  COMPETENCY VALIDATION SIMULATION
 *  ======================================================================== */

function CompetencySimulation() {
    const skillId = "C4-MATH-NC-CL-01";
    const description = "Calcul numérique · Nombres rationnels";
    const status: CompetencyStatus = "mastered";
    const config = STATUS_CONFIG[status];
    const StatusIcon = config.icon;

    // Simulation historique d'attempts (du modèle CompetencyProgress.ts)
    const attempts = [
        { date: "il y a 30j", score: 45, source: "quiz" as const },
        { date: "il y a 21j", score: 62, source: "exercise" as const },
        { date: "il y a 14j", score: 78, source: "quiz" as const },
        { date: "il y a 7j", score: 85, source: "evaluation" as const },
        { date: "aujourd'hui", score: 92, source: "quiz" as const },
    ];

    const bestScore = Math.max(...attempts.map((a) => a.score));
    const lastScore = attempts[attempts.length - 1].score;
    // Intervalles SRS du modèle : [1, 3, 7, 14, 30, 60]
    const srsLevel = 3;
    const srsIntervals = [1, 3, 7, 14, 30, 60];
    const nextReviewDays = srsIntervals[srsLevel];

    return (
        <div className="wk-tilt relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 shadow-sm">
            <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "linear-gradient(90deg, #7ed957, #22c55e)" }}
            />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <span className="wk-chip !border-[#bce8c2] !bg-[#edfbef] !text-[#1a5a1a]">
                    <Award className="h-3 w-3" />
                    COMPÉTENCE
                </span>
                <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                        background: config.bg,
                        color: config.text,
                        borderColor: config.text + "33",
                    }}
                >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                </span>
            </div>

            {/* skillId + description */}
            <div className="font-mono-ui mb-1 text-[11px] font-bold tracking-wider text-[var(--wk-accent)]">
                {skillId}
            </div>
            <h3 className="font-serif-display text-2xl leading-tight">
                {description}
            </h3>
            <p className="font-mono-ui mt-1 text-[11px] text-[rgba(26,21,18,0.5)]">
                Cycle 4 · Mathématiques · Brevet
            </p>

            {/* Progress bar */}
            <div className="mt-4 rounded-2xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] p-4">
                <div className="flex items-center justify-between">
                    <span className="font-mono-ui text-[10px] uppercase tracking-widest text-[rgba(26,21,18,0.5)]">
                        Meilleur score
                    </span>
                    <span className="font-serif-display text-2xl leading-none">
                        {bestScore}%
                    </span>
                </div>
                <div className="wk-xp-bar mt-2">
                    <div
                        className="wk-xp-fill"
                        style={{
                            width: `${bestScore}%`,
                            background:
                                status === "mastered"
                                    ? "linear-gradient(90deg, #7ed957, #22c55e)"
                                    : status === "failed"
                                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                                    : "linear-gradient(90deg, var(--wk-accent), var(--wk-accent-2))",
                        }}
                    />
                </div>
                <div className="font-mono-ui mt-2 flex items-center justify-between text-[10px] text-[rgba(26,21,18,0.5)]">
                    <span>Dernier · {lastScore}%</span>
                    <span>{attempts.length} tentatives</span>
                </div>
            </div>

            {/* Attempts history — points progressifs */}
            <div className="mt-4">
                <div className="font-mono-ui mb-2 text-[10px] uppercase tracking-widest text-[rgba(26,21,18,0.5)]">
                    Historique
                </div>
                <div className="flex items-end gap-1.5">
                    {attempts.map((a, i) => {
                        const color =
                            a.score >= 80
                                ? "#22c55e"
                                : a.score >= 60
                                ? "#f59e0b"
                                : a.score >= 40
                                ? "#ff6a1a"
                                : "#ef4444";
                        return (
                            <div
                                key={i}
                                className="group flex flex-1 flex-col items-center"
                                title={`${a.date} · ${a.score}% · ${a.source}`}
                            >
                                <div
                                    className="w-full rounded-md transition-transform group-hover:scale-y-105"
                                    style={{
                                        height: `${Math.max(a.score * 0.4, 8)}px`,
                                        background: color,
                                        opacity: 0.4 + (i / attempts.length) * 0.6,
                                    }}
                                />
                                <span className="font-mono-ui mt-1 text-[8px] text-[rgba(26,21,18,0.5)]">
                                    {a.score}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SRS next review */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-[rgba(26,21,18,0.15)] bg-[var(--wk-paper)] px-3 py-2 text-xs">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--wk-accent)]" />
                <span className="flex-1 text-[rgba(26,21,18,0.7)]">
                    Révision SRS dans{" "}
                    <span className="font-bold text-[var(--wk-ink)]">
                        {nextReviewDays}&nbsp;jour{nextReviewDays > 1 ? "s" : ""}
                    </span>
                </span>
                <span className="font-mono-ui rounded-full bg-[rgba(255,106,26,0.12)] px-2 py-0.5 text-[9px] font-bold text-[var(--wk-accent)]">
                    Nv.&nbsp;{srsLevel}
                </span>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-dashed border-[rgba(26,21,18,0.1)] pt-4">
                <div className="flex items-center gap-1 text-xs text-[rgba(26,21,18,0.6)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                    {attempts.filter((a) => a.score >= 80).length} réussites
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[rgba(126,217,87,0.15)] px-3 py-1 text-xs font-bold text-[#1a5a1a]">
                    <Award className="h-3 w-3" /> Validée
                </div>
            </div>
        </div>
    );
}
