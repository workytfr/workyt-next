"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { sharedRemarkPlugins, sharedRehypePlugins } from "@/lib/markdownPlugins";
import "katex/dist/katex.min.css";
import { X, Loader2, Plus, Trash2, ArrowUp, ArrowDown, FileText } from "lucide-react";
import FicheEditor from "@/app/fiches/_components/FicheEditor";
import { DIFFICULTY_LEVELS, difficultyConfig, difficultyBadge } from "@/lib/difficulty";
import { getMascot, type Emotion } from "@/data/mascots";

const FOXY_EMOTIONS: { value: Emotion; label: string }[] = [
    { value: "joyeux", label: "🦊 Joyeux" },
    { value: "clin", label: "😉 Clin d'œil" },
    { value: "surpris", label: "😲 Surpris" },
    { value: "amoureux", label: "😍 Motivé" },
    { value: "endormi", label: "😴 Calme" },
    { value: "triste", label: "🥺 Triste" },
    { value: "fache", label: "😤 Sérieux" },
];

interface Exo {
    id: string;
    content: string;
    difficulty: string;
    points: number;
    answerLines: number;
    comment?: string;
    commentEmotion?: Emotion;
}

interface EvaluationPdfBuilderProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (pdf: File) => void;
    defaultTitle?: string;
    subject?: string;
    authorName?: string;
}

const BRAND_ORANGE = "#ff6a1a";
const BRAND_DARK = "#1a1512";
const LOGO_URL = "/Workyt%20Logo%202026.png";
const DOC_WIDTH = 700; // largeur du document d'aperçu (proche du ratio A4)

// Les images uploadées pointent vers le bucket privé R2 → on les sert via le proxy
// same-origin (sinon elles ne chargent ni dans l'aperçu ni dans html2canvas).
const proxyImg = (src?: string): string => {
    if (!src) return "";
    if (src.startsWith("/") || src.startsWith("data:")) return src;
    if (/\/(fiches|evaluations|audio-tts)\//.test(src)) {
        return `/api/file-proxy?file=${encodeURIComponent(src)}`;
    }
    return src; // image externe → telle quelle
};

const newExo = (): Exo => ({
    id: Math.random().toString(36).slice(2),
    content: "",
    difficulty: "Moyen 1",
    points: 5,
    answerLines: 6,
    comment: "",
    commentEmotion: "joyeux",
});

// Style "manuel scolaire" Workyt appliqué au document capturé.
const TEXTBOOK_CSS = `
.eval-doc { width: ${DOC_WIDTH}px; position: relative; background: #fff; padding: 4px 2px; }
.eval-doc * { box-sizing: border-box; }
.eval-exo { padding: 0 4px 22px; break-inside: avoid; }
.eval-exo-head {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2.5px solid ${BRAND_ORANGE}; padding: 4px 0 7px; margin-bottom: 11px;
}
.eval-exo-num {
    font-family: var(--font-funnel-display), "Funnel Display", system-ui, sans-serif;
    font-weight: 800; font-size: 17px; color: ${BRAND_DARK};
    display: flex; align-items: center; gap: 9px;
}
.eval-exo-num .bar { width: 5px; height: 21px; background: ${BRAND_ORANGE}; border-radius: 3px; }
.eval-exo-meta { display: flex; align-items: center; gap: 9px; }
.eval-exo-badge { height: 30px; width: auto; display: block; }
.eval-exo-diff { font-size: 11px; font-weight: 700; }
.eval-exo-points {
    font-weight: 800; color: ${BRAND_ORANGE}; font-size: 13px;
    background: #fff3e9; border: 1px solid #ffd9bf; border-radius: 999px; padding: 2px 10px;
}
.eval-content {
    font-family: var(--font-montserrat), Montserrat, system-ui, sans-serif;
    font-size: 13px; line-height: 1.6; color: ${BRAND_DARK};
}
.eval-content p { margin: 0 0 8px; }
.eval-content h2 { font-family: var(--font-funnel-display), "Funnel Display", sans-serif; font-size: 16px; font-weight: 700; margin: 12px 0 6px; color: ${BRAND_DARK}; }
.eval-content h3 { font-size: 14px; font-weight: 700; margin: 10px 0 5px; color: ${BRAND_ORANGE}; }
.eval-content ul, .eval-content ol { margin: 0 0 8px; padding-left: 22px; }
.eval-content li { margin-bottom: 3px; }
.eval-content strong { font-weight: 700; }
.eval-content img { max-width: 100%; border-radius: 6px; margin: 6px 0; }
.eval-content blockquote { border-left: 3px solid ${BRAND_ORANGE}; background: #fff7ed; padding: 6px 12px; margin: 8px 0; border-radius: 0 6px 6px 0; }
.eval-content code { background: #fff3e6; padding: 1px 5px; border-radius: 4px; font-size: .92em; }
.eval-content .katex { font-size: 1.04em; }
.eval-lines { margin-top: 12px; }
.eval-line { height: 27px; border-bottom: 1px solid #c9c4be; }
.eval-line:first-child { border-top: 1px solid #e7e3de; }
.foxy-note {
    display: flex; align-items: center; gap: 12px;
    background: #fff7ed; border: 1px solid #ffe0c2; border-radius: 12px;
    padding: 9px 13px; margin: 10px 0;
}
.foxy-note-global { margin: 0 4px 16px; }
.foxy-art {
    font-family: ui-monospace, "Courier New", monospace;
    font-size: 8.5px; line-height: 1.04; white-space: pre; color: ${BRAND_ORANGE};
    margin: 0; flex-shrink: 0;
}
.foxy-msg { font-size: 12px; line-height: 1.45; color: #8a4d18; font-style: italic; }
.foxy-msg b { color: ${BRAND_ORANGE}; font-style: normal; font-weight: 700; }
`;

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
        });
        const img = new Image();
        const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            img.onload = () => resolve({ width: img.width || 64, height: img.height || 64 });
            img.onerror = reject;
            img.src = dataUrl;
        });
        return { dataUrl, ...dims };
    } catch {
        return null;
    }
}

