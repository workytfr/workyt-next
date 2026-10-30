import type { Background, BoardElement, Rect } from "./types";
import { compileExpression } from "./mathExpr";
import { getStamp } from "./stamps";
import { DEFAULT_UNIT } from "./backgrounds";

/** Images importées : décodées une fois, réutilisées à chaque image */
const imageCache = new Map<string, HTMLImageElement>();
/** Courbes : compilées une fois par expression */
const exprCache = new Map<string, ((x: number) => number) | null>();

export function loadImage(src: string, onLoad: () => void): HTMLImageElement {
    let img = imageCache.get(src);
    if (!img) {
        img = new Image();
        img.onload = onLoad;
        img.src = src;
        imageCache.set(src, img);
    }
    return img;
}

function compiled(expr: string) {
    if (!exprCache.has(expr)) {
        try {
            exprCache.set(expr, compileExpression(expr));
        } catch {
            exprCache.set(expr, null);
        }
    }
    return exprCache.get(expr) ?? null;
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const size = Math.max(10, width * 4);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(a - 0.45), y2 - size * Math.sin(a - 0.45));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(a + 0.45), y2 - size * Math.sin(a + 0.45));
    ctx.stroke();
}

/** Trait à main levée : courbes lissées, épaisseur modulée par la pression */
function drawStroke(ctx: CanvasRenderingContext2D, pts: number[], width: number) {
    const n = pts.length / 3;
    if (n === 0) return;
    if (n === 1) {
        ctx.beginPath();
        ctx.arc(pts[0], pts[1], width / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
    }
    const w = (p: number) => width * (0.55 + 0.9 * (p || 0.5));
    let px = pts[0], py = pts[1];
    for (let i = 1; i < n; i++) {
        const x = pts[i * 3], y = pts[i * 3 + 1], p = pts[i * 3 + 2];
        const mx = i < n - 1 ? (x + pts[(i + 1) * 3]) / 2 : x;
        const my = i < n - 1 ? (y + pts[(i + 1) * 3 + 1]) / 2 : y;
        ctx.lineWidth = w(p);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(x, y, mx, my);
        ctx.stroke();
        px = mx;
        py = my;
    }
}

function drawPlot(ctx: CanvasRenderingContext2D, expr: string, view: Rect, scale: number, unit: number) {
    const f = compiled(expr);
    if (!f) return;
    const step = 1.5 / scale;
    const maxJump = (view.y1 - view.y0) * 2;
    ctx.beginPath();
    let pen = false;
    let lastY = 0;
    for (let x = view.x0; x <= view.x1 + step; x += step) {
        const y = -f(x / unit) * unit;
        if (!Number.isFinite(y) || Math.abs(y) > 1e6 || (pen && Math.abs(y - lastY) > maxJump)) {
            pen = false;
            continue;
        }
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
        lastY = y;
    }
    ctx.stroke();
}

export interface RenderEnv {
    view: Rect;
    scale: number;
    background: Background;
    font: string;
    onImageLoad: () => void;
}

export function drawElement(ctx: CanvasRenderingContext2D, el: BoardElement, env: RenderEnv) {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = el.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    switch (el.type) {
        case "stroke":
            if (el.highlighter) {
                ctx.globalAlpha = 0.35;
                ctx.globalCompositeOperation = "multiply";
                ctx.lineCap = "square";
            }
            drawStroke(ctx, el.points, el.highlighter ? el.width * 3 : el.width);
            break;
        case "line":
            ctx.beginPath();
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);
            ctx.stroke();
            break;
        case "arrow":
            ctx.beginPath();
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);
            ctx.stroke();
            arrow(ctx, el.x1, el.y1, el.x2, el.y2, el.width);
            break;
        case "rect":
            ctx.strokeRect(Math.min(el.x1, el.x2), Math.min(el.y1, el.y2), Math.abs(el.x2 - el.x1), Math.abs(el.y2 - el.y1));
            break;
        case "ellipse":
            ctx.beginPath();
            ctx.ellipse((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2, Math.abs(el.x2 - el.x1) / 2, Math.abs(el.y2 - el.y1) / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case "text": {
            ctx.font = `${el.math ? "italic " : ""}${el.size}px ${env.font}`;
            ctx.textBaseline = "top";
            el.text.split("\n").forEach((line, i) => ctx.fillText(line, el.x, el.y + i * el.size * 1.25));
            break;
        }
        case "point": {
            const r = Math.max(3, el.width * 1.5);
            ctx.lineWidth = Math.max(1.5, el.width * 0.8);
            ctx.beginPath();
            ctx.moveTo(el.x - r * 1.6, el.y - r * 1.6);
            ctx.lineTo(el.x + r * 1.6, el.y + r * 1.6);
            ctx.moveTo(el.x + r * 1.6, el.y - r * 1.6);
            ctx.lineTo(el.x - r * 1.6, el.y + r * 1.6);
            ctx.stroke();
            if (el.label) {
                ctx.font = `italic 18px ${env.font}`;
                ctx.textBaseline = "bottom";
                ctx.fillText(el.label, el.x + r * 2, el.y - r * 1.2);
            }
            break;
        }
        case "stamp": {
            const def = getStamp(el.name);
            if (!def) break;
            ctx.translate(el.x - (def.w * el.scale) / 2, el.y - (def.h * el.scale) / 2);
            ctx.scale(el.scale, el.scale);
            ctx.lineWidth = el.width / el.scale;
            def.draw(ctx, env.font);
            break;
        }
        case "plot":
            drawPlot(ctx, el.expr, env.view, env.scale, env.background.unit || DEFAULT_UNIT);
            break;
        case "image": {
            const img = loadImage(el.src, env.onImageLoad);
            if (img.complete && img.naturalWidth) ctx.drawImage(img, el.x, el.y, el.w, el.h);
            else {
                ctx.strokeStyle = "rgba(26,21,18,0.2)";
                ctx.strokeRect(el.x, el.y, el.w, el.h);
            }
            break;
        }
    }
    ctx.restore();
}

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, size: number, font: string, math?: boolean) {
    if (typeof document === "undefined") return text.length * size * 0.6;
    measureCtx ??= document.createElement("canvas").getContext("2d");
    if (!measureCtx) return text.length * size * 0.6;
    measureCtx.font = `${math ? "italic " : ""}${size}px ${font}`;
    return Math.max(...text.split("\n").map((l) => measureCtx!.measureText(l).width));
}

