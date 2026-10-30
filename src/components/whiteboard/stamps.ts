/**
 * Bibliothèque de symboles par matière : on clique sur un symbole puis sur le
 * tableau pour le poser. Chaque symbole est dessiné en traits (aucune image à
 * charger) dans une boîte w × h, centrée sur le point cliqué.
 *
 * Les composants électriques ont leurs bornes à gauche et à droite, à
 * mi-hauteur : on les relie ensuite avec l'outil « ligne ».
 */

type Draw = (ctx: CanvasRenderingContext2D, font: string) => void;

export interface StampDef {
    name: string;
    label: string;
    w: number;
    h: number;
    draw: Draw;
}

export interface StampGroup {
    subject: string;
    title: string;
    stamps: StampDef[];
}

const path = (ctx: CanvasRenderingContext2D, pts: [number, number][], close = false) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
    ctx.stroke();
};
const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill = false) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) ctx.fill();
    else ctx.stroke();
};
const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, font: string) => {
    ctx.font = `600 ${size}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
};
/** Dipôle : fils de 0 à a et de b à 80, à mi-hauteur (y = 20) */
const leads = (ctx: CanvasRenderingContext2D, a: number, b: number) => {
    path(ctx, [[0, 20], [a, 20]]);
    path(ctx, [[b, 20], [80, 20]]);
};
const meter = (letter: string): Draw => (ctx, font) => {
    leads(ctx, 24, 56);
    circle(ctx, 40, 20, 16);
    label(ctx, letter, 40, 21, 16, font);
};

const CIRCUITS: StampDef[] = [
    {
        name: "pile", label: "Pile / générateur", w: 80, h: 40,
        draw: (ctx, font) => {
            leads(ctx, 34, 46);
            path(ctx, [[34, 4], [34, 36]]);
            ctx.save();
            ctx.lineWidth *= 2.2;
            path(ctx, [[46, 12], [46, 28]]);
            ctx.restore();
            label(ctx, "+", 28, 6, 11, font);
            label(ctx, "−", 53, 6, 11, font);
        },
    },
    { name: "resistance", label: "Résistance", w: 80, h: 40, draw: (ctx) => { leads(ctx, 20, 60); ctx.strokeRect(20, 12, 40, 16); } },
    {
        name: "lampe", label: "Lampe", w: 80, h: 40,
        draw: (ctx) => {
            leads(ctx, 24, 56);
            circle(ctx, 40, 20, 16);
            path(ctx, [[28.7, 8.7], [51.3, 31.3]]);
            path(ctx, [[51.3, 8.7], [28.7, 31.3]]);
        },
    },
    {
        name: "interrupteur-ouvert", label: "Interrupteur ouvert", w: 80, h: 40,
        draw: (ctx) => {
            leads(ctx, 24, 56);
            path(ctx, [[24, 20], [54, 6]]);
            circle(ctx, 24, 20, 2, true);
            circle(ctx, 56, 20, 2, true);
        },
    },
    {
        name: "interrupteur-ferme", label: "Interrupteur fermé", w: 80, h: 40,
        draw: (ctx) => {
            leads(ctx, 24, 56);
            path(ctx, [[24, 20], [56, 20]]);
            circle(ctx, 24, 20, 2, true);
            circle(ctx, 56, 20, 2, true);
        },
    },
    {
        name: "diode", label: "Diode", w: 80, h: 40,
        draw: (ctx) => {
            leads(ctx, 28, 52);
            path(ctx, [[28, 8], [52, 20], [28, 32]], true);
            path(ctx, [[52, 8], [52, 32]]);
        },
    },
    {
        name: "del", label: "DEL", w: 80, h: 40,
        draw: (ctx) => {
            leads(ctx, 28, 52);
            path(ctx, [[28, 8], [52, 20], [28, 32]], true);
            path(ctx, [[52, 8], [52, 32]]);
            path(ctx, [[44, 6], [52, -2]]);
            path(ctx, [[50, 10], [58, 2]]);
        },
    },
    { name: "moteur", label: "Moteur", w: 80, h: 40, draw: meter("M") },
    { name: "amperemetre", label: "Ampèremètre", w: 80, h: 40, draw: meter("A") },
    { name: "voltmetre", label: "Voltmètre", w: 80, h: 40, draw: meter("V") },
    {
        name: "condensateur", label: "Condensateur", w: 80, h: 40,
        draw: (ctx) => {
            leads(ctx, 35, 45);
            path(ctx, [[35, 6], [35, 34]]);
            path(ctx, [[45, 6], [45, 34]]);
        },
    },
    { name: "noeud", label: "Nœud", w: 20, h: 20, draw: (ctx) => circle(ctx, 10, 10, 4, true) },
];

const VERRERIE: StampDef[] = [
    {
        name: "becher", label: "Bécher", w: 70, h: 90,
        draw: (ctx) => {
            path(ctx, [[6, 4], [12, 10], [12, 86], [64, 86], [64, 10], [68, 4]]);
            for (let y = 30; y <= 70; y += 20) path(ctx, [[12, y], [24, y]]);
        },
    },
    {
        name: "erlenmeyer", label: "Erlenmeyer", w: 80, h: 100,
        draw: (ctx) => path(ctx, [[30, 4], [30, 36], [4, 94], [76, 94], [50, 36], [50, 4]]),
    },
    {
        name: "ballon", label: "Ballon", w: 80, h: 100,
        draw: (ctx) => {
            ctx.beginPath();
            ctx.moveTo(32, 4);
            ctx.lineTo(32, 36);
            ctx.arc(40, 66, 30, -Math.PI / 2 - 0.27, -Math.PI / 2 + 0.27, true);
            ctx.lineTo(48, 4);
            ctx.stroke();
        },
    },
    {
        name: "tube", label: "Tube à essai", w: 30, h: 100,
        draw: (ctx) => {
            ctx.beginPath();
            ctx.moveTo(4, 4);
            ctx.lineTo(4, 84);
            ctx.arc(15, 84, 11, Math.PI, 0, true);
            ctx.lineTo(26, 4);
            ctx.stroke();
        },
    },
    {
        name: "eprouvette", label: "Éprouvette graduée", w: 40, h: 110,
        draw: (ctx) => {
            path(ctx, [[10, 4], [10, 96], [30, 96], [30, 4]]);
            path(ctx, [[2, 106], [38, 106], [30, 96]]);
            path(ctx, [[10, 96], [2, 106]]);
            for (let y = 16; y < 92; y += 12) path(ctx, [[10, y], [18, y]]);
        },
    },
    {
        name: "burette", label: "Burette", w: 30, h: 130,
        draw: (ctx) => {
            path(ctx, [[8, 4], [8, 100], [15, 112], [22, 100], [22, 4]]);
            path(ctx, [[15, 112], [15, 126]]);
            path(ctx, [[6, 106], [24, 106]]);
            for (let y = 14; y < 96; y += 10) path(ctx, [[8, y], [14, y]]);
        },
    },
    {
        name: "entonnoir", label: "Entonnoir", w: 70, h: 80,
        draw: (ctx) => path(ctx, [[4, 4], [66, 4], [40, 44], [40, 76], [30, 76], [30, 44]], true),
    },
    {
        name: "bec-bunsen", label: "Bec Bunsen", w: 50, h: 90,
        draw: (ctx) => {
            path(ctx, [[18, 30], [18, 76], [32, 76], [32, 30]]);
            path(ctx, [[6, 86], [44, 86], [44, 76], [6, 76]], true);
            ctx.beginPath();
            ctx.moveTo(25, 28);
            ctx.quadraticCurveTo(10, 14, 25, 2);
            ctx.quadraticCurveTo(40, 14, 25, 28);
            ctx.stroke();
        },
    },
];

function hexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) pts.push([cx + r * Math.cos(Math.PI / 6 + (i * Math.PI) / 3), cy + r * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)]);
    path(ctx, pts, true);
}

const MOLECULES: StampDef[] = [
    { name: "benzene", label: "Cycle benzénique", w: 80, h: 80, draw: (ctx) => { hexagon(ctx, 40, 40, 34); circle(ctx, 40, 40, 20); } },
    { name: "cyclohexane", label: "Cycle à 6", w: 80, h: 80, draw: (ctx) => hexagon(ctx, 40, 40, 34) },
    { name: "liaison-simple", label: "Liaison simple", w: 60, h: 20, draw: (ctx) => path(ctx, [[4, 10], [56, 10]]) },
    {
        name: "liaison-double", label: "Liaison double", w: 60, h: 20,
        draw: (ctx) => { path(ctx, [[4, 6], [56, 6]]); path(ctx, [[4, 14], [56, 14]]); },
    },
    {
        name: "liaison-triple", label: "Liaison triple", w: 60, h: 24,
        draw: (ctx) => { path(ctx, [[4, 4], [56, 4]]); path(ctx, [[4, 12], [56, 12]]); path(ctx, [[4, 20], [56, 20]]); },
    },
    {
        name: "equilibre", label: "Équilibre ⇌", w: 70, h: 24,
        draw: (ctx) => {
            path(ctx, [[4, 8], [66, 8], [56, 2]]);
            path(ctx, [[66, 16], [4, 16], [14, 22]]);
        },
    },
    {
        name: "zigzag", label: "Chaîne carbonée", w: 120, h: 40,
        draw: (ctx) => path(ctx, [[4, 32], [32, 8], [60, 32], [88, 8], [116, 32]]),
    },
];

const SVT: StampDef[] = [
    {
        name: "cellule-animale", label: "Cellule animale", w: 120, h: 90,
        draw: (ctx) => {
            ctx.beginPath();
            ctx.ellipse(60, 45, 56, 41, 0, 0, Math.PI * 2);
            ctx.stroke();
            circle(ctx, 66, 42, 15);
            circle(ctx, 68, 40, 4, true);
        },
    },
    {
        name: "cellule-vegetale", label: "Cellule végétale", w: 130, h: 90,
        draw: (ctx) => {
            ctx.strokeRect(4, 4, 122, 82);
            ctx.strokeRect(10, 10, 110, 70);
            ctx.beginPath();
            ctx.ellipse(55, 45, 30, 22, 0, 0, Math.PI * 2);
            ctx.stroke();
            circle(ctx, 102, 30, 10);
        },
    },
    {
        name: "neurone", label: "Neurone", w: 150, h: 70,
        draw: (ctx) => {
            circle(ctx, 30, 35, 16);
            path(ctx, [[16, 26], [4, 12]]);
            path(ctx, [[16, 44], [4, 58]]);
            path(ctx, [[30, 19], [30, 4]]);
            path(ctx, [[46, 35], [130, 35]]);
            path(ctx, [[130, 35], [146, 22]]);
            path(ctx, [[130, 35], [146, 48]]);
            path(ctx, [[130, 35], [148, 35]]);
        },
    },
    {
        name: "adn", label: "ADN (double hélice)", w: 60, h: 140,
        draw: (ctx) => {
            ctx.beginPath();
            for (let y = 0; y <= 136; y += 2) {
                const x = 30 + 24 * Math.sin((y / 136) * Math.PI * 3);
                if (y === 0) ctx.moveTo(x, y + 2);
                else ctx.lineTo(x, y + 2);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let y = 0; y <= 136; y += 2) {
                const x = 30 - 24 * Math.sin((y / 136) * Math.PI * 3);
                if (y === 0) ctx.moveTo(x, y + 2);
                else ctx.lineTo(x, y + 2);
            }
            ctx.stroke();
            for (let y = 10; y < 136; y += 12) {
                const d = 24 * Math.sin((y / 136) * Math.PI * 3);
                path(ctx, [[30 - d, y + 2], [30 + d, y + 2]]);
            }
        },
    },
];

const GEOMETRIE: StampDef[] = [
    {
        name: "rapporteur", label: "Rapporteur", w: 200, h: 110,
        draw: (ctx, font) => {
            ctx.beginPath();
            ctx.arc(100, 104, 96, Math.PI, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.font = `8px ${font}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let d = 0; d <= 180; d += 10) {
                const a = Math.PI - (d * Math.PI) / 180;
                const long = d % 30 === 0;
                path(ctx, [[100 + 96 * Math.cos(a), 104 - 96 * Math.sin(a)], [100 + (long ? 82 : 88) * Math.cos(a), 104 - (long ? 82 : 88) * Math.sin(a)]]);
                if (long) ctx.fillText(String(d), 100 + 72 * Math.cos(a), 104 - 72 * Math.sin(a));
            }
            circle(ctx, 100, 104, 2, true);
        },
    },
    {
        name: "angle-droit", label: "Angle droit", w: 20, h: 20,
        draw: (ctx) => path(ctx, [[2, 4], [16, 4], [16, 18]]),
    },
    {
        name: "triangle-rectangle", label: "Triangle rectangle", w: 120, h: 90,
        draw: (ctx) => {
            path(ctx, [[6, 84], [114, 84], [6, 6]], true);
            path(ctx, [[6, 70], [20, 70], [20, 84]]);
        },
    },
    {
        name: "codage-egal", label: "Codage longueurs égales", w: 20, h: 24,
        draw: (ctx) => { path(ctx, [[7, 2], [7, 22]]); path(ctx, [[13, 2], [13, 22]]); },
    },
    {
        name: "cube", label: "Cube (perspective)", w: 110, h: 110,
        draw: (ctx) => {
            ctx.strokeRect(6, 34, 70, 70);
            path(ctx, [[6, 34], [40, 6], [104, 6], [76, 34]]);
            path(ctx, [[104, 6], [104, 76], [76, 104]]);
            ctx.save();
            ctx.setLineDash([5, 4]);
            path(ctx, [[6, 104], [40, 76], [104, 76]]);
            path(ctx, [[40, 76], [40, 6]]);
            ctx.restore();
        },
    },
];

