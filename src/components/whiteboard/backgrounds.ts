import type { Background, BackgroundKind, Rect } from "./types";

/**
 * Fonds du tableau, dessinés en coordonnées monde (le contexte est déjà
 * transformé). `scale` sert à garder des traits et des libellés lisibles
 * quel que soit le zoom.
 */

export interface BackgroundDef {
    kind: BackgroundKind;
    label: string;
    subjects: string[];
}

export const BACKGROUNDS: BackgroundDef[] = [
    { kind: "blank", label: "Blanc", subjects: ["Toutes"] },
    { kind: "grid", label: "Grands carreaux", subjects: ["Toutes"] },
    { kind: "smallGrid", label: "Petits carreaux", subjects: ["Maths", "Physique-chimie"] },
    { kind: "dots", label: "Points", subjects: ["Toutes"] },
    { kind: "seyes", label: "Seyès (cahier)", subjects: ["Français", "Langues", "Histoire-géo"] },
    { kind: "lines", label: "Lignes", subjects: ["Français", "Langues"] },
    { kind: "millimeter", label: "Millimétré", subjects: ["Physique-chimie", "Maths", "SVT"] },
    { kind: "axes", label: "Repère (abscisses, ordonnées)", subjects: ["Maths", "Physique-chimie", "SES"] },
    { kind: "trigo", label: "Cercle trigonométrique", subjects: ["Maths"] },
    { kind: "timeline", label: "Frise chronologique", subjects: ["Histoire-géo"] },
    { kind: "staff", label: "Portée (musique)", subjects: ["Musique"] },
];

export const DEFAULT_UNIT = 40;

const INK = "26,21,18";
const line = (a: number) => `rgba(${INK},${a})`;

function hLines(ctx: CanvasRenderingContext2D, v: Rect, step: number, offset = 0) {
    const start = Math.floor((v.y0 - offset) / step) * step + offset;
    ctx.beginPath();
    for (let y = start; y <= v.y1; y += step) {
        ctx.moveTo(v.x0, y);
        ctx.lineTo(v.x1, y);
    }
    ctx.stroke();
}
function vLines(ctx: CanvasRenderingContext2D, v: Rect, step: number, offset = 0) {
    const start = Math.floor((v.x0 - offset) / step) * step + offset;
    ctx.beginPath();
    for (let x = start; x <= v.x1; x += step) {
        ctx.moveTo(x, v.y0);
        ctx.lineTo(x, v.y1);
    }
    ctx.stroke();
}
function grid(ctx: CanvasRenderingContext2D, v: Rect, step: number, alpha: number, scale: number) {
    // Trop serré à l'écran : on n'encombre pas
    if (step * scale < 6) return;
    ctx.strokeStyle = line(alpha);
    ctx.lineWidth = 1 / scale;
    hLines(ctx, v, step);
    vLines(ctx, v, step);
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - 0.4), y - size * Math.sin(angle - 0.4));
    ctx.lineTo(x - size * Math.cos(angle + 0.4), y - size * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
}

/** 0,5 → « 0,5 » ; 2 → « 2 » (écriture française) */
export const frNumber = (n: number) => (Math.round(n * 1000) / 1000).toString().replace(".", ",").replace("-", "−");

function niceStep(unitPx: number, scale: number) {
    // Une graduation libellée tous les ~40 px écran au minimum
    const candidates = [1, 2, 5, 10, 20, 50, 100];
    return candidates.find((k) => k * unitPx * scale >= 40) ?? 200;
}