/** Boîte englobante (les courbes n'en ont pas : elles suivent la vue) */
export function bounds(el: BoardElement, font: string): Rect | null {
    const pad = el.width;
    switch (el.type) {
        case "stroke": {
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (let i = 0; i < el.points.length; i += 3) {
                x0 = Math.min(x0, el.points[i]);
                x1 = Math.max(x1, el.points[i]);
                y0 = Math.min(y0, el.points[i + 1]);
                y1 = Math.max(y1, el.points[i + 1]);
            }
            const p = el.highlighter ? el.width * 2 : pad;
            return { x0: x0 - p, y0: y0 - p, x1: x1 + p, y1: y1 + p };
        }
        case "line":
        case "arrow":
        case "rect":
        case "ellipse":
            return { x0: Math.min(el.x1, el.x2) - pad * 3, y0: Math.min(el.y1, el.y2) - pad * 3, x1: Math.max(el.x1, el.x2) + pad * 3, y1: Math.max(el.y1, el.y2) + pad * 3 };
        case "text": {
            const lines = el.text.split("\n").length;
            return { x0: el.x, y0: el.y, x1: el.x + textWidth(el.text, el.size, font, el.math), y1: el.y + lines * el.size * 1.25 };
        }
        case "point":
            return { x0: el.x - 10, y0: el.y - 30, x1: el.x + 14 + textWidth(el.label, 18, font, true), y1: el.y + 10 };
        case "stamp": {
            const def = getStamp(el.name);
            const w = (def?.w ?? 40) * el.scale, h = (def?.h ?? 40) * el.scale;
            return { x0: el.x - w / 2 - 4, y0: el.y - h / 2 - 4, x1: el.x + w / 2 + 4, y1: el.y + h / 2 + 4 };
        }
        case "image":
            return { x0: el.x, y0: el.y, x1: el.x + el.w, y1: el.y + el.h };
        case "plot":
            return null;
    }
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len)) : 0;
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** L'élément est-il sous le point (x, y) ? `tol` en pixels monde */
export function hitTest(el: BoardElement, x: number, y: number, tol: number, env: { font: string; unit: number }): boolean {
    switch (el.type) {
        case "stroke": {
            const t = tol + (el.highlighter ? el.width * 1.5 : el.width / 2);
            const p = el.points;
            if (p.length === 3) return Math.hypot(x - p[0], y - p[1]) <= t;
            for (let i = 3; i < p.length; i += 3) if (distToSegment(x, y, p[i - 3], p[i - 2], p[i], p[i + 1]) <= t) return true;
            return false;
        }
        case "line":
        case "arrow":
            return distToSegment(x, y, el.x1, el.y1, el.x2, el.y2) <= tol + el.width / 2;
        case "rect": {
            const x0 = Math.min(el.x1, el.x2), x1 = Math.max(el.x1, el.x2), y0 = Math.min(el.y1, el.y2), y1 = Math.max(el.y1, el.y2);
            return (
                distToSegment(x, y, x0, y0, x1, y0) <= tol ||
                distToSegment(x, y, x1, y0, x1, y1) <= tol ||
                distToSegment(x, y, x1, y1, x0, y1) <= tol ||
                distToSegment(x, y, x0, y1, x0, y0) <= tol
            );
        }
        case "ellipse": {
            const cx = (el.x1 + el.x2) / 2, cy = (el.y1 + el.y2) / 2;
            const rx = Math.abs(el.x2 - el.x1) / 2 || 1, ry = Math.abs(el.y2 - el.y1) / 2 || 1;
            const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
            return Math.abs(d - 1) * Math.min(rx, ry) <= tol + el.width;
        }
        case "plot": {
            const f = compiled(el.expr);
            if (!f) return false;
            const fy = -f(x / env.unit) * env.unit;
            return Number.isFinite(fy) && Math.abs(fy - y) <= tol + el.width * 2;
        }
        default: {
            const b = bounds(el, env.font);
            return !!b && x >= b.x0 - tol && x <= b.x1 + tol && y >= b.y0 - tol && y <= b.y1 + tol;
        }
    }
}

/** Copie de l'élément déplacée de (dx, dy) */
export function moved<T extends BoardElement>(el: T, dx: number, dy: number): T {
    switch (el.type) {
        case "stroke":
            return { ...el, points: el.points.map((v, i) => (i % 3 === 0 ? v + dx : i % 3 === 1 ? v + dy : v)) };
        case "line":
        case "arrow":
        case "rect":
        case "ellipse":
            return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
        case "plot":
            return el;
        default:
            return { ...el, x: (el as { x: number }).x + dx, y: (el as { y: number }).y + dy };
    }
}

export function union(a: Rect | null, b: Rect | null): Rect | null {
    if (!a) return b;
    if (!b) return a;
    return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
}
