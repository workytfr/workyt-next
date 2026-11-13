import React from "react";

/**
 * Icônes des contenus Workyt (cours, fiche, quiz, évaluation, forum, exercice),
 * dans le style des badges : formes pleines, sans trait, couleur du texte.
 * Même usage qu'une icône Lucide (className, size) pour les remplacer sans
 * toucher au reste ; strokeWidth est accepté et ignoré.
 * Sans hook : utilisables en composant serveur comme client.
 */

const ring = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const spark = (c: number, d: number, s: number, k = 0.22) => {
    const q = +(s * k).toFixed(2);
    return `M${c} ${d - s}Q${c + q} ${d - q} ${c + s} ${d}Q${c + q} ${d + q} ${c} ${d + s}Q${c - q} ${d + q} ${c - s} ${d}Q${c - q} ${d - q} ${c} ${d - s}Z`;
};
/** Quartier de jauge entre deux angles (degrés, 180 = gauche, 0 = droite) */
const wedge = (cx: number, cy: number, r1: number, r2: number, a1: number, a2: number) => {
    const pt = (r: number, a: number) => {
        const t = (a * Math.PI) / 180;
        return `${+(cx + r * Math.cos(t)).toFixed(2)} ${+(cy - r * Math.sin(t)).toFixed(2)}`;
    };
    return `M${pt(r2, a1)}A${r2} ${r2} 0 0 1 ${pt(r2, a2)}L${pt(r1, a2)}A${r1} ${r1} 0 0 0 ${pt(r1, a1)}Z`;
};

/** Dessins en grille 100, partagés avec les badges (public/badge/streak_*, mushroom_*) */
const FLAME = "M50 6C62 24 80 36 80 60A30 30 0 0 1 20 60C20 44 30 36 36 26C38 36 42 40 46 42C46 30 46 18 50 6Z";
const FLAME_CORE = "M50 50C57 58 63 63 63 72A13 13 0 0 1 37 72C37 63 43 58 50 50Z";
const CAP = "M10 52C10 28 28 12 50 12C72 12 90 28 90 52C90 56 87 58 83 58H17C13 58 10 56 10 52Z";
const STEM = "M38 62H62L64 84A8 8 0 0 1 56 92H44A8 8 0 0 1 36 84Z";

/** [tracé, évidé (evenodd) ?, transform ?, opacité ?] */
type Part = [string, boolean?, string?, number?];

const GLYPHS = {
    // Le livre s'ouvre, une étincelle en sort
    cours: [["M11 9.5C8.6 7.6 5.3 7.2 2 8v13c3.3-.8 6.6-.4 9 1.5Z"], ["M13 9.5c2.4-1.9 5.7-2.3 9-1.5v13c-3.3-.8-6.6-.4-9 1.5Z"], [spark(12, 4, 3.4)]],
    // Le cours derrière, la fiche devant, coin corné et deux lignes
    fiche: [
        ["M7 5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-1V5Z"],
        ["M5 6.5h7.5l4 4V19a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.5a3 3 0 0 1 3-3ZM5 13.5h7v1.6H5ZM5 17h4.5v1.6H5Z", true],
    ],
    // Une arche, une feuille, un point : le « ? »
    quiz: [["M5 10a7 7 0 0 1 14 0h-4.4a2.6 2.6 0 0 0-5.2 0Z"], ["M17 11A4.6 4.6 0 0 1 12 17.5A4.6 4.6 0 0 1 17 11Z"], [ring(12, 20.8, 1.6)]],
    // La note se remplit quartier par quartier
    evaluation: [
        [[0, 1, 2].map((i) => wedge(12, 17, 5, 10.5, 180 - i * 45 - 2, 180 - (i + 1) * 45 + 2)).join("")],
        [wedge(12, 17, 5, 10.5, 43, 2), false, undefined, 0.35],
        [ring(12, 17, 2.4)],
    ],
    // Une question qui brille appelle une réponse
    forum: [
        [`M2 14.5V8a6 6 0 0 1 6-6h1.5a6 6 0 0 1 6 6v.5a6 6 0 0 1-6 6Z${spark(8.75, 8.25, 3.2)}`, true],
        ["M22 22h-4.5a4.5 4.5 0 0 1-4.5-4.5 4.5 4.5 0 0 1 4.5-4.5 4.5 4.5 0 0 1 4.5 4.5Z"],
    ],
    // Le journal du blog : la une, deux lignes d'article et le rabat replié
    blog: [
        ["M8.5 3h11A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 6 18.5v-13A2.5 2.5 0 0 1 8.5 3ZM9 6h10v4H9ZM9 12.5h10v1.6H9ZM9 16h6.5v1.6H9Z", true],
        ["M2 8h2.6v10.8a1.3 1.3 0 0 1-2.6 0Z"],
    ],
    // Un crayon et l'étincelle qu'il laisse : à toi de jouer
    exercice: [["M10 2h4v13.5h-4ZM10 16.3h4L12 21ZM10 4.6h4v1.1h-4Z", true, "rotate(45 12 12)"], [spark(19.5, 19.5, 2.8)]],
    // Flamme de série : une langue de feu et son cœur évidé (même dessin que les badges de série)
    flamme: [[`${FLAME}${FLAME_CORE}`, true, "scale(0.24)"]],
    // Champignon boost : chapeau à pois évidés et pied (même dessin que les badges champignon)
    champignon: [[`${CAP}${ring(34, 32, 7)}${ring(58, 26, 6)}${ring(72, 42, 5)}${ring(46, 46, 4)}`, true, "scale(0.24)"], [STEM, false, "scale(0.24)"]],
} satisfies Record<string, Part[]>;

export type WkIconName = keyof typeof GLYPHS;
export type WkIconProps = { className?: string; size?: number | string; strokeWidth?: number | string; color?: string };
export type WkIconComponent = (props: WkIconProps) => React.ReactElement;

function make(name: WkIconName): WkIconComponent {
    function Icon({ className, size = 24, color }: WkIconProps) {
        return (
            <svg viewBox="1 1 22 22" width={size} height={size} fill={color ?? "currentColor"} className={className} aria-hidden="true">
                {(GLYPHS[name] as Part[]).map(([d, holes, transform, opacity], i) => (
                    <path key={i} d={d} fillRule={holes ? "evenodd" : undefined} transform={transform} opacity={opacity} />
                ))}
            </svg>
        );
    }
    Icon.displayName = `WkIcon(${name})`;
    return Icon;
}

export const CoursIcon = make("cours");
export const FicheIcon = make("fiche");
export const QuizIcon = make("quiz");
export const EvaluationIcon = make("evaluation");
export const ForumIcon = make("forum");
export const ExerciceIcon = make("exercice");
export const BlogIcon = make("blog");
export const FlammeIcon = make("flamme");
export const ChampignonIcon = make("champignon");

/** Tracés bruts de la flamme, pour les composants qui l'animent (StreakIndicator) */
export const FLAME_PATHS = { body: FLAME, core: FLAME_CORE } as const;
