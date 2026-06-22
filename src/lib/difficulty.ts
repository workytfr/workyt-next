/**
 * Niveaux de difficulté partagés (exercices de cours + évaluations).
 * Mêmes valeurs que le modèle Exercise pour une UX cohérente.
 */
export const DIFFICULTY_LEVELS = [
    "Facile 1",
    "Facile 2",
    "Moyen 1",
    "Moyen 2",
    "Difficile 1",
    "Difficile 2",
    "Élite",
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const difficultyConfig: Record<string, { color: string; bg: string; gradient: string }> = {
    "Facile 1": { color: "#10b981", bg: "#ecfdf5", gradient: "from-emerald-500 to-green-500" },
    "Facile 2": { color: "#10b981", bg: "#ecfdf5", gradient: "from-emerald-500 to-teal-500" },
    "Moyen 1": { color: "#f59e0b", bg: "#fffbeb", gradient: "from-amber-500 to-orange-500" },
    "Moyen 2": { color: "#f59e0b", bg: "#fffbeb", gradient: "from-amber-500 to-yellow-500" },
    "Difficile 1": { color: "#ef4444", bg: "#fef2f2", gradient: "from-red-500 to-rose-500" },
    "Difficile 2": { color: "#ef4444", bg: "#fef2f2", gradient: "from-red-500 to-pink-500" },
    "Élite": { color: "#8b5cf6", bg: "#f5f3ff", gradient: "from-violet-500 to-purple-500" },
};

/** Chemin du badge SVG associé à un niveau de difficulté. */
export const difficultyBadge = (difficulty: string) =>
    `/badge/${difficulty.toLowerCase().replace(/\s+/g, "_")}.svg`;
