/**
 * Tableau blanc Workyt — modèle de document.
 *
 * Un tableau est une simple liste d'éléments en coordonnées « monde » (pixels
 * à l'échelle 1). Le format est volontairement compact (un trait = un tableau
 * plat de nombres) : il s'enregistre en JSON et pourra circuler en direct.
 */

export type Tool =
    | "select"
    | "hand"
    | "pen"
    | "highlighter"
    | "eraser"
    | "line"
    | "arrow"
    | "rect"
    | "ellipse"
    | "text"
    | "formula"
    | "point"
    | "stamp";

export type BackgroundKind =
    | "blank"
    | "grid"
    | "smallGrid"
    | "dots"
    | "millimeter"
    | "seyes"
    | "lines"
    | "axes"
    | "trigo"
    | "timeline"
    | "staff";

export interface Background {
    kind: BackgroundKind;
    /** Repère : pixels par unité (40 par défaut) */
    unit?: number;
    /** Frise : année (ou valeur) au point 0, et pas entre deux graduations */
    timelineStart?: number;
    timelineStep?: number;
}

interface Base {
    id: string;
    color: string;
    /** Épaisseur du trait (px monde) */
    width: number;
}

export interface StrokeElement extends Base {
    type: "stroke";
    /** x, y, pression, x, y, pression… */
    points: number[];
    highlighter?: boolean;
}

export interface ShapeElement extends Base {
    type: "line" | "arrow" | "rect" | "ellipse";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TextElement extends Base {
    type: "text";
    x: number;
    y: number;
    text: string;
    /** Taille de police (px monde) */
    size: number;
    /** Écrit avec l'outil formule (rendu en italique mathématique) */
    math?: boolean;
}

export interface PointElement extends Base {
    type: "point";
    x: number;
    y: number;
    label: string;
}

export interface StampElement extends Base {
    type: "stamp";
    name: string;
    x: number;
    y: number;
    scale: number;
}

export interface PlotElement extends Base {
    type: "plot";
    /** Expression saisie, ex. « x^2 - 3x + 1 » */
    expr: string;
}

export interface ImageElement extends Base {
    type: "image";
    x: number;
    y: number;
    w: number;
    h: number;
    /** data:image/… (redimensionnée à l'import) */
    src: string;
}

export type BoardElement =
    | StrokeElement
    | ShapeElement
    | TextElement
    | PointElement
    | StampElement
    | PlotElement
    | ImageElement;

export interface BoardDoc {
    kind: "workyt-board";
    version: 1;
    background: Background;
    elements: BoardElement[];
}

export interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export const emptyBoard = (background: Background = { kind: "grid" }): BoardDoc => ({
    kind: "workyt-board",
    version: 1,
    background,
    elements: [],
});

export function isBoardDoc(v: unknown): v is BoardDoc {
    return !!v && typeof v === "object" && (v as BoardDoc).kind === "workyt-board" && Array.isArray((v as BoardDoc).elements);
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
