/**
 * Icône de chaque rang (par niveau), dans le style des badges Workyt : formes
 * pleines, sans trait. Un objet par rang, qui monte en importance dans son monde
 * (ex. Monde Médiéval : épée → bouclier → couronne ; 13 mondes, 39 rangs). Couleur du rang appliquée.
 * Sans hook : utilisable en composant serveur comme client.
 */

const ring = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
    `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const spark = (c: number, d: number, s: number, k = 0.22) => {
    const q = +(s * k).toFixed(2);
    return `M${c} ${d - s}Q${c + q} ${d - q} ${c + s} ${d}Q${c + q} ${d + q} ${c} ${d + s}Q${c - q} ${d + q} ${c - s} ${d}Q${c - q} ${d - q} ${c} ${d - s}Z`;
};

/** [tracé, évidé (evenodd) ?, transform ?] */
type Part = [string, boolean?, string?];

const FOX = "M3 4.5 8.25 9.4Q12 7.9 15.75 9.4L21 4.5 20.25 12.75Q18.75 18.75 12 21.4 5.25 18.75 3.75 12.75Z";
const FOX_EYES = `${ring(9, 13, 1.1)}${ring(15, 13, 1.1)}`;
const BULB = "M12 2a7 7 0 0 1 4.2 12.6V17H7.8v-2.4A7 7 0 0 1 12 2Z";

const RANK_GLYPHS: Record<number, Part[]> = {
    // Monde des Mangas : shuriken → kunaï → torii
    1: [[`M12 2Q15.2 8.8 22 12Q15.2 15.2 12 22Q8.8 15.2 2 12Q8.8 8.8 12 2Z${ring(12, 12, 2.2)}`, true]],
    2: [[`M12 1.5C14.6 5 15 9.5 12 14.5C9 9.5 9.4 5 12 1.5ZM11 15h2v3.6h-2Z${ring(12, 20.6, 1.9)}${ring(12, 20.6, 0.8)}`, true, "rotate(45 12 12)"]],
    3: [["M2 4.5Q12 7 22 4.5V7.3Q12 9.2 2 7.3ZM4.5 10h15v2h-15ZM6 7.5h2.4V22H6ZM15.6 7.5H18V22h-2.4Z"]],
    // Monde Français : crayon → livre ouvert → toque de diplômé
    4: [["M10 2h4v13.5h-4ZM10 16.3h4L12 21ZM10 4.6h4v1.1h-4Z", true, "rotate(45 12 12)"]],
    5: [["M2 5.5C5 4.5 8.5 4.8 11 6.5V20C8.5 18.5 5 18.3 2 19.2Z"], ["M22 5.5C19 4.5 15.5 4.8 13 6.5V20C15.5 18.5 19 18.3 22 19.2Z"]],
    6: [["M12 3 23 8l-11 5L1 8Z"], ["M5.5 10.5V15c0 1.8 3 3.5 6.5 3.5s6.5-1.7 6.5-3.5v-4.5L12 13.5Z"], [`M20.5 9h1.2v6.6h-1.2Z${ring(21.1, 17, 1.3)}`]],
    // Monde des Renards et Fées : patte → renard → renard sage (étoile)
    7: [["M12 11.5c3 0 5.5 3 5.5 5.5 0 2.2-2 3.2-5.5 3.2S6.5 19.2 6.5 17c0-2.5 2.5-5.5 5.5-5.5Z"], [`${ring(5.5, 10.5, 2)}${ring(9.3, 6.5, 2.1)}${ring(14.7, 6.5, 2.1)}${ring(18.5, 10.5, 2)}`]],
    8: [[`${FOX}${FOX_EYES}`, true]],
    9: [[`${FOX}${FOX_EYES}`, true, "translate(2.4 4) scale(0.8)"], [spark(12, 3.6, 2.5)]],
    // Monde Québécois : crosse et rondelle → canot → feuille d'érable
    10: [["M14.6 2h2.6l-3.8 16.2a2.2 2.2 0 0 1-2.1 1.8H4.2a1.6 1.6 0 0 1 0-3.2h6Z"], [ellipse(18.5, 19.5, 3.5, 1.7)]],
    11: [["M2 13h20c-1.5 4-5 6-10 6S3.5 17 2 13Z"], ["M16.3 2.4l1.7.6-3.6 9.2-1.7-.6Z"], ["M13.6 11.4c.9-.4 1.9 0 2.3.8l-.9 1.5h-2.6Z"]],
    12: [["M12 1.5l1.6 3.4 2-1-.6 4.4 3-2.8.8 1.8 2.7-.5-1 3.4 1.5 1-4.6 3.8.6 1.8-4.4-.8.2 5h-1.6l.2-5-4.4.8.6-1.8L2.2 11.9l1.5-1-1-3.4 2.7.5.8-1.8 3 2.8-.6-4.4 2 1Z"]],
    // Monde Égyptien : pyramide → parchemin → ânkh
    13: [["M12 3.5 22.5 20.5H1.5Z"], [ring(19.5, 4.5, 2)]],
    14: [["M6 4h12a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H5a2 2 0 0 1 0-4h1ZM8.5 9.5h6v1.4h-6ZM8.5 12.5h6v1.4h-6Z", true]],
    15: [["M12 2c2.6 0 4.2 2.2 4.2 4.8 0 2-1 3.6-2.4 4.7h7.2v2.6H13.4V22h-2.8v-7.9H3V11.5h7.2C8.8 10.4 7.8 8.8 7.8 6.8 7.8 4.2 9.4 2 12 2ZM12 4.6c-1.1 0-1.7 1-1.7 2.3 0 1.6.8 3 1.7 4 .9-1 1.7-2.4 1.7-4 0-1.3-.6-2.3-1.7-2.3Z", true]],
    // Monde des Neiges et des Sables : tente → boussole → drapeau planté
    16: [["M12 2.5 22 20.5H2ZM12 10.5 15.2 20.5H8.8Z", true]],
    17: [[`${ring(12, 12, 10)}${ring(12, 12, 7.6)}M12 5.5l2.2 6.5-2.2 6.5-2.2-6.5Z`, true]],
    18: [["M5 2h2v20H5Z"], ["M7 3.5h12.5l-3 4.2 3 4.3H7Z"]],
    // Monde de l'Imaginaire : lune → palette → planète
    19: [["M15 3.2A9 9 0 1 0 20.8 16 7.2 7.2 0 0 1 15 3.2Z"], [spark(19, 6, 2.8)]],
    20: [[`M12 2C6.5 2 2 6.2 2 11.5S6 21 11 21c1.6 0 2-1 1.6-2-.6-1.4.2-2.5 1.7-2.5H17c2.8 0 5-2 5-5C22 6 17.5 2 12 2Z${ring(7, 10.5, 1.6)}${ring(10, 6.5, 1.6)}${ring(15, 6.5, 1.6)}${ring(18, 10.5, 1.6)}`, true]],
    21: [[ring(12, 12, 5.6)], [`${ellipse(12, 12, 10.8, 3.8)}${ellipse(12, 12, 8.4, 2.2)}`, true, "rotate(-20 12 12)"]],
    // Monde Médiéval : épée → bouclier → couronne
    22: [[`M11 1.5h2l.6 13H10.4ZM6.5 14.5h11v2h-11ZM11 16.5h2v3.2h-2Z${ring(12, 21, 1.5)}`, false, "rotate(45 12 12)"]],
    23: [["M12 2 20.5 5v6.3c0 5.2-3.6 9-8.5 10.7C7.1 20.3 3.5 16.5 3.5 11.3V5ZM12 7.5l3.2 3v2.6L12 10.2l-3.2 2.9v-2.6Z", true]],
    24: [["M3 8l4.5 4L12 4.5 16.5 12 21 8l-1.8 10.5H4.8ZM4.8 19.6h14.4V22H4.8Z"], [`${ring(3, 7.2, 1.5)}${ring(12, 3.6, 1.6)}${ring(21, 7.2, 1.5)}`]],
    // Monde des Sciences : loupe → fiole → ampoule de génie
    25: [[`${ring(10, 10, 7.2)}${ring(10, 10, 4.6)}`, true], ["M14.6 16.4l1.8-1.8 5.4 5.4-1.8 1.8Z"]],
    26: [["M9 2h6v2h-1v5.2l5.6 9.3A2.3 2.3 0 0 1 17.6 22H6.4a2.3 2.3 0 0 1-2-3.5L10 9.2V4H9ZM11.6 4.2h.8v5.6l2.5 4.2H9.1l2.5-4.2Z", true]],
    27: [[`${BULB}${spark(12, 9, 3.2)}`, true], ["M9 18.5h6v1.6H9ZM10 21h4v1.4h-4Z"]],
    // Monde des Pirates : ancre → sabres croisés → gouvernail
    28: [
        [`${ring(12, 4.6, 2.6)}${ring(12, 4.6, 1.15)}`, true],
        ["M11 7h2v13h-2ZM7.5 9h9v2h-9Z"],
        ["M3.6 13.2c.2 4.7 3.9 8.3 8.4 8.3s8.2-3.6 8.4-8.3l-2.3 1.2c-.6 3.1-3.1 4.9-6.1 4.9s-5.5-1.8-6.1-4.9Z"],
        ["M3.6 13.2 1.8 16.4l3.6-.4ZM20.4 13.2l1.8 3.2-3.6-.4Z"],
    ],
    29: [
        [`M11.2 2.2c1.9 3.2 2.1 7.4 1.2 11.8h-2.2c.7-4.1.6-7.9-1-11.6ZM7.6 14h6.8v1.7H7.6ZM10.2 15.7h1.6v3.6h-1.6Z${ring(11, 20.4, 1.2)}`, false, "rotate(-38 12 12)"],
        [`M11.2 2.2c1.9 3.2 2.1 7.4 1.2 11.8h-2.2c.7-4.1.6-7.9-1-11.6ZM7.6 14h6.8v1.7H7.6ZM10.2 15.7h1.6v3.6h-1.6Z${ring(11, 20.4, 1.2)}`, false, "scale(-1 1) translate(-24 0) rotate(-38 12 12)"],
    ],
    30: [
        [`${ring(12, 12, 7)}${ring(12, 12, 5.2)}${ring(12, 12, 2.2)}`, true],
        ...[0, 45, 90, 135].map((a): Part => ["M11.25 2.2h1.5v19.6h-1.5Z", false, `rotate(${a} 12 12)`]),
        [[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return ring(+(12 + 9.6 * Math.sin(r)).toFixed(2), +(12 - 9.6 * Math.cos(r)).toFixed(2), 1.5);
        }).join("")],
    ],
    // Monde du Cosmos : fusée → casque d'astronaute → constellation
    31: [
        [`M12 2c3 2.4 4.5 6 4.5 10.4V16h-9v-3.6C7.5 8 9 4.4 12 2Z${ring(12, 9, 1.9)}`, true],
        ["M7.5 11.5 4.6 15v3l2.9-1.6ZM16.5 11.5l2.9 3.5v3l-2.9-1.6Z"],
        ["M9.8 17h4.4l-.6 2.8L12 22.2l-1.6-2.4Z"],
    ],
    32: [
        [`${ring(12, 11, 9)}M7.2 9.4A2.4 2.4 0 0 1 9.6 7h4.8a2.4 2.4 0 0 1 2.4 2.4v2.2a2.4 2.4 0 0 1-2.4 2.4H9.6a2.4 2.4 0 0 1-2.4-2.4Z`, true],
        ["M13.4 8.2h1.2a1 1 0 0 1 1 1v.6h-1.2a1 1 0 0 1-1-1Z"],
        ["M5.5 19.2h13a1.6 1.6 0 0 1 0 3.2h-13a1.6 1.6 0 0 1 0-3.2Z"],
    ],
    33: [
        [spark(12, 12, 7.2)],
        [`${spark(4.6, 5, 2.4)}${spark(19.6, 5.4, 2.1)}${spark(18.6, 19.4, 2.4)}${spark(5, 18.6, 1.9)}`],
    ],
    // Monde des Vikings : casque à cornes → hache → drakkar
    34: [
        [`M5 15a7 7 0 0 1 14 0ZM4 15h16v2.8H4Z${ring(7.5, 16.4, 0.7)}${ring(12, 16.4, 0.7)}${ring(16.5, 16.4, 0.7)}`, true],
        ["M11 17.8h2v3.4l-1 1.2-1-1.2Z"],
        ["M5.6 12.4C3 11.4 1.7 8.8 2.1 5.2c1 2.4 2.7 3.8 4.8 4.4ZM18.4 12.4c2.6-1 3.9-3.6 3.5-7.2-1 2.4-2.7 3.8-4.8 4.4Z"],
    ],
    35: [
        ["M11 2.2h2.1v19.6H11Z", false, "rotate(28 12 12)"],
        ["M13.1 2.6c4.4.2 7.6 3.4 7.6 8.2-3.2-.8-5.8.2-7.6 2.4ZM11 4.4 7.8 6.2 11 8Z", false, "rotate(28 12 12)"],
    ],
    36: [
        ["M1.8 14.6h20.4l-2.6 4.6H4.4Z" + ring(6.2, 16.8, 0.95) + ring(10, 16.8, 0.95) + ring(13.8, 16.8, 0.95) + ring(17.6, 16.8, 0.95), true],
        ["M1.8 14.6c-.6-3 .4-5.2 2.6-5.8.6 1.7 0 3.4-1.1 4.1Z"],
        ["M11.3 1.8h1.4v12.8h-1.4Z"],
        ["M6.6 3.6h10.8l-1.1 8.6H7.7ZM7.4 6.6h9.2v1.4H7.4Z", true],
    ],
    // Monde des Anciens : foudre → baguette d'archimage → infini
    37: [["M13.5 2 4.5 13.5h6L9 22l10.5-12.5h-6.2Z"]],
    38: [["M3.2 19.4 14.6 8l1.4 1.4L4.6 20.8Z"], [spark(18, 5.5, 4)], [`${spark(8, 4.5, 1.8)}${spark(20, 13.5, 1.8)}`]],
    39: [["M7 7.5c2.4 0 3.8 2 5 3.6 1.2-1.6 2.6-3.6 5-3.6 2.6 0 4.5 2 4.5 4.5S19.6 16.5 17 16.5c-2.4 0-3.8-2-5-3.6-1.2 1.6-2.6 3.6-5 3.6-2.6 0-4.5-2-4.5-4.5S4.4 7.5 7 7.5ZM7 10c-1.2 0-2 .9-2 2s.8 2 2 2c1.2 0 2.2-1.1 3.4-2C9.2 11 8.2 10 7 10ZM17 10c1.2 0 2 .9 2 2s-.8 2-2 2c-1.2 0-2.2-1.1-3.4-2 1.2-1 2.2-2 3.4-2Z", true]],
};

interface Props {
    level: number;
    color?: string;
    size?: number;
    className?: string;
}

export default function RankIcon({ level, color, size = 16, className = "" }: Props) {
    const parts = RANK_GLYPHS[level] ?? [[spark(12, 12, 10)] as Part];
    return (
        <svg
            viewBox="1 1 22 22"
            width={size}
            height={size}
            fill={color ?? "currentColor"}
            aria-hidden="true"
            className={`shrink-0 ${className}`}
        >
            {parts.map(([d, holes, transform], i) => (
                <path key={i} d={d} fillRule={holes ? "evenodd" : undefined} transform={transform || undefined} />
            ))}
        </svg>
    );
}