export default function EvaluationPdfBuilder({
    open,
    onClose,
    onConfirm,
    defaultTitle,
    subject,
    authorName,
}: EvaluationPdfBuilderProps) {
    const [docTitle, setDocTitle] = useState(defaultTitle || "");
    const [exos, setExos] = useState<Exo[]>([newExo()]);
    const [activeId, setActiveId] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [badgeData, setBadgeData] = useState<Record<string, string>>({});
    const [evalComment, setEvalComment] = useState("");
    const [evalCommentEmotion, setEvalCommentEmotion] = useState<Emotion>("joyeux");
    const previewRef = useRef<HTMLDivElement>(null);

    // Préchargement des icônes de difficulté en data-URL (capture html2canvas fiable).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const entries = await Promise.all(
                DIFFICULTY_LEVELS.map(async (d) => {
                    const img = await loadImageAsDataUrl(difficultyBadge(d));
                    return [d, img?.dataUrl || ""] as const;
                })
            );
            if (!cancelled) setBadgeData(Object.fromEntries(entries.filter(([, v]) => v)));
        })();
        return () => { cancelled = true; };
    }, []);

    const activeIndex = useMemo(() => {
        const idx = exos.findIndex((e) => e.id === activeId);
        return idx === -1 ? 0 : idx;
    }, [exos, activeId]);
    const active = exos[activeIndex];
    const totalPoints = exos.reduce((sum, e) => sum + (e.points || 0), 0);

    if (!open) return null;

    const patchActive = (patch: Partial<Exo>) =>
        setExos((prev) => prev.map((e, i) => (i === activeIndex ? { ...e, ...patch } : e)));

    const addExo = () => {
        const exo = newExo();
        setExos((prev) => [...prev, exo]);
        setActiveId(exo.id);
    };
    const removeExo = (id: string) => {
        setExos((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.id !== id)));
        if (id === active?.id) setActiveId("");
    };
    const move = (id: string, dir: -1 | 1) => {
        setExos((prev) => {
            const i = prev.findIndex((e) => e.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= prev.length) return prev;
            const next = [...prev];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    };

    /* ───────────────── Génération PDF (manuel scolaire) ───────────────── */
    const handleGenerate = async () => {
        if (!previewRef.current) return;
        if (exos.some((e) => !e.content.trim())) {
            setError("Chaque exercice doit avoir un énoncé.");
            return;
        }
        setBusy(true);
        setError(null);

        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import("html2canvas"),
                import("jspdf"),
            ]);
            const logo = await loadImageAsDataUrl(LOGO_URL);

            const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const marginX = 42;
            const headerH = 58;
            const footerH = 36;
            const contentTop = headerH + 14;
            const contentBottom = pageH - footerH - 10;
            const contentW = pageW - marginX * 2;

            /* — Page de garde — */
            pdf.setFillColor(255, 247, 237);
            pdf.rect(0, 0, pageW, pageH, "F");
            pdf.setFillColor(255, 106, 26);
            pdf.rect(0, 0, pageW, 150, "F");
            if (logo) {
                const h = 54;
                const w = (logo.width * h) / logo.height;
                pdf.addImage(logo.dataUrl, "PNG", (pageW - w) / 2, 50, w, h);
            }
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(26);
            pdf.setTextColor(BRAND_DARK);
            pdf.text(docTitle || "Évaluation", pageW / 2, 250, { align: "center", maxWidth: contentW });
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(13);
            pdf.setTextColor(107, 107, 107);
            if (subject) pdf.text(subject, pageW / 2, 285, { align: "center" });
            pdf.text(
                `${exos.length} exercice${exos.length > 1 ? "s" : ""}  ·  Total : ${totalPoints} points`,
                pageW / 2,
                312,
                { align: "center" }
            );
            const boxY = 380;
            pdf.setDrawColor(225, 225, 225);
            pdf.setLineWidth(1);
            pdf.roundedRect(marginX + 30, boxY, contentW - 60, 110, 8, 8, "S");
            pdf.setFontSize(12);
            pdf.setTextColor(BRAND_DARK);
            pdf.text("Nom / Prénom : ____________________________________", marginX + 50, boxY + 38);
            pdf.text("Classe : ______________      Date : ______________", marginX + 50, boxY + 74);

            /* — Capture du document complet — */
            const SCALE = 2;
            const node = previewRef.current;
            await new Promise((r) => setTimeout(r, 60)); // laisse KaTeX/images se stabiliser
            const canvas = await html2canvas(node, {
                scale: SCALE,
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false,
            });

            const ratio = contentW / canvas.width;             // pt par px source
            const pageMaxPx = (contentBottom - contentTop) / ratio; // px source max par page

            // Frontières d'exercices (en px source) pour casser proprement entre exos
            const exoEls = Array.from(node.querySelectorAll<HTMLElement>("[data-exo]"));
            const bounds = exoEls.map((el) => el.offsetTop * SCALE);
            bounds.push(canvas.height);

            let pageNum = 1; // la garde est la page 1
            const emitPage = (fromPx: number, toPx: number) => {
                const slicePx = Math.max(1, toPx - fromPx);
                const slice = document.createElement("canvas");
                slice.width = canvas.width;
                slice.height = slicePx;
                slice.getContext("2d")!.drawImage(canvas, 0, fromPx, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
                pdf.addPage();
                pageNum++;
                pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", marginX, contentTop, contentW, slicePx * ratio);
            };

            // Empaquetage glouton : on remplit chaque page, en cassant aux frontières d'exos.
            let pageStart = 0;
            for (let s = 0; s < exoEls.length; s++) {
                const secTop = bounds[s];
                const secBottom = bounds[s + 1];
                const secHeight = secBottom - secTop;

                if (secHeight > pageMaxPx) {
                    // Exercice plus grand qu'une page : flush l'avant puis découpe.
                    if (secTop > pageStart) { emitPage(pageStart, secTop); pageStart = secTop; }
                    let y = secTop;
                    while (secBottom - y > pageMaxPx) {
                        emitPage(y, y + pageMaxPx);
                        y += pageMaxPx;
                    }
                    pageStart = y; // le reste continue avec les exos suivants
                } else if (secBottom - pageStart > pageMaxPx) {
                    // Ne tient plus sur la page courante : on coupe avant cet exo.
                    emitPage(pageStart, secTop);
                    pageStart = secTop;
                }
                // sinon : l'exo tient, on continue d'accumuler
            }
            if (canvas.height > pageStart + 1) emitPage(pageStart, canvas.height);

            /* — En-têtes / pieds de page — */
            const total = pageNum;
            for (let p = 1; p <= total; p++) {
                pdf.setPage(p);
                if (p > 1) {
                    if (logo) {
                        const h = 24;
                        const w = (logo.width * h) / logo.height;
                        pdf.addImage(logo.dataUrl, "PNG", marginX, 18, w, h);
                    }
                    pdf.setDrawColor(255, 106, 26);
                    pdf.setLineWidth(1);
                    pdf.line(marginX, headerH, pageW - marginX, headerH);
                    if (docTitle) {
                        pdf.setFont("helvetica", "bold");
                        pdf.setFontSize(10);
                        pdf.setTextColor(BRAND_DARK);
                        const t = docTitle.length > 55 ? docTitle.slice(0, 52) + "…" : docTitle;
                        pdf.text(t, pageW - marginX, 34, { align: "right" });
                    }
                }
                pdf.setDrawColor(232, 232, 232);
                pdf.setLineWidth(0.5);
                pdf.line(marginX, pageH - footerH, pageW - marginX, pageH - footerH);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text("workyt.fr", marginX, pageH - 18);
                if (authorName) pdf.text(`Rédacteur : ${authorName}`, pageW / 2, pageH - 18, { align: "center" });
                pdf.text(`Page ${p} / ${total}`, pageW - marginX, pageH - 18, { align: "right" });
            }

            const blob = pdf.output("blob");
            const safe = (docTitle || "evaluation").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
            const file = new File([blob], `${safe}.pdf`, { type: "application/pdf" });
            onConfirm(file);
        } catch (e) {
            console.error("[EvaluationPdfBuilder] génération échouée", e);
            setError("La génération du PDF a échoué. Réessaie.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
            <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#f97316]" />
                        <input
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            placeholder="Titre de l'évaluation"
                            className="w-72 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold focus:border-[#f97316] focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">
                            {exos.length} exo{exos.length > 1 ? "s" : ""} · {totalPoints} pts
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid flex-1 grid-cols-12 overflow-hidden">
                    {/* Colonne 1 : liste des exos */}
                    <div className="col-span-2 overflow-y-auto border-r border-gray-100 bg-gray-50/60 p-2">
                        {exos.map((e, i) => {
                            const cfg = difficultyConfig[e.difficulty];
                            return (
                                <div
                                    key={e.id}
                                    onClick={() => setActiveId(e.id)}
                                    className={`mb-1.5 cursor-pointer rounded-lg border p-2 transition-colors ${
                                        i === activeIndex ? "border-[#f97316] bg-white" : "border-transparent bg-white/70 hover:bg-white"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#37352f]">Exo {i + 1}</span>
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                    </div>
                                    <div className="mt-1 flex items-center gap-1">
                                        <button onClick={(ev) => { ev.stopPropagation(); move(e.id, -1); }} className="rounded p-0.5 text-gray-400 hover:bg-gray-100" title="Monter">
                                            <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button onClick={(ev) => { ev.stopPropagation(); move(e.id, 1); }} className="rounded p-0.5 text-gray-400 hover:bg-gray-100" title="Descendre">
                                            <ArrowDown className="h-3 w-3" />
                                        </button>
                                        {exos.length > 1 && (
                                            <button onClick={(ev) => { ev.stopPropagation(); removeExo(e.id); }} className="ml-auto rounded p-0.5 text-red-400 hover:bg-red-50" title="Supprimer">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <button
                            onClick={addExo}
                            className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-[#f97316] hover:border-[#f97316]"
                        >
                            <Plus className="h-3.5 w-3.5" /> Ajouter
                        </button>
                    </div>

                    {/* Colonne 2 : éditeur de l'exo actif */}
                    <div className="col-span-5 overflow-y-auto border-r border-gray-100 p-4">
                        {/* Mot de Foxy global (toute l'évaluation) */}
                        <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-xs font-semibold text-[#8a4d18]">🦊 Mot de Foxy — toute l&apos;évaluation (optionnel)</label>
                                <select
                                    value={evalCommentEmotion}
                                    onChange={(e) => setEvalCommentEmotion(e.target.value as Emotion)}
                                    className="rounded-md border border-orange-200 bg-white px-1.5 py-0.5 text-[11px]"
                                >
                                    {FOXY_EMOTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <textarea
                                value={evalComment}
                                onChange={(e) => setEvalComment(e.target.value)}
                                rows={2}
                                placeholder="Ex : Bonne chance ! Lis bien chaque énoncé avant de te lancer 💪"
                                className="w-full resize-y rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-sm focus:border-[#f97316] focus:outline-none"
                            />
                            <p className="mt-1 text-[10px] text-orange-700/70">Affiché en haut de la 1re page du PDF.</p>
                        </div>

                        {active && (
                            <>
                                <div className="mb-3 grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Difficulté de l&apos;exercice</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {DIFFICULTY_LEVELS.map((d) => {
                                                const cfg = difficultyConfig[d];
                                                const on = active.difficulty === d;
                                                return (
                                                    <button
                                                        key={d}
                                                        onClick={() => patchActive({ difficulty: d })}
                                                        className="rounded-lg border px-2 py-1 text-[11px] font-medium"
                                                        style={on ? { backgroundColor: cfg.color, borderColor: cfg.color, color: "#fff" } : { backgroundColor: cfg.bg, borderColor: "#e3e2e0", color: cfg.color }}
                                                    >
                                                        {d}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Barème (points)</label>
                                        <input
                                            type="number" min={0} max={100}
                                            value={active.points}
                                            onChange={(e) => patchActive({ points: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#f97316] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Lignes de réponse</label>
                                        <input
                                            type="number" min={0} max={40}
                                            value={active.answerLines}
                                            onChange={(e) => patchActive({ answerLines: Math.max(0, Math.min(40, parseInt(e.target.value) || 0)) })}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#f97316] focus:outline-none"
                                        />
                                        <p className="mt-0.5 text-[10px] text-gray-400">Espace blanc pour la réponse de l&apos;élève</p>
                                    </div>
                                </div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Énoncé (texte, images, LaTeX, dessins)</label>
                                <FicheEditor
                                    key={active.id}
                                    value={active.content}
                                    onChange={(md) => patchActive({ content: md })}
                                    placeholder="Énoncé de l'exercice…"
                                />

                                {/* Mot de Foxy sur cet exercice */}
                                <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="text-xs font-semibold text-[#8a4d18]">🦊 Commentaire de Foxy sur cet exercice (optionnel)</label>
                                        <select
                                            value={active.commentEmotion || "joyeux"}
                                            onChange={(e) => patchActive({ commentEmotion: e.target.value as Emotion })}
                                            className="rounded-md border border-orange-200 bg-white px-1.5 py-0.5 text-[11px]"
                                        >
                                            {FOXY_EMOTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <textarea
                                        value={active.comment || ""}
                                        onChange={(e) => patchActive({ comment: e.target.value })}
                                        rows={2}
                                        placeholder="Ex : Pense à justifier chaque étape 😉"
                                        className="w-full resize-y rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-sm focus:border-[#f97316] focus:outline-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Colonne 3 : aperçu PDF (style manuel) */}
                    <div className="col-span-5 overflow-auto bg-gray-200 p-4">
                        <style>{TEXTBOOK_CSS}</style>
                        <div ref={previewRef} className="eval-doc mx-auto shadow-sm">
                            {evalComment.trim() && (
                                <div className="foxy-note foxy-note-global">
                                    <pre className="foxy-art">{getMascot("foxy", evalCommentEmotion)}</pre>
                                    <div className="foxy-msg"><b>Foxy :</b> {evalComment}</div>
                                </div>
                            )}
                            {exos.map((e, i) => {
                                const cfg = difficultyConfig[e.difficulty];
                                const badge = badgeData[e.difficulty];
                                return (
                                    <section key={e.id} data-exo className="eval-exo">
                                        <div className="eval-exo-head">
                                            <span className="eval-exo-num">
                                                <span className="bar" />
                                                Exercice {i + 1}
                                            </span>
                                            <span className="eval-exo-meta">
                                                {badge ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={badge} alt={e.difficulty} className="eval-exo-badge" />
                                                ) : null}
                                                <span className="eval-exo-diff" style={{ color: cfg.color }}>{e.difficulty}</span>
                                                <span className="eval-exo-points">/ {e.points} pts</span>
                                            </span>
                                        </div>
                                        <div className="eval-content">
                                            <ReactMarkdown
                                                remarkPlugins={sharedRemarkPlugins}
                                                rehypePlugins={sharedRehypePlugins as any}
                                                components={{
                                                    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                                                    img: (props: any) => <img {...props} src={proxyImg(props.src)} crossOrigin="anonymous" />,
                                                }}
                                            >
                                                {e.content || "_Énoncé à compléter…_"}
                                            </ReactMarkdown>
                                            {e.comment?.trim() && (
                                                <div className="foxy-note">
                                                    <pre className="foxy-art">{getMascot("foxy", e.commentEmotion || "joyeux")}</pre>
                                                    <div className="foxy-msg"><b>Foxy :</b> {e.comment}</div>
                                                </div>
                                            )}
                                            {e.answerLines > 0 && (
                                                <div className="eval-lines">
                                                    {Array.from({ length: e.answerLines }).map((_, li) => (
                                                        <div key={li} className="eval-line" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                    {error ? <p className="text-sm text-red-600">{error}</p> : <span className="text-xs text-gray-400">Mise en page « manuel » : les pages se remplissent et cassent proprement entre les exercices.</span>}
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Annuler</button>
                        <button
                            onClick={handleGenerate}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#1a1512] px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                        >
                            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération…</> : <>Générer le PDF</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
