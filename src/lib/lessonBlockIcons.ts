/**
 * Icônes des blocs pédagogiques des leçons (définition, propriété, théorème,
 * remarque, attention, exemple), en SVG texte pour le HTML des leçons.
 * Utilisées par lib/lessonHtml et affichées dans la charte graphique.
 */

// Icônes pleines dans le style des badges Workyt (`currentColor` : la couleur vient de la variante CSS du bloc).
// Même dessin que public/badge/<type>.svg : clé, ampoule étoilée, œil, temple, rouage, « ! ».
const ringPath = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const GEAR_TEETH = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
        const r = (a * Math.PI) / 180;
        return ringPath(+(12 + 8.2 * Math.sin(r)).toFixed(2), +(12 - 8.2 * Math.cos(r)).toFixed(2), 1.9);
    })
    .join("");

export function getIconSVG(type: string) {
    const svg = (paths: string) =>
        `<svg viewBox="1 1 22 22" fill="currentColor" aria-hidden="true">${paths}</svg>`;
    const holes = (d: string) => `<path fill-rule="evenodd" d="${d}"/>`;
    const solid = (d: string) => `<path d="${d}"/>`;
    switch (type) {
        case "definition": // une clé : la définition ouvre le sens du mot
            return svg(holes(`${ringPath(7.5, 12, 5.3)}${ringPath(7.5, 12, 2)}`) + solid("M11.6 10.6h10.4v2.8H11.6ZM16.8 13.2h2v4h-2ZM19.9 13.2h1.9v3h-1.9Z"));
        case "propriete": // un rouage : une règle qui tourne toujours de la même façon
            return svg(holes(`${ringPath(12, 12, 6.8)}${ringPath(12, 12, 2.8)}`) + solid(GEAR_TEETH));
        case "theoreme": // un temple : ce qui est démontré tient debout
            return svg(solid("M12 2 22 7.5H2ZM4 9h3v9H4ZM10.5 9h3v9h-3ZM17 9h3v9h-3ZM2 19.5h20V22H2Z"));
        case "remarque": // un œil : ce qu'il faut remarquer
            return svg(holes(`M1.5 12C4 7 7.8 4.8 12 4.8S20 7 22.5 12C20 17 16.2 19.2 12 19.2S4 17 1.5 12Z${ringPath(12, 12, 4.2)}${ringPath(12, 12, 1.8)}`));
        case "attention": // le « ! » fait d'une feuille et d'un point
            return svg(holes(`M10.3 3.6a2 2 0 0 1 3.4 0l8.4 14.6A2 2 0 0 1 20.4 21H3.6a2 2 0 0 1-1.7-2.8ZM12 7.5c1 1.6 1.4 3.4 1 6.3h-2c-.4-2.9 0-4.7 1-6.3Z${ringPath(12, 17, 1.3)}`));
        case "exemple": // une ampoule : avec un exemple, l'idée s'allume
            return svg(holes("M12 2a7 7 0 0 1 4.2 12.6V17H7.8v-2.4A7 7 0 0 1 12 2ZM12 5.6Q12.6 8.4 15.4 9Q12.6 9.6 12 12.4Q11.4 9.6 8.6 9Q11.4 8.4 12 5.6Z") + solid("M9 18.5h6v1.6H9ZM10 21h4v1.4h-4Z"));
        default:
            return svg(solid(ringPath(12, 12, 10)));
    }
}

/** Les types de blocs, dans l'ordre de la charte */
export const LESSON_BLOCK_TYPES = ["definition", "propriete", "theoreme", "remarque", "attention", "exemple"] as const;
