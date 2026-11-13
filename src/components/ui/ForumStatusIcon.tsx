/**
 * Icônes de validation du forum, dans le style des badges Workyt (formes pleines :
 * feuilles, étoiles, bulles). Elles prennent la couleur du texte (currentColor).
 * Sans hook : utilisables en composant serveur comme client.
 */

const leaf = (x1: number, y1: number, x2: number, y2: number, f = 0.6) => {
    const r = (Math.hypot(x2 - x1, y2 - y1) * f).toFixed(2);
    return `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}A${r} ${r} 0 0 1 ${x1} ${y1}Z`;
};
const star = (c: number, d: number, s: number, k = 0.2) => {
    const q = +(s * k).toFixed(2);
    return `M${c} ${d - s}Q${c + q} ${d - q} ${c + s} ${d}Q${c + q} ${d + q} ${c} ${d + s}Q${c - q} ${d + q} ${c - s} ${d}Q${c - q} ${d - q} ${c} ${d - s}Z`;
};

/** Bulle de forum : carré arrondi, coin bas-gauche pointu */
const BUBBLE = "M8 92L8 36A28 28 0 0 1 36 8L64 8A28 28 0 0 1 92 36L92 64A28 28 0 0 1 64 92Z";
/** Coche épaisse, évidée dans la bulle */
const CHECK = "M27 51L35 43L45 53L67 31L75 39L45 69Z";

export type ForumStatusKind = "validee" | "meilleure" | "attente" | "resolue";

const SHAPES: Record<ForumStatusKind, string> = {
    // Réponse validée par l'équipe : deux feuilles en coche, une étoile éclose
    validee: [leaf(12, 54, 42, 84, 0.58), leaf(50, 86, 90, 24), star(24, 22, 13)].join(""),
    // Meilleure réponse choisie par l'auteur : couronne de trois feuilles
    meilleure: ["M27 70H73A7 7 0 0 1 73 84H27A7 7 0 0 1 27 70Z", leaf(30, 66, 18, 32), leaf(50, 66, 50, 28), leaf(70, 66, 82, 32), star(50, 13, 11)].join(""),
    // Question en attente : un sablier
    attente: "M24 10H76Q76 36 56 50Q76 64 76 90H24Q24 64 44 50Q24 36 24 10Z",
    // Question résolue : la bulle porte la coche
    resolue: BUBBLE + CHECK,
};

export function ForumStatusIcon({ kind, className = "h-4 w-4" }: { kind: ForumStatusKind; className?: string }) {
    return (
        <svg viewBox="6 6 88 88" className={className} aria-hidden="true">
            <path d={SHAPES[kind]} fill="currentColor" fillRule="evenodd" />
        </svg>
    );
}

/** Statut de question (modèle) → icône */
export const QUESTION_STATUS_ICON: Record<string, ForumStatusKind> = {
    "Non validée": "attente",
    "Validée": "validee",
    "Résolue": "resolue",
};
