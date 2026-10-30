"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
    MousePointer2,
    Hand,
    Pen,
    Highlighter,
    Eraser,
    Minus,
    MoveUpRight,
    Square,
    Circle,
    Type,
    Sigma,
    Crosshair,
    ImagePlus,
    Shapes,
    LineChart,
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    Maximize,
    Trash2,
    X,
} from "lucide-react";
import { BACKGROUNDS, DEFAULT_UNIT, backgroundAnchor, drawBackground } from "./backgrounds";
import { STAMP_GROUPS, getStamp } from "./stamps";
import { bounds, drawElement, hitTest, moved, union } from "./render";
import { compileExpression } from "./mathExpr";
import { formulaToText } from "./mathText";
import { emptyBoard, uid, type Background, type BackgroundKind, type BoardDoc, type BoardElement, type BoardOps, type Rect, type Tool } from "./types";

export interface WhiteboardHandle {
    getDoc: () => BoardDoc;
    /** Modifications venues d'un autre participant : appliquées sans entrer dans l'historique */
    applyRemote: (ops: BoardOps) => void;
    /** Resynchronise tout le tableau (après une erreur d'envoi, par exemple) */
    replaceDoc: (doc: BoardDoc) => void;
    /** PNG du contenu (fond compris), ou null si le tableau est vide */
    exportPng: () => Promise<Blob | null>;
    isEmpty: () => boolean;
}

interface Props {
    initialDoc?: BoardDoc | null;
    onChange?: (doc: BoardDoc) => void;
    /** Chaque modification locale, pour la partager en direct */
    onOps?: (ops: BoardOps) => void;
    /** Consultation seule (suivi terminé, modération) : déplacement et zoom uniquement */
    readOnly?: boolean;
    /** Refuse un texte (coordonnées dans un suivi…) : renvoie le message à afficher */
    validateText?: (text: string) => string | null;
    /** Taille maximale d'une image importée (data URL, en octets) */
    maxImageBytes?: number;
    className?: string;
}

/** Une modification locale : l'état avant/après de chaque élément touché (null = absent) */
type Change = { before: Map<string, BoardElement | null>; after: Map<string, BoardElement | null> };

const byZ = (a: BoardElement, b: BoardElement) => (a.z ?? 0) - (b.z ?? 0);

/** Applique des remplacements/suppressions par id, en gardant l'ordre d'empilement */
function applyMap(els: BoardElement[], map: Map<string, BoardElement | null>): BoardElement[] {
    const out: BoardElement[] = [];
    for (const el of els) {
        if (!map.has(el.id)) out.push(el);
        else {
            const next = map.get(el.id);
            if (next) out.push(next);
        }
    }
    const present = new Set(els.map((e) => e.id));
    for (const [id, el] of map) if (el && !present.has(id)) out.push(el);
    return out.sort(byZ);
}

const opsOf = (map: Map<string, BoardElement | null>): BoardOps => ({
    upsert: [...map.values()].filter((e): e is BoardElement => !!e),
    remove: [...map.entries()].filter(([, e]) => !e).map(([id]) => id),
});

const SUBJECTS: { name: string; background: BackgroundKind }[] = [
    { name: "Toutes", background: "grid" },
    { name: "Maths", background: "axes" },
    { name: "Physique-chimie", background: "millimeter" },
    { name: "SVT", background: "blank" },
    { name: "Histoire-géo", background: "timeline" },
    { name: "Français", background: "seyes" },
    { name: "Langues", background: "lines" },
    { name: "SES", background: "axes" },
    { name: "Musique", background: "staff" },
];

const COLORS = ["#1a1512", "#2563eb", "#dc2626", "#16a34a", "#ff6a1a", "#7c3aed", "#facc15"];
const WIDTHS = [
    { w: 2, label: "Fin" },
    { w: 4, label: "Moyen" },
    { w: 8, label: "Épais" },
];

const TOOLS: { tool: Tool; icon: React.ElementType; label: string; key: string }[] = [
    { tool: "select", icon: MousePointer2, label: "Sélectionner et déplacer", key: "v" },
    { tool: "hand", icon: Hand, label: "Se déplacer dans le tableau", key: "h" },
    { tool: "pen", icon: Pen, label: "Stylo", key: "p" },
    { tool: "highlighter", icon: Highlighter, label: "Surligneur", key: "s" },
    { tool: "eraser", icon: Eraser, label: "Gomme", key: "e" },
    { tool: "line", icon: Minus, label: "Segment (Maj : angles droits)", key: "l" },
    { tool: "arrow", icon: MoveUpRight, label: "Flèche / vecteur", key: "f" },
    { tool: "rect", icon: Square, label: "Rectangle (Maj : carré)", key: "r" },
    { tool: "ellipse", icon: Circle, label: "Cercle / ellipse (Maj : cercle)", key: "o" },
    { tool: "point", icon: Crosshair, label: "Point nommé (A, B…)", key: "n" },
    { tool: "text", icon: Type, label: "Texte", key: "t" },
    { tool: "formula", icon: Sigma, label: "Formule (x^2, H_2O, \\pi…)", key: "m" },
    { tool: "stamp", icon: Shapes, label: "Bibliothèque de la matière", key: "b" },
];

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

type Editing = { kind: "text" | "formula" | "point"; wx: number; wy: number; sx: number; sy: number; value: string };
type Draft =
    | { kind: "stroke"; el: BoardElement }
    | { kind: "shape"; el: BoardElement }
    | { kind: "move"; id: string; dx: number; dy: number; startX: number; startY: number }
    | { kind: "erase"; ids: Set<string> }
    | null;

const nextLetter = (els: BoardElement[]) => {
    const used = new Set(els.filter((e) => e.type === "point").map((e) => (e as { label: string }).label));
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if (!used.has(c)) return c;
    return "";
};

