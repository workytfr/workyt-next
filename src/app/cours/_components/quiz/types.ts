import type {
    Quiz as SharedQuiz,
    QuizQuestion,
    QuizDetailedAnswer,
} from "../types";

/** Quiz tel que consommé par le lecteur : les questions y sont garanties. */
export interface QuizViewerQuiz extends SharedQuiz {
    questions: QuizQuestion[];
    competencies?: string[];
}

/** Compétence rattachée au quiz, enrichie par l'API. */
export interface CompetencyInfo {
    skillId: string;
    description: string;
    difficulty: number;
    status: "not_started" | "in_progress" | "failed" | "mastered";
    nextReview?: string;
}

/** Résultat détaillé renvoyé par POST /api/quizzes/[id]. */
export interface DetailedResults {
    score: number;
    maxScore: number;
    percentage: number;
    answers: QuizDetailedAnswer[];
    timeModifier?: number;
    timeModifierLabel?: string;
    pointsAwarded?: number;
    bestScore?: number;
    isNewBest?: boolean;
}

/**
 * Contrat commun à tous les composants de saisie.
 * Chaque type de question reçoit la question, la réponse courante et un
 * callback — rien d'autre, pour qu'ils restent testables isolément.
 */
export interface QuestionInputProps<T = any> {
    question: QuizQuestion;
    value: T;
    onChange: (value: T) => void;
}

export type { QuizQuestion, QuizDetailedAnswer };