function drawAxes(ctx: CanvasRenderingContext2D, v: Rect, scale: number, unit: number, font: string) {
    grid(ctx, v, unit / 5, 0.05, scale);
    grid(ctx, v, unit, 0.14, scale);
    ctx.strokeStyle = line(0.85);
    ctx.fillStyle = line(0.85);
    ctx.lineWidth = 1.6 / scale;
    ctx.beginPath();
    if (v.y0 < 0 && v.y1 > 0) {
        ctx.moveTo(v.x0, 0);
        ctx.lineTo(v.x1, 0);
    }
    if (v.x0 < 0 && v.x1 > 0) {
        ctx.moveTo(0, v.y1);
        ctx.lineTo(0, v.y0);
    }
    ctx.stroke();
    const head = 10 / scale;
    const fs = 12 / scale;
    ctx.font = `${fs}px ${font}`;
    if (v.y0 < 0 && v.y1 > 0) {
        arrowHead(ctx, v.x1 - 4 / scale, 0, 0, head);
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText("x", v.x1 - 8 / scale, -6 / scale);
    }
    if (v.x0 < 0 && v.x1 > 0) {
        arrowHead(ctx, 0, v.y0 + 4 / scale, -Math.PI / 2, head);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("y", 8 / scale, v.y0 + 6 / scale);
    }

    // Graduations et libellés
    const k = niceStep(unit, scale);
    const tick = 4 / scale;
    ctx.lineWidth = 1.2 / scale;
    ctx.beginPath();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xFrom = Math.ceil(v.x0 / unit / k) * k;
    for (let i = xFrom; i * unit <= v.x1; i += k) {
        if (i === 0) continue;
        const x = i * unit;
        ctx.moveTo(x, -tick);
        ctx.lineTo(x, tick);
        const ly = Math.min(Math.max(6 / scale, v.y0 + 4 / scale), v.y1 - fs - 4 / scale);
        ctx.fillText(frNumber(i), x, ly);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yFrom = Math.ceil(v.y0 / unit / k) * k;
    for (let j = yFrom; j * unit <= v.y1; j += k) {
        if (j === 0) continue;
        const y = j * unit;
        ctx.moveTo(-tick, y);
        ctx.lineTo(tick, y);
        const lx = Math.max(Math.min(-6 / scale, v.x1 - 4 / scale), v.x0 + 30 / scale);
        ctx.fillText(frNumber(-j), lx, y);
    }
    ctx.stroke();
    if (v.x0 < 0 && v.x1 > 0 && v.y0 < 0 && v.y1 > 0) {
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("O", -5 / scale, 5 / scale);
    }
}

const TRIGO_ANGLES: [number, string][] = [
    [0, "0"], [Math.PI / 6, "π/6"], [Math.PI / 4, "π/4"], [Math.PI / 3, "π/3"], [Math.PI / 2, "π/2"],
    [(2 * Math.PI) / 3, "2π/3"], [(3 * Math.PI) / 4, "3π/4"], [(5 * Math.PI) / 6, "5π/6"], [Math.PI, "π"],
    [(-5 * Math.PI) / 6, "−5π/6"], [(-3 * Math.PI) / 4, "−3π/4"], [(-2 * Math.PI) / 3, "−2π/3"],
    [-Math.PI / 2, "−π/2"], [-Math.PI / 3, "−π/3"], [-Math.PI / 4, "−π/4"], [-Math.PI / 6, "−π/6"],
];

function drawTrigo(ctx: CanvasRenderingContext2D, v: Rect, scale: number, font: string) {
    // Rayon 1 = 5 carreaux (200 px) : assez grand pour écrire dessus
    const unit = 200;
    grid(ctx, v, unit / 10, 0.06, scale);
    ctx.strokeStyle = line(0.85);
    ctx.fillStyle = line(0.85);
    ctx.lineWidth = 1.6 / scale;
    ctx.beginPath();
    ctx.moveTo(-unit * 1.35, 0);
    ctx.lineTo(unit * 1.35, 0);
    ctx.moveTo(0, unit * 1.35);
    ctx.lineTo(0, -unit * 1.35);
    ctx.stroke();
    arrowHead(ctx, unit * 1.35, 0, 0, 10 / scale);
    arrowHead(ctx, 0, -unit * 1.35, -Math.PI / 2, 10 / scale);
    ctx.lineWidth = 2 / scale;
    ctx.beginPath();
    ctx.arc(0, 0, unit, 0, Math.PI * 2);
    ctx.stroke();

    const fs = 13 / scale;
    ctx.font = `${fs}px ${font}`;
    ctx.lineWidth = 1 / scale;
    for (const [a, label] of TRIGO_ANGLES) {
        const x = Math.cos(a) * unit;
        const y = -Math.sin(a) * unit;
        ctx.strokeStyle = line(0.15);
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(x, y, 3 / scale, 0, Math.PI * 2);
        ctx.fill();
        const lx = Math.cos(a) * (unit + 22 / scale);
        const ly = -Math.sin(a) * (unit + 22 / scale);
        ctx.textAlign = Math.abs(Math.cos(a)) < 0.2 ? "center" : Math.cos(a) > 0 ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(label, lx, ly);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("1", unit + 4 / scale, 4 / scale);
    ctx.fillText("O", 4 / scale, 4 / scale);
    ctx.textBaseline = "bottom";
    ctx.fillText("1", 4 / scale, -unit - 4 / scale);
}

function drawTimeline(ctx: CanvasRenderingContext2D, v: Rect, scale: number, bg: Background, font: string) {
    const step = 80;
    const start = bg.timelineStart ?? 1900;
    const per = bg.timelineStep ?? 10;
    ctx.strokeStyle = line(0.85);
    ctx.fillStyle = line(0.85);
    ctx.lineWidth = 3 / scale;
    ctx.beginPath();
    ctx.moveTo(v.x0, 0);
    ctx.lineTo(v.x1, 0);
    ctx.stroke();
    arrowHead(ctx, v.x1 - 4 / scale, 0, 0, 14 / scale);
    ctx.lineWidth = 1.5 / scale;
    const fs = 12 / scale;
    ctx.font = `${fs}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const every = step * scale < 45 ? Math.ceil(45 / (step * scale)) : 1;
    ctx.beginPath();
    for (let i = Math.floor(v.x0 / step); i * step <= v.x1; i++) {
        const x = i * step;
        const major = i % every === 0;
        ctx.moveTo(x, major ? -8 / scale : -4 / scale);
        ctx.lineTo(x, major ? 8 / scale : 4 / scale);
        if (major) ctx.fillText(frNumber(start + i * per), x, 12 / scale);
    }
    ctx.stroke();
}

function drawStaff(ctx: CanvasRenderingContext2D, v: Rect, scale: number) {
    const gap = 10;
    const block = 140;
    ctx.strokeStyle = line(0.55);
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (let b = Math.floor(v.y0 / block) * block; b <= v.y1; b += block) {
        for (let l = 0; l < 5; l++) {
            const y = b + 50 + l * gap;
            ctx.moveTo(v.x0, y);
            ctx.lineTo(v.x1, y);
        }
    }
    ctx.stroke();
}

export function drawBackground(ctx: CanvasRenderingContext2D, bg: Background, v: Rect, scale: number, font: string) {
    switch (bg.kind) {
        case "blank":
            return;
        case "grid":
            return grid(ctx, v, 40, 0.1, scale);
        case "smallGrid":
            grid(ctx, v, 20, 0.07, scale);
            return grid(ctx, v, 100, 0.12, scale);
        case "dots": {
            if (20 * scale < 8) return;
            ctx.fillStyle = line(0.25);
            const r = 1.4 / scale;
            for (let x = Math.floor(v.x0 / 20) * 20; x <= v.x1; x += 20) {
                for (let y = Math.floor(v.y0 / 20) * 20; y <= v.y1; y += 20) ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }
            return;
        }
        case "millimeter":
            ctx.save();
            ctx.globalAlpha = 1;
            grid(ctx, v, 4, 0.05, scale);
            grid(ctx, v, 20, 0.1, scale);
            grid(ctx, v, 40, 0.18, scale);
            ctx.restore();
            return;
        case "seyes":
            // Cahier français : interligne de 8 px, ligne forte tous les 32 px, marge rouge
            ctx.lineWidth = 1 / scale;
            if (8 * scale >= 4) {
                ctx.strokeStyle = "rgba(110,140,220,0.22)";
                hLines(ctx, v, 8);
            }
            ctx.strokeStyle = "rgba(90,110,200,0.5)";
            hLines(ctx, v, 32);
            ctx.strokeStyle = "rgba(90,110,200,0.32)";
            vLines(ctx, v, 32);
            if (v.x0 < 0 && v.x1 > 0) {
                ctx.strokeStyle = "rgba(220,60,60,0.7)";
                ctx.lineWidth = 1.5 / scale;
                ctx.beginPath();
                ctx.moveTo(0, v.y0);
                ctx.lineTo(0, v.y1);
                ctx.stroke();
            }
            return;
        case "lines":
            ctx.strokeStyle = "rgba(110,140,220,0.4)";
            ctx.lineWidth = 1 / scale;
            return hLines(ctx, v, 36);
        case "axes":
            return drawAxes(ctx, v, scale, bg.unit || DEFAULT_UNIT, font);
        case "trigo":
            return drawTrigo(ctx, v, scale, font);
        case "timeline":
            return drawTimeline(ctx, v, scale, bg, font);
        case "staff":
            return drawStaff(ctx, v, scale);
    }
}

/** Zone que l'export doit au moins couvrir pour que le fond ait un sens */
export function backgroundAnchor(bg: Background): Rect | null {
    switch (bg.kind) {
        case "axes":
            return { x0: -60, y0: -60, x1: 60, y1: 60 };
        case "trigo":
            return { x0: -300, y0: -300, x1: 300, y1: 300 };
        case "timeline":
            return { x0: -40, y0: -30, x1: 40, y1: 40 };
        default:
            return null;
    }
}