const Whiteboard = forwardRef<WhiteboardHandle, Props>(function Whiteboard({ initialDoc, onChange, onOps, readOnly = false, validateText, maxImageBytes, className = "" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fontRef = useRef("Montserrat, sans-serif");

    const elementsRef = useRef<BoardElement[]>([...(initialDoc?.elements ?? [])].sort(byZ));
    // Historique par modification (et non par instantané) : annuler ne défait
    // que ses propres gestes, jamais ceux de l'autre participant
    const historyRef = useRef<{ past: Change[]; future: Change[] }>({ past: [], future: [] });
    const viewRef = useRef({ scale: 1, tx: 0, ty: 0 });
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
    const draftRef = useRef<Draft>(null);
    const selectedRef = useRef<string | null>(null);
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const gestureRef = useRef<{ kind: "pan"; lastX: number; lastY: number } | { kind: "pinch"; dist: number; cx: number; cy: number } | null>(null);
    const spaceRef = useRef(false);
    const frameRef = useRef(0);
    const paintRef = useRef<() => void>(() => {});
    /** Dernière saisie validée : Entrée puis perte du focus ne doivent pas l'ajouter deux fois */
    const committedEditRef = useRef<Editing | null>(null);

    const [background, setBackground] = useState<Background>(initialDoc?.background ?? emptyBoard().background);
    const [subject, setSubject] = useState("Toutes");
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState(COLORS[0]);
    const [width, setWidth] = useState(4);
    const [stampName, setStampName] = useState<string | null>(null);
    const [panel, setPanel] = useState<"stamps" | "plot" | null>(null);
    const [editing, setEditing] = useState<Editing | null>(null);
    const [plotExpr, setPlotExpr] = useState("");
    const [plotError, setPlotError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [hasSelection, setHasSelection] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [, setVersion] = useState(0);
    const backgroundRef = useRef(background);

    const imageInputRef = useRef<HTMLInputElement>(null);

    // ───────────── Rendu ─────────────
    const visibleRect = useCallback((): Rect => {
        const { scale, tx, ty } = viewRef.current;
        const { w, h } = sizeRef.current;
        return { x0: -tx / scale, y0: -ty / scale, x1: (w - tx) / scale, y1: (h - ty) / scale };
    }, []);

    // Un seul rendu par image d'écran, quel que soit le nombre de demandes
    const schedule = useCallback(() => {
        if (!frameRef.current) frameRef.current = requestAnimationFrame(() => paintRef.current());
    }, []);

    const paint = useCallback(() => {
        frameRef.current = 0;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const { w, h, dpr } = sizeRef.current;
        const { scale, tx, ty } = viewRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty);
        const view = visibleRect();
        const bg = backgroundRef.current;
        drawBackground(ctx, bg, view, scale, fontRef.current);

        const env = { view, scale, background: bg, font: fontRef.current, onImageLoad: () => schedule() };
        const draft = draftRef.current;
        for (const el of elementsRef.current) {
            if (draft?.kind === "erase" && draft.ids.has(el.id)) {
                ctx.save();
                ctx.globalAlpha = 0.2;
                drawElement(ctx, el, env);
                ctx.restore();
                continue;
            }
            if (draft?.kind === "move" && draft.id === el.id) {
                drawElement(ctx, moved(el, draft.dx, draft.dy), env);
                continue;
            }
            drawElement(ctx, el, env);
        }
        if (draft && (draft.kind === "stroke" || draft.kind === "shape")) drawElement(ctx, draft.el, env);

        // Sélection
        const sel = selectedRef.current && elementsRef.current.find((e) => e.id === selectedRef.current);
        if (sel) {
            const shifted = draft?.kind === "move" ? moved(sel, draft.dx, draft.dy) : sel;
            const b = bounds(shifted, fontRef.current);
            if (b) {
                ctx.save();
                ctx.strokeStyle = "#ff6a1a";
                ctx.lineWidth = 1.5 / scale;
                ctx.setLineDash([6 / scale, 4 / scale]);
                ctx.strokeRect(b.x0 - 4 / scale, b.y0 - 4 / scale, b.x1 - b.x0 + 8 / scale, b.y1 - b.y0 + 8 / scale);
                ctx.restore();
            }
        }
    }, [visibleRect, schedule]);

    useEffect(() => {
        paintRef.current = paint;
        schedule();
    }, [paint, schedule]);

    useEffect(() => {
        backgroundRef.current = background;
        schedule();
    }, [background, schedule]);

    // ───────────── Document ─────────────
    const docOf = useCallback((): BoardDoc => ({ kind: "workyt-board", version: 1, background: backgroundRef.current, elements: elementsRef.current }), []);

    const applyLocal = useCallback(
        (map: Map<string, BoardElement | null>) => {
            if (!map.size) return;
            elementsRef.current = applyMap(elementsRef.current, map);
            if (selectedRef.current && map.has(selectedRef.current) && !map.get(selectedRef.current)) {
                selectedRef.current = null;
                setHasSelection(false);
            }
            setVersion((v) => v + 1);
            onOps?.(opsOf(map));
            onChange?.(docOf());
            schedule();
        },
        [docOf, onChange, onOps, schedule]
    );

    /** Remplace la liste des éléments : on en déduit ce qui a changé */
    const commit = useCallback(
        (next: BoardElement[]) => {
            const prev = new Map(elementsRef.current.map((e) => [e.id, e]));
            const nextIds = new Set<string>();
            const before = new Map<string, BoardElement | null>();
            const after = new Map<string, BoardElement | null>();
            let z = Date.now();
            for (let el of next) {
                nextIds.add(el.id);
                const old = prev.get(el.id);
                if (old === el) continue;
                // Nouvel élément : il prend place au-dessus de tout
                if (!old && el.z === undefined) el = { ...el, z: z++ + Math.random() / 10 };
                before.set(el.id, old ?? null);
                after.set(el.id, el);
            }
            for (const [id, old] of prev) {
                if (nextIds.has(id)) continue;
                before.set(id, old);
                after.set(id, null);
            }
            if (!after.size) return;
            historyRef.current.past.push({ before, after });
            if (historyRef.current.past.length > 200) historyRef.current.past.shift();
            historyRef.current.future = [];
            applyLocal(after);
        },
        [applyLocal]
    );

    const undo = useCallback(() => {
        const change = historyRef.current.past.pop();
        if (!change) return;
        historyRef.current.future.push(change);
        applyLocal(change.before);
    }, [applyLocal]);

    const redo = useCallback(() => {
        const change = historyRef.current.future.pop();
        if (!change) return;
        historyRef.current.past.push(change);
        applyLocal(change.after);
    }, [applyLocal]);

    const changeBackground = useCallback(
        (bg: Background) => {
            backgroundRef.current = bg;
            setBackground(bg);
            onOps?.({ upsert: [], remove: [], background: bg });
            onChange?.(docOf());
        },
        [docOf, onChange, onOps]
    );

    // Message passager (texte refusé, image trop lourde…)
    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(t);
    }, [notice]);

    const deleteSelected = useCallback(() => {
        const id = selectedRef.current;
        if (!id) return;
        selectedRef.current = null;
        setHasSelection(false);
        commit(elementsRef.current.filter((e) => e.id !== id));
    }, [commit]);

    // ───────────── Vue (zoom, déplacement) ─────────────
    const setView = useCallback(
        (scale: number, tx: number, ty: number) => {
            viewRef.current = { scale, tx, ty };
            setZoom(Math.round(scale * 100));
            schedule();
        },
        [schedule]
    );

    const zoomAt = useCallback(
        (factor: number, sx: number, sy: number) => {
            const { scale, tx, ty } = viewRef.current;
            const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
            const k = next / scale;
            setView(next, sx - (sx - tx) * k, sy - (sy - ty) * k);
        },
        [setView]
    );

    const recenter = useCallback(() => {
        const { w, h } = sizeRef.current;
        const centered = ["axes", "trigo", "timeline"].includes(backgroundRef.current.kind);
        setView(1, centered ? Math.round(w / 2) : 40, centered ? Math.round(h / 2) : 40);
    }, [setView]);

    /** Cadre tout ce qui est dessiné (tableau vide : retour à l'origine) */
    const fitAll = useCallback(() => {
        let box: Rect | null = null;
        for (const el of elementsRef.current) box = union(box, bounds(el, fontRef.current));
        const { w, h } = sizeRef.current;
        if (!box || !w || !h) return recenter();
        const pad = 32;
        const bw = Math.max(box.x1 - box.x0, 1), bh = Math.max(box.y1 - box.y0, 1);
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min((w - pad * 2) / bw, (h - pad * 2) / bh, 2)));
        setView(scale, (w - bw * scale) / 2 - box.x0 * scale, (h - bh * scale) / 2 - box.y0 * scale);
    }, [recenter, setView]);

    // Rappel des gestes pour se déplacer, quelques secondes à l'ouverture
    const [showHint, setShowHint] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setShowHint(false), 7000);
        return () => clearTimeout(t);
    }, []);

    // Taille du canvas = taille du conteneur (écrans haute densité compris)
    useEffect(() => {
        const el = containerRef.current;
        const canvas = canvasRef.current;
        if (!el || !canvas) return;
        fontRef.current = getComputedStyle(el).fontFamily || fontRef.current;
        let first = true;
        const ro = new ResizeObserver(() => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = el.clientWidth, h = el.clientHeight;
            sizeRef.current = { w, h, dpr };
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            if (first && w > 0) {
                first = false;
                recenter();
            }
            schedule();
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            // Sinon `schedule` croirait un rendu déjà prévu et n'en demanderait plus jamais
            frameRef.current = 0;
        };
    }, [recenter, schedule]);

    // ───────────── API pour le parent ─────────────
    useImperativeHandle(
        ref,
        () => ({
            getDoc: docOf,
            isEmpty: () => elementsRef.current.length === 0,
            applyRemote: (ops: BoardOps) => {
                const map = new Map<string, BoardElement | null>();
                for (const el of ops.upsert) map.set(el.id, el);
                for (const id of ops.remove) map.set(id, null);
                if (map.size) {
                    elementsRef.current = applyMap(elementsRef.current, map);
                    if (selectedRef.current && map.has(selectedRef.current)) {
                        selectedRef.current = null;
                        setHasSelection(false);
                    }
                }
                if (ops.background) {
                    backgroundRef.current = ops.background;
                    setBackground(ops.background);
                }
                setVersion((v) => v + 1);
                schedule();
            },
            replaceDoc: (doc: BoardDoc) => {
                elementsRef.current = [...doc.elements].sort(byZ);
                historyRef.current = { past: [], future: [] };
                backgroundRef.current = doc.background;
                setBackground(doc.background);
                selectedRef.current = null;
                setHasSelection(false);
                setVersion((v) => v + 1);
                schedule();
            },
            exportPng: async () => {
                const els = elementsRef.current;
                if (!els.length) return null;
                const font = fontRef.current;
                let box: Rect | null = null;
                for (const el of els) box = union(box, bounds(el, font));
                box = union(box, backgroundAnchor(backgroundRef.current));
                // Une courbe seule : on montre au moins ±5 unités autour de l'origine
                if (els.some((e) => e.type === "plot")) {
                    const u = (backgroundRef.current.unit || DEFAULT_UNIT) * 5;
                    box = union(box, { x0: -u, y0: -u, x1: u, y1: u });
                }
                if (!box) return null;
                const pad = 24;
                const view = { x0: box.x0 - pad, y0: box.y0 - pad, x1: box.x1 + pad, y1: box.y1 + pad };
                const w = view.x1 - view.x0, h = view.y1 - view.y0;
                const scale = Math.min(2, 4000 / Math.max(w, h));
                const canvas = document.createElement("canvas");
                canvas.width = Math.ceil(w * scale);
                canvas.height = Math.ceil(h * scale);
                const ctx = canvas.getContext("2d");
                if (!ctx) return null;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.setTransform(scale, 0, 0, scale, -view.x0 * scale, -view.y0 * scale);
                drawBackground(ctx, backgroundRef.current, view, scale, font);
                // Les images importées doivent être décodées avant l'export
                await Promise.all(
                    els
                        .filter((e) => e.type === "image")
                        .map((e) => new Promise<void>((resolve) => {
                            const img = new Image();
                            img.onload = img.onerror = () => resolve();
                            img.src = (e as { src: string }).src;
                        }))
                );
                const env = { view, scale, background: backgroundRef.current, font, onImageLoad: () => {} };
                for (const el of els) drawElement(ctx, el, env);
                return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
            },
        }),
        [docOf, schedule]
    );

    // ───────────── Saisie (stylo, souris, doigt) ─────────────
    const toWorld = (sx: number, sy: number) => {
        const { scale, tx, ty } = viewRef.current;
        return { x: (sx - tx) / scale, y: (sy - ty) / scale };
    };
    const local = (e: { clientX: number; clientY: number }) => {
        const r = canvasRef.current!.getBoundingClientRect();
        return { sx: e.clientX - r.left, sy: e.clientY - r.top };
    };
    const hitAt = (x: number, y: number) => {
        const tol = 6 / viewRef.current.scale;
        const env = { font: fontRef.current, unit: backgroundRef.current.unit || DEFAULT_UNIT };
        const els = elementsRef.current;
        for (let i = els.length - 1; i >= 0; i--) if (hitTest(els[i], x, y, tol, env)) return els[i];
        return null;
    };

    const commitEditing = useCallback(
        (ed: Editing | null) => {
            setEditing(null);
            if (!ed || committedEditRef.current === ed) return;
            committedEditRef.current = ed;
            const value = ed.value.trim();
            const finalText = ed.kind === "formula" ? value.split("\n").map(formulaToText).join("\n") : value;
            const refused = finalText ? validateText?.(finalText) : null;
            if (refused) {
                setNotice(refused);
                return;
            }
            if (ed.kind === "point") {
                commit([...elementsRef.current, { id: uid(), type: "point", color, width, x: ed.wx, y: ed.wy, label: value }]);
                return;
            }
            if (!value) return;
            const size = 14 + width * 3;
            commit([
                ...elementsRef.current,
                {
                    id: uid(),
                    type: "text",
                    color,
                    width,
                    x: ed.wx,
                    y: ed.wy,
                    size,
                    text: finalText,
                    math: ed.kind === "formula",
                },
            ]);
        },
        [color, commit, validateText, width]
    );

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (editing) commitEditing(editing);
        const { sx, sy } = local(e);
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            /* pointeur déjà relâché : le tracé continue sans capture */
        }
        pointersRef.current.set(e.pointerId, { x: sx, y: sy });

        // Deux doigts : zoom par pincement (on abandonne le trait commencé)
        if (pointersRef.current.size === 2) {
            draftRef.current = null;
            const [a, b] = [...pointersRef.current.values()];
            gestureRef.current = { kind: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
            schedule();
            return;
        }
        if (readOnly || tool === "hand" || e.button === 1 || spaceRef.current) {
            gestureRef.current = { kind: "pan", lastX: sx, lastY: sy };
            return;
        }
        if (e.button !== 0 && e.pointerType === "mouse") return;

        const { x, y } = toWorld(sx, sy);
        const pressure = e.pointerType === "pen" ? e.pressure || 0.5 : 0.5;
        switch (tool) {
            case "pen":
            case "highlighter":
                draftRef.current = {
                    kind: "stroke",
                    el: { id: uid(), type: "stroke", color: tool === "highlighter" && color === COLORS[0] ? "#facc15" : color, width, points: [x, y, pressure], highlighter: tool === "highlighter" },
                };
                break;
            case "line":
            case "arrow":
            case "rect":
            case "ellipse":
                draftRef.current = { kind: "shape", el: { id: uid(), type: tool, color, width, x1: x, y1: y, x2: x, y2: y } };
                break;
            case "eraser": {
                const hit = hitAt(x, y);
                draftRef.current = { kind: "erase", ids: new Set(hit ? [hit.id] : []) };
                break;
            }
            case "select": {
                const hit = hitAt(x, y);
                selectedRef.current = hit?.id ?? null;
                setHasSelection(!!hit);
                if (hit) draftRef.current = { kind: "move", id: hit.id, dx: 0, dy: 0, startX: x, startY: y };
                break;
            }
            case "text":
            case "formula":
            case "point":
                setEditing({ kind: tool, wx: x, wy: y, sx, sy, value: tool === "point" ? nextLetter(elementsRef.current) : "" });
                break;
            case "stamp": {
                if (!stampName) {
                    setPanel("stamps");
                    break;
                }
                commit([...elementsRef.current, { id: uid(), type: "stamp", name: stampName, color, width: Math.max(1.5, width / 1.5), x, y, scale: 1 }]);
                break;
            }
        }
        schedule();
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!pointersRef.current.has(e.pointerId)) return;
        const { sx, sy } = local(e);
        pointersRef.current.set(e.pointerId, { x: sx, y: sy });
        const g = gestureRef.current;
        if (g?.kind === "pinch" && pointersRef.current.size >= 2) {
            const [a, b] = [...pointersRef.current.values()];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
            const { scale, tx, ty } = viewRef.current;
            const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (dist / (g.dist || dist))));
            const k = next / scale;
            setView(next, cx - (cx - tx) * k + (cx - g.cx), cy - (cy - ty) * k + (cy - g.cy));
            gestureRef.current = { kind: "pinch", dist, cx, cy };
            return;
        }
        if (g?.kind === "pan") {
            const { scale, tx, ty } = viewRef.current;
            setView(scale, tx + sx - g.lastX, ty + sy - g.lastY);
            gestureRef.current = { kind: "pan", lastX: sx, lastY: sy };
            return;
        }
        const draft = draftRef.current;
        if (!draft) return;
        const { x, y } = toWorld(sx, sy);
        if (draft.kind === "stroke" && draft.el.type === "stroke") {
            // Points intermédiaires du mouvement ; la liste peut être vide (navigateurs, stylets) :
            // on garde alors au moins l'événement lui-même, sinon le trait se réduit à un point
            const coalesced = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [];
            const events = coalesced.length ? coalesced : [e.nativeEvent];
            const pts = draft.el.points;
            const minDist = 1.2 / viewRef.current.scale;
            for (const ev of events) {
                const p = local(ev);
                const w = toWorld(p.sx, p.sy);
                const lx = pts[pts.length - 3], ly = pts[pts.length - 2];
                if (Math.hypot(w.x - lx, w.y - ly) < minDist) continue;
                pts.push(w.x, w.y, ev.pointerType === "pen" ? ev.pressure || 0.5 : 0.5);
            }
        } else if (draft.kind === "shape") {
            const el = draft.el as Extract<BoardElement, { x1: number }>;
            let x2 = x, y2 = y;
            if (e.shiftKey) {
                if (el.type === "rect" || el.type === "ellipse") {
                    const d = Math.max(Math.abs(x - el.x1), Math.abs(y - el.y1));
                    x2 = el.x1 + Math.sign(x - el.x1 || 1) * d;
                    y2 = el.y1 + Math.sign(y - el.y1 || 1) * d;
                } else {
                    // Segments : angles multiples de 15°
                    const a = Math.round(Math.atan2(y - el.y1, x - el.x1) / (Math.PI / 12)) * (Math.PI / 12);
                    const len = Math.hypot(x - el.x1, y - el.y1);
                    x2 = el.x1 + Math.cos(a) * len;
                    y2 = el.y1 + Math.sin(a) * len;
                }
            }
            draft.el = { ...el, x2, y2 };
        } else if (draft.kind === "erase") {
            const hit = hitAt(x, y);
            if (hit) draft.ids.add(hit.id);
        } else if (draft.kind === "move") {
            draft.dx = x - draft.startX;
            draft.dy = y - draft.startY;
        }
        schedule();
    };

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (gestureRef.current) {
            if (pointersRef.current.size === 0) gestureRef.current = null;
            else if (gestureRef.current.kind === "pinch") {
                const [p] = [...pointersRef.current.values()];
                gestureRef.current = { kind: "pan", lastX: p.x, lastY: p.y };
            }
            return;
        }
        const draft = draftRef.current;
        draftRef.current = null;
        if (!draft) return;
        if (draft.kind === "stroke") commit([...elementsRef.current, draft.el]);
        else if (draft.kind === "shape") {
            const el = draft.el as Extract<BoardElement, { x1: number }>;
            if (Math.hypot(el.x2 - el.x1, el.y2 - el.y1) > 3 / viewRef.current.scale) commit([...elementsRef.current, el]);
        } else if (draft.kind === "erase") {
            if (draft.ids.size) commit(elementsRef.current.filter((el) => !draft.ids.has(el.id)));
        } else if (draft.kind === "move") {
            if (draft.dx || draft.dy) commit(elementsRef.current.map((el) => (el.id === draft.id ? moved(el, draft.dx, draft.dy) : el)));
        }
        schedule();
    };

    // Molette : déplacement ; Ctrl/⌘ + molette ou pincement du pavé tactile : zoom
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const r = canvas.getBoundingClientRect();
            if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
            else {
                const { scale, tx, ty } = viewRef.current;
                setView(scale, tx - e.deltaX, ty - e.deltaY);
            }
        };
        canvas.addEventListener("wheel", onWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", onWheel);
    }, [setView, zoomAt]);

    // Raccourcis clavier (sauf pendant une saisie)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest("input, textarea, select, [contenteditable=true]")) return;
            if (!containerRef.current?.isConnected || readOnly) return;
            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
                return;
            }
            if (mod && e.key.toLowerCase() === "y") {
                e.preventDefault();
                redo();
                return;
            }
            if ((e.key === "Delete" || e.key === "Backspace") && selectedRef.current) {
                e.preventDefault();
                deleteSelected();
                return;
            }
            if (e.key === "Escape") {
                selectedRef.current = null;
                setHasSelection(false);
                setPanel(null);
                schedule();
                return;
            }
            if (e.key === " ") {
                spaceRef.current = true;
                return;
            }
            if (mod || e.altKey) return;
            const t = TOOLS.find((x) => x.key === e.key.toLowerCase());
            if (t) setTool(t.tool);
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") spaceRef.current = false;
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, [deleteSelected, readOnly, redo, schedule, undo]);

    // ───────────── Actions de la barre ─────────────
    const chooseSubject = (name: string) => {
        setSubject(name);
        const s = SUBJECTS.find((x) => x.name === name);
        if (s && s.background !== backgroundRef.current.kind) {
            changeBackground({ ...backgroundRef.current, kind: s.background });
            recenter();
        }
    };

    const chooseBackground = (kind: BackgroundKind) => {
        changeBackground({ ...backgroundRef.current, kind });
        recenter();
    };

    const addPlot = () => {
        try {
            compileExpression(plotExpr);
        } catch (err) {
            setPlotError(err instanceof Error ? err.message : "Expression invalide");
            return;
        }
        setPlotError(null);
        if (backgroundRef.current.kind !== "axes") chooseBackground("axes");
        commit([...elementsRef.current, { id: uid(), type: "plot", color, width: Math.max(2, width / 1.5), expr: plotExpr.trim() }]);
        setPlotExpr("");
    };

    const importImage = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                // Une photo d'exercice doit rester lisible : on garde jusqu'à 2000 px et
                // on ne compresse que ce qu'il faut pour tenir dans la limite
                const c = document.createElement("canvas");
                const draw = (max: number) => {
                    const k = Math.min(1, max / Math.max(img.width, img.height));
                    c.width = Math.round(img.width * k);
                    c.height = Math.round(img.height * k);
                    const ctx = c.getContext("2d");
                    if (!ctx) return;
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, c.width, c.height);
                    ctx.drawImage(img, 0, 0, c.width, c.height);
                };
                let src = "";
                found: for (const max of [2000, 1600, 1280, 1024]) {
                    draw(max);
                    for (const q of [0.88, 0.8, 0.72, 0.64]) {
                        src = c.toDataURL("image/jpeg", q);
                        if (!maxImageBytes || src.length <= maxImageBytes) break found;
                    }
                }
                if (maxImageBytes && src.length > maxImageBytes) {
                    setNotice("Image trop lourde pour le tableau. Envoie-la plutôt dans la conversation.");
                    return;
                }
                // Posée en grand (90 % de la vue) puis cadrée : on la lit tout de suite
                const v = visibleRect();
                const w = Math.min(c.width, (v.x1 - v.x0) * 0.9, ((v.y1 - v.y0) * 0.9 * c.width) / c.height);
                const h = (w / c.width) * c.height;
                commit([...elementsRef.current, { id: uid(), type: "image", color, width: 0, x: (v.x0 + v.x1) / 2 - w / 2, y: (v.y0 + v.y1) / 2 - h / 2, w, h, src }]);
                setTool("select");
            };
            img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const clearAll = () => {
        if (!elementsRef.current.length) return;
        if (!window.confirm("Effacer tout le tableau ? (Ctrl+Z pour annuler)")) return;
        selectedRef.current = null;
        setHasSelection(false);
        commit([]);
    };

    const stampGroups = useMemo(
        () => STAMP_GROUPS.filter((g) => subject === "Toutes" || g.subject === subject || (subject === "Maths" && g.title === "Géométrie")),
        [subject]
    );
    const backgrounds = useMemo(() => BACKGROUNDS, []);

    const cursor = readOnly || tool === "hand" ? "grab" : tool === "select" ? "default" : tool === "text" || tool === "formula" ? "text" : "crosshair";

    return (
        <div className={`flex h-full min-h-0 w-full flex-col bg-[var(--wk-paper,#fdfaf4)] ${className}`}>
            {/* Barre du haut : matière, fond, couleurs, épaisseur, historique, zoom */}
            <div className="flex shrink-0 items-center gap-x-3 overflow-x-auto whitespace-nowrap border-b border-[rgba(26,21,18,0.08)] bg-white px-3 py-1.5 text-sm [scrollbar-width:thin]">
                {readOnly ? (
                    <span className="text-xs text-[rgba(26,21,18,0.6)]">Consultation seule : déplace-toi et zoome pour relire le tableau.</span>
                ) : (
                <>
                <label className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">Matière</span>
                    <select value={subject} onChange={(e) => chooseSubject(e.target.value)} className="rounded-lg border border-[rgba(26,21,18,0.15)] bg-white px-2 py-1">
                        {SUBJECTS.map((s) => (
                            <option key={s.name}>{s.name}</option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">Fond</span>
                    <select value={background.kind} onChange={(e) => chooseBackground(e.target.value as BackgroundKind)} className="rounded-lg border border-[rgba(26,21,18,0.15)] bg-white px-2 py-1">
                        {backgrounds.map((b) => (
                            <option key={b.kind} value={b.kind}>
                                {b.label}
                            </option>
                        ))}
                    </select>
                </label>
                {background.kind === "axes" && (
                    <label className="flex items-center gap-1.5" title="Taille d'une unité du repère">
                        <span className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">Unité</span>
                        <select
                            value={background.unit || DEFAULT_UNIT}
                            onChange={(e) => changeBackground({ ...backgroundRef.current, unit: Number(e.target.value) })}
                            className="rounded-lg border border-[rgba(26,21,18,0.15)] bg-white px-2 py-1"
                        >
                            <option value={20}>Petite</option>
                            <option value={40}>Moyenne</option>
                            <option value={80}>Grande</option>
                        </select>
                    </label>
                )}
                {background.kind === "timeline" && (
                    <span className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-[rgba(26,21,18,0.55)]">Début</span>
                        <input
                            type="number"
                            value={background.timelineStart ?? 1900}
                            onChange={(e) => changeBackground({ ...backgroundRef.current, timelineStart: Number(e.target.value) })}
                            className="w-20 rounded-lg border border-[rgba(26,21,18,0.15)] px-2 py-1"
                            aria-label="Année de départ"
                        />
                        <span className="font-semibold text-[rgba(26,21,18,0.55)]">Pas</span>
                        <input
                            type="number"
                            min={1}
                            value={background.timelineStep ?? 10}
                            onChange={(e) => changeBackground({ ...backgroundRef.current, timelineStep: Math.max(1, Number(e.target.value)) })}
                            className="w-16 rounded-lg border border-[rgba(26,21,18,0.15)] px-2 py-1"
                            aria-label="Années entre deux graduations"
                        />
                    </span>
                )}

                <span className="mx-1 h-6 w-px bg-[rgba(26,21,18,0.1)]" aria-hidden />
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Couleur">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            role="radio"
                            aria-checked={color === c}
                            aria-label={`Couleur ${c}`}
                            onClick={() => setColor(c)}
                            className={`h-6 w-6 rounded-full border-2 transition ${color === c ? "scale-110 border-[var(--wk-accent,#ff6a1a)]" : "border-white shadow-[0_0_0_1px_rgba(26,21,18,0.15)]"}`}
                            style={{ background: c }}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Épaisseur">
                    {WIDTHS.map((o) => (
                        <button
                            key={o.w}
                            type="button"
                            role="radio"
                            aria-checked={width === o.w}
                            title={o.label}
                            aria-label={o.label}
                            onClick={() => setWidth(o.w)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${width === o.w ? "bg-[var(--wk-paper-2,#f5efe3)]" : "hover:bg-[var(--wk-paper-2,#f5efe3)]"}`}
                        >
                            <span className="rounded-full bg-[#1a1512]" style={{ width: o.w + 2, height: o.w + 2 }} />
                        </button>
                    ))}
                </div>

                <span className="mx-1 h-6 w-px bg-[rgba(26,21,18,0.1)]" aria-hidden />
                <div className="flex items-center gap-0.5">
                    <IconButton label="Annuler (Ctrl+Z)" onClick={undo} icon={Undo2} />
                    <IconButton label="Rétablir (Ctrl+Y)" onClick={redo} icon={Redo2} />
                    {hasSelection && <IconButton label="Supprimer la sélection (Suppr)" onClick={deleteSelected} icon={Trash2} />}
                </div>
                </>
                )}
                <div className="ml-auto flex items-center gap-0.5">
                    <IconButton label="Dézoomer" onClick={() => zoomAt(1 / 1.25, sizeRef.current.w / 2, sizeRef.current.h / 2)} icon={ZoomOut} />
                    <span className="w-11 text-center text-xs tabular-nums text-[rgba(26,21,18,0.6)]">{zoom} %</span>
                    <IconButton label="Zoomer" onClick={() => zoomAt(1.25, sizeRef.current.w / 2, sizeRef.current.h / 2)} icon={ZoomIn} />
                    <IconButton label="Tout voir (cadrer le contenu)" onClick={fitAll} icon={Maximize} />
                    {!readOnly && (
                        <button type="button" onClick={clearAll} className="ml-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                            Tout effacer
                        </button>
                    )}
                </div>
            </div>

            <div className="relative flex min-h-0 flex-1">
                {/* Outils */}
                {!readOnly && (
                <div className="z-10 flex w-12 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-[rgba(26,21,18,0.08)] bg-white py-2">
                    {TOOLS.map((t) => (
                        <ToolButton
                            key={t.tool}
                            active={tool === t.tool}
                            label={`${t.label} (${t.key.toUpperCase()})`}
                            icon={t.icon}
                            onClick={() => {
                                setTool(t.tool);
                                setPanel(t.tool === "stamp" ? "stamps" : null);
                            }}
                        />
                    ))}
                    <ToolButton active={panel === "plot"} label="Tracer une fonction f(x)" icon={LineChart} onClick={() => setPanel(panel === "plot" ? null : "plot")} />
                    <ToolButton active={false} label="Importer une image (photo d'exercice…)" icon={ImagePlus} onClick={() => imageInputRef.current?.click()} />
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) importImage(f);
                        }}
                    />
                </div>
                )}

                <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        className="block touch-none select-none"
                        style={{ cursor }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    {showHint && (
                        <p className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-[#1a1512]/80 px-3 py-1.5 text-[11px] text-white">
                            Molette ou 2 doigts : se déplacer · Ctrl + molette ou pincer : zoomer
                        </p>
                    )}

                    {notice && (
                        <p role="alert" className="absolute left-1/2 top-3 z-30 max-w-[90%] -translate-x-1/2 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700 shadow">
                            {notice}
                        </p>
                    )}

                    {editing && (
                        <EditingField
                            editing={editing}
                            color={color}
                            size={(14 + width * 3) * (zoom / 100)}
                            onChange={(value) => setEditing({ ...editing, value })}
                            onCommit={() => commitEditing(editing)}
                            onCancel={() => setEditing(null)}
                        />
                    )}

                    {panel === "stamps" && (
                        <Panel title="Bibliothèque" onClose={() => setPanel(null)}>
                            {stampGroups.map((g) => (
                                <div key={g.title} className="mb-3">
                                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[rgba(26,21,18,0.5)]">{g.title}</p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {g.stamps.map((s) => (
                                            <button
                                                key={s.name}
                                                type="button"
                                                title={s.label}
                                                onClick={() => {
                                                    setStampName(s.name);
                                                    setTool("stamp");
                                                }}
                                                className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[10px] leading-tight transition ${
                                                    stampName === s.name ? "border-[var(--wk-accent,#ff6a1a)] bg-orange-50" : "border-[rgba(26,21,18,0.1)] hover:bg-[var(--wk-paper,#fdfaf4)]"
                                                }`}
                                            >
                                                <StampPreview name={s.name} />
                                                <span className="line-clamp-2 text-center">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <p className="text-[11px] text-[rgba(26,21,18,0.5)]">Choisis un symbole, puis clique sur le tableau pour le poser. Relie les composants avec l&apos;outil segment.</p>
                        </Panel>
                    )}

                    {panel === "plot" && (
                        <Panel title="Tracer une fonction" onClose={() => setPanel(null)}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    addPlot();
                                }}
                            >
                                <label className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold italic">f(x) =</span>
                                    <input
                                        autoFocus
                                        value={plotExpr}
                                        onChange={(e) => {
                                            setPlotExpr(e.target.value);
                                            setPlotError(null);
                                        }}
                                        placeholder="x^2 - 3x + 1"
                                        className="min-w-0 flex-1 rounded-lg border border-[rgba(26,21,18,0.15)] px-2 py-1.5 font-mono text-sm"
                                    />
                                </label>
                                {plotError && <p className="mt-1.5 text-xs text-red-600">{plotError}</p>}
                                <button type="submit" className="mt-2 w-full rounded-lg bg-[var(--wk-accent,#ff6a1a)] px-3 py-1.5 text-sm font-semibold text-white">
                                    Tracer
                                </button>
                            </form>
                            <p className="mt-3 text-[11px] leading-relaxed text-[rgba(26,21,18,0.55)]">
                                Exemples : <code>2x+1</code>, <code>x^2-4</code>, <code>sin(x)</code>, <code>racine(x)</code>, <code>1/x</code>, <code>e^(-x)</code>, <code>ln(x)</code>, <code>abs(x)</code>.
                                La courbe prend la couleur choisie. Le fond passe en repère.
                            </p>
                        </Panel>
                    )}

                    {tool === "formula" && !editing && (
                        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] text-[rgba(26,21,18,0.65)] shadow">
                            Clique pour écrire : <code>x^2</code> → x², <code>H_2O</code> → H₂O, <code>Fe^{"{3+}"}</code> → Fe³⁺, <code>\Delta</code> → Δ, <code>-&gt;</code> → →, <code>\sqrt{"{x}"}</code> → √x
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

export default Whiteboard;

function IconButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: React.ElementType }) {
    return (
        <button type="button" onClick={onClick} title={label} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(26,21,18,0.7)] hover:bg-[var(--wk-paper-2,#f5efe3)] hover:text-[#1a1512]">
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ToolButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ElementType; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${active ? "bg-[#1a1512] text-white" : "text-[rgba(26,21,18,0.7)] hover:bg-[var(--wk-paper-2,#f5efe3)]"}`}
        >
            <Icon className="h-[18px] w-[18px]" />
        </button>
    );
}

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="absolute left-2 top-2 z-20 max-h-[calc(100%-1rem)] w-72 overflow-y-auto rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{title}</p>
                <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 hover:bg-[var(--wk-paper-2,#f5efe3)]">
                    <X className="h-4 w-4" />
                </button>
            </div>
            {children}
        </div>
    );
}

function StampPreview({ name }: { name: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const c = ref.current;
        const def = getStamp(name);
        const ctx = c?.getContext("2d");
        if (!c || !def || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const size = 44;
        c.width = size * dpr;
        c.height = size * dpr;
        const k = Math.min((size - 6) / def.w, (size - 6) / def.h);
        ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (size - def.w * k) / 2, dpr * (size - def.h * k) / 2);
        ctx.strokeStyle = ctx.fillStyle = "#1a1512";
        ctx.lineWidth = 1.6 / k;
        ctx.lineCap = ctx.lineJoin = "round";
        def.draw(ctx, getComputedStyle(c).fontFamily || "sans-serif");
    }, [name]);
    return <canvas ref={ref} style={{ width: 44, height: 44 }} aria-hidden />;
}

function EditingField({
    editing,
    color,
    size,
    onChange,
    onCommit,
    onCancel,
}: {
    editing: Editing;
    color: string;
    size: number;
    onChange: (v: string) => void;
    onCommit: () => void;
    onCancel: () => void;
}) {
    const preview = editing.kind === "formula" && editing.value ? editing.value.split("\n").map(formulaToText).join("\n") : null;
    return (
        <div className="absolute z-20" style={{ left: editing.sx, top: editing.sy }}>
            {editing.kind === "point" ? (
                <input
                    autoFocus
                    value={editing.value}
                    onChange={(e) => onChange(e.target.value.slice(0, 12))}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onCommit();
                        if (e.key === "Escape") onCancel();
                    }}
                    onBlur={onCommit}
                    placeholder="Nom"
                    aria-label="Nom du point"
                    className="w-20 rounded-md border border-[var(--wk-accent,#ff6a1a)] bg-white px-1.5 py-0.5 text-sm italic outline-none"
                />
            ) : (
                <>
                    <textarea
                        autoFocus
                        value={editing.value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onCommit();
                            }
                            if (e.key === "Escape") onCancel();
                        }}
                        onBlur={onCommit}
                        rows={1}
                        placeholder={editing.kind === "formula" ? "x^2 + 1, H_2O, \\Delta…" : "Écris ici…"}
                        aria-label={editing.kind === "formula" ? "Formule" : "Texte"}
                        className={`min-w-[12rem] resize rounded-md border border-dashed border-[var(--wk-accent,#ff6a1a)] bg-white/90 px-1 py-0.5 leading-tight outline-none ${editing.kind === "formula" ? "font-mono" : ""}`}
                        style={{ color, fontSize: Math.max(12, Math.min(size, 48)), fieldSizing: "content" } as React.CSSProperties}
                    />
                    {preview && (
                        <p className="mt-1 whitespace-pre rounded-md bg-white px-2 py-1 text-base italic shadow" style={{ color }}>
                            {preview}
                        </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-[rgba(26,21,18,0.5)]">Entrée pour valider · Maj+Entrée pour aller à la ligne</p>
                </>
            )}
        </div>
    );
}
