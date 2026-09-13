import type { QuizQuestion } from "../types";

/** « 2:07 » à partir d'un nombre de secondes. */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Mélange déterministe (Fisher-Yates à graine).
 * Déterministe pour que l'ordre proposé ne change pas à chaque rendu, et
 * garanti différent de l'ordre d'origine — sinon un classement pourrait être
 * donné déjà résolu.
 */
export function seededShuffle<T>(items: T[], seed: number): T[] {
    const shuffled = [...items];
    let s = seed;

    for (let i = shuffled.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        const j = s % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const unchanged = shuffled.every((v, idx) => v === items[idx]);
    if (unchanged && shuffled.length > 1) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }

    return shuffled;
}

/**
 * Types dont la valeur par défaut vaut déjà réponse : un classement démarre
 * dans un ordre donné, un curseur sur sa valeur médiane.
 */
const TYPES_WITH_DEFAULT: QuizQuestion["questionType"][] = ["Classement", "Slider"];

export function hasDefaultAnswer(question: QuizQuestion): boolean {
    return TYPES_WITH_DEFAULT.includes(question.questionType);
}

/** Une question est-elle considérée comme répondue ? */
export function isAnswered(question: QuizQuestion, answer: any): boolean {
    if (hasDefaultAnswer(question)) return true;

    if (question.questionType === "Glisser-déposer") {
        return Array.isArray(answer) && answer.length > 0 && answer.every((v: string) => !!v);
    }

    if (Array.isArray(answer)) {
        return answer.length > 0 && answer.some((v) => v !== undefined && v !== "");
    }

    // Réponses géométriques : un objet de coordonnées vaut réponse.
    if (typeof answer === "object") {
        return Number.isFinite(Number((answer as any).x));
    }

    return answer !== undefined && answer !== "";
}

/** Valeur envoyée à l'API pour une question laissée à son état par défaut. */
export function defaultAnswerFor(question: QuizQuestion): any {
    if (question.questionType === "Classement") {
        return question.answers.map((_, idx) => idx);
    }

    if (question.questionType === "Slider") {
        const min = parseFloat(question.answers[0] || "0");
        const max = parseFloat(question.answers[1] || "100");
        return (min + max) / 2;
    }

    return undefined;
}

/**
 * Met en forme la bonne réponse pour l'écran de résultats.
 * Chaque type stocke son corrigé différemment (index, tableau d'index,
 * chaînes…) : cette fonction centralise la traduction en texte lisible.
 */
export function formatCorrectAnswer(question: QuizQuestion, correctAnswer: any): string {
    if (correctAnswer === undefined || correctAnswer === null) return "";

    const asArray = Array.isArray(correctAnswer) ? correctAnswer : null;

    switch (question.questionType) {
        case "QCM":
            if (asArray) {
                return asArray
                    .map((idx: number) => question.answers[idx] ?? String(idx))
                    .join(", ");
            }
            return question.answers[parseInt(String(correctAnswer), 10)] ?? String(correctAnswer);

        case "Vrai/Faux":
            return String(correctAnswer).toLowerCase() === "true" ? "Vrai" : "Faux";

        case "Classement":
            return asArray
                ? asArray.map((idx: number) => question.answers[idx] ?? String(idx)).join(" → ")
                : String(correctAnswer);

        case "Slider":
            return `${correctAnswer}${question.answers[3] || ""}`;

        case "Point sur image":
            return correctAnswer?.x !== undefined
                ? `x ${Math.round(correctAnswer.x)} % · y ${Math.round(correctAnswer.y)} %`
                : "";

        case "Zone sur image":
            return correctAnswer?.w !== undefined
                ? `zone de ${Math.round(correctAnswer.w)} × ${Math.round(correctAnswer.h)} % ` +
                      `à partir de (${Math.round(correctAnswer.x)} % ; ${Math.round(correctAnswer.y)} %)`
                : "";

        case "Graphique":
            return asArray
                ? asArray.map((p: any) => `(${p?.x} ; ${p?.y})`).join("  ")
                : "";

        default:
            return asArray ? asArray.join(", ") : String(correctAnswer);
    }
}

/** Met en forme la réponse donnée par l'élève, avec les mêmes règles. */
export function formatUserAnswer(question: QuizQuestion, userAnswer: any): string {
    if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
        return "Aucune réponse";
    }
    return formatCorrectAnswer(question, userAnswer);
}