const GEO: StampDef[] = [
    {
        name: "rose-des-vents", label: "Rose des vents", w: 110, h: 110,
        draw: (ctx, font) => {
            const c = 55;
            path(ctx, [[c, 14], [c + 8, c - 8], [c, c], [c - 8, c - 8]], true);
            path(ctx, [[c, 96], [c + 8, c + 8], [c, c], [c - 8, c + 8]], true);
            path(ctx, [[14, c], [c - 8, c - 8], [c, c], [c - 8, c + 8]], true);
            path(ctx, [[96, c], [c + 8, c - 8], [c, c], [c + 8, c + 8]], true);
            label(ctx, "N", c, 6, 11, font);
            label(ctx, "S", c, 104, 11, font);
            label(ctx, "O", 6, c, 11, font);
            label(ctx, "E", 104, c, 11, font);
        },
    },
    {
        name: "echelle", label: "Échelle", w: 120, h: 30,
        draw: (ctx, font) => {
            path(ctx, [[4, 20], [116, 20]]);
            for (let x = 4; x <= 116; x += 28) path(ctx, [[x, 14], [x, 26]]);
            label(ctx, "0", 4, 6, 9, font);
            label(ctx, "… km", 116, 6, 9, font);
        },
    },
    {
        name: "fleche-courbe", label: "Flux (flèche courbe)", w: 120, h: 50,
        draw: (ctx) => {
            ctx.beginPath();
            ctx.moveTo(4, 44);
            ctx.quadraticCurveTo(60, -8, 112, 30);
            ctx.stroke();
            path(ctx, [[100, 22], [114, 32], [98, 36]]);
        },
    },
];

export const STAMP_GROUPS: StampGroup[] = [
    { subject: "Physique-chimie", title: "Circuits électriques", stamps: CIRCUITS },
    { subject: "Physique-chimie", title: "Verrerie de labo", stamps: VERRERIE },
    { subject: "Physique-chimie", title: "Molécules", stamps: MOLECULES },
    { subject: "Maths", title: "Géométrie", stamps: GEOMETRIE },
    { subject: "SVT", title: "SVT", stamps: SVT },
    { subject: "Histoire-géo", title: "Géographie", stamps: GEO },
];

const ALL = new Map(STAMP_GROUPS.flatMap((g) => g.stamps).map((s) => [s.name, s]));
export const getStamp = (name: string) => ALL.get(name);
