import React from "react";

/**
 * Icônes de matière dans le style des badges Workyt : formes pleines, sans trait.
 * Elles prennent la couleur du texte (currentColor), comme les icônes Lucide
 * qu'elles remplacent, et acceptent les mêmes props (className, size).
 * Sans hook : utilisables en composant serveur comme client.
 */

export type SubjectGlyphKind =
    | "livre" | "maths" | "globe" | "feuille" | "fiole" | "puce" | "langues" | "ampoule"
    | "barres" | "code" | "palette" | "musique" | "halteres" | "rouage" | "temple" | "balance"
    | "cellule" | "montagne" | "colonne" | "citoyens";

const circle = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** Chaque entrée : liste de [tracé, évidé ?]. Un tracé évidé utilise evenodd pour ses trous. */
const GLYPHS: Record<SubjectGlyphKind, [string, boolean?][]> = {
    // Français : un livre ouvert
    livre: [["M2 5.5C5 4.5 8.5 4.8 11 6.5V20C8.5 18.5 5 18.3 2 19.2Z"], ["M22 5.5C19 4.5 15.5 4.8 13 6.5V20C15.5 18.5 19 18.3 22 19.2Z"]],
    // Mathématiques : plus, moins, fois, égal
    maths: [
        ["M6 3h2v3h3v2H8v3H6V8H3V6h3Z"],
        ["M13 6h8v2h-8Z"],
        ["M15.6 12.9l1.4 1.4 1.4-1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4 1.4-1.4-1.4-1.4Z"],
        ["M3 14h8v2H3ZM3 18h8v2H3Z"],
    ],
    // Histoire-Géographie : un globe
    globe: [[`${circle(12, 12, 10)}M12 2.6c-2.4 2.5-3.6 5.6-3.6 9.4s1.2 6.9 3.6 9.4c2.4-2.5 3.6-5.6 3.6-9.4S14.4 5.1 12 2.6ZM12 5c-1.5 2-2.2 4.3-2.2 7s.7 5 2.2 7c1.5-2 2.2-4.3 2.2-7S13.5 7 12 5ZM2.4 11.2h19.2v1.6H2.4Z`, true]],
    // SVT : une feuille et sa nervure
    feuille: [["M4 20C4 10 10 4 20 4C20 14 14 20 4 20ZM6.4 18.6l.9.9L17.9 8.9 17 8Z", true]],
    // Physique-Chimie : une fiole à moitié pleine
    fiole: [["M9 2h6v2h-1v5.2l5.6 9.3A2.3 2.3 0 0 1 17.6 22H6.4a2.3 2.3 0 0 1-2-3.5L10 9.2V4H9ZM11.6 4.2h.8v5.6l2.5 4.2H9.1l2.5-4.2Z", true]],
    // Technologie : une puce
    puce: [
        ["M8.5 6.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM10 10v4h4v-4Z", true],
        ["M9 2.5h2v3H9ZM13 2.5h2v3h-2ZM9 18.5h2v3H9ZM13 18.5h2v3h-2ZM2.5 9h3v2h-3ZM2.5 13h3v2h-3ZM18.5 9h3v2h-3ZM18.5 13h3v2h-3Z"],
    ],
    // Langues : deux bulles qui se répondent
    langues: [
        ["M2 4.5A2.5 2.5 0 0 1 4.5 2h6A2.5 2.5 0 0 1 13 4.5v3A2.5 2.5 0 0 1 10.5 10H5l-3 2.5Z"],
        ["M22 14a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h5l4 3Z"],
    ],
    // Philosophie, HLP : une ampoule
    ampoule: [["M12 2a7 7 0 0 1 4.2 12.6V17H7.8v-2.4A7 7 0 0 1 12 2Z"], ["M9 18.5h6v1.6H9ZM10 21h4v1.4h-4Z"]],
    // Économie, SES, Management : des barres qui montent
    barres: [["M3 14h4v7H3ZM10 9h4v12h-4ZM17 4h4v17h-4Z"]],
    // Informatique, NSI : </>
    code: [["M8.5 6.5 3 12l5.5 5.5 1.4-1.4L5.8 12l4.1-4.1ZM15.5 6.5 21 12l-5.5 5.5-1.4-1.4 4.1-4.1-4.1-4.1ZM13.4 4.6l1.7.5-4.5 14.3-1.7-.5Z"]],
    // Arts plastiques : une palette
    palette: [[`M12 2C6.5 2 2 6.2 2 11.5S6 21 11 21c1.6 0 2-1 1.6-2-.6-1.4.2-2.5 1.7-2.5H17c2.8 0 5-2 5-5C22 6 17.5 2 12 2Z${circle(7, 10.5, 1.6)}${circle(10, 6.5, 1.6)}${circle(15, 6.5, 1.6)}${circle(18, 10.5, 1.6)}`, true]],
    // Éducation musicale : deux croches
    musique: [[circle(7, 18, 3.2)], [circle(17, 16, 3.2)], ["M8.2 5h2v13h-2ZM18.2 3h2v13h-2Z"], ["M8.2 4.6 20.2 2.4v3.2L8.2 7.8Z"]],
    // EPS : un haltère
    halteres: [["M7 11h10v2H7Z"], ["M2.5 8h3v8h-3ZM5.5 6.5H8v11H5.5ZM18.5 8h3v8h-3ZM16 6.5h2.5v11H16Z"]],
    // SI : un rouage
    rouage: [
        [`${circle(12, 12, 6.8)}${circle(12, 12, 2.8)}`, true],
        ...[0, 45, 90, 135, 180, 225, 270, 315].map((a): [string] => {
            const r = (a * Math.PI) / 180, cx = 12 + 8.2 * Math.sin(r), cy = 12 - 8.2 * Math.cos(r);
            return [circle(+cx.toFixed(2), +cy.toFixed(2), 1.9)];
        }),
    ],
    // HGGSP : un temple
    temple: [["M12 2 22 7.5H2ZM4 9h3v9H4ZM10.5 9h3v9h-3ZM17 9h3v9h-3ZM2 19.5h20V22H2Z"]],
    // Droit : une balance
    balance: [["M11 4h2v15h-2ZM6 20h12v2H6ZM3 6h18v2H3Z"], [circle(12, 3.5, 1.8)], ["M2 13.5a3.5 3.5 0 0 0 7 0ZM15 13.5a3.5 3.5 0 0 0 7 0Z"], ["M5 8h1l-2.6 5.5h-1ZM5.5 8h1l2.6 5.5h-1ZM17.5 8h1l-2.6 5.5h-1ZM18 8h1l2.6 5.5h-1Z"]],
    // Biologie : une cellule et son noyau
    cellule: [[`M12 2.5c5 0 9.5 3.6 9.5 9 0 5.3-4.2 10-9.8 10C6.4 21.5 2.5 17.6 2.5 12.3 2.5 6.6 7 2.5 12 2.5Z${circle(13.5, 10.5, 4)}${circle(13.5, 10.5, 1.7)}${circle(7.2, 15.2, 1.2)}${circle(8.6, 7.4, 0.9)}${circle(15.5, 17.2, 0.9)}`, true]],
    // Géologie : des montagnes
    montagne: [["M2 20 9 7l4 7 2.5-4L22 20Z"]],
    // Latin / Grec : une colonne antique
    colonne: [["M4 3h16v3H4ZM6.5 7h11v1.5h-11ZM7.5 9.5h2v9h-2ZM11 9.5h2v9h-2ZM14.5 9.5h2v9h-2ZM4 19.5h16V22H4Z"]],
    // EMC : des citoyens
    citoyens: [[circle(8, 7.5, 3.2)], [circle(16.5, 8, 2.8)], ["M2 20c0-4 2.7-6.5 6-6.5s6 2.5 6 6.5Z"], ["M15.2 20c0-2.4-.6-4.3-1.7-5.6.9-.6 2-.9 3.2-.9 3 0 5.3 2.3 5.3 6.5Z"]],
};

export type SubjectGlyphComponent = (props: { className?: string; size?: number | string }) => React.ReactElement;

/** Fabrique un composant d'icône (même usage qu'une icône Lucide) */
export function subjectGlyph(kind: SubjectGlyphKind): SubjectGlyphComponent {
    function Glyph({ className, size = 24 }: { className?: string; size?: number | string }) {
        return (
            <svg viewBox="1 1 22 22" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
                {GLYPHS[kind].map(([d, holes], i) => (
                    <path key={i} d={d} fillRule={holes ? "evenodd" : undefined} />
                ))}
            </svg>
        );
    }
    Glyph.displayName = `SubjectGlyph(${kind})`;
    return Glyph;
}
