"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { X, Loader2, FileText, Eye, EyeOff } from "lucide-react";
import FicheEditor from "./FicheEditor";
import { generateGradientBackground } from "./pdfBackground";
import TemplatePicker from "./TemplatePicker";
import type { FicheTemplate } from "./ficheTemplates";

interface PdfComposerModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (pdf: File) => void;
    defaultTitle?: string;
    subject?: string;
    level?: string;
    authorName?: string;
}

const BRAND_ORANGE = "#ff6a1a";
const BRAND_DARK = "#1a1512";
const BRAND_GRAY = "#6b6b6b";

const LOGO_URL = "/Workyt%20Logo%202026.png";

const PDF_CONTENT_CSS = `
.workyt-pdf-content {
    color: ${BRAND_DARK};
    font-family: var(--font-montserrat), Montserrat, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.55;
}
.workyt-pdf-content h1 {
    font-family: var(--font-funnel-display), Funnel Display, system-ui, sans-serif;
    font-weight: 800; color: ${BRAND_DARK}; font-size: 26px;
    margin: 0 0 8px; padding-bottom: 8px; border-bottom: 3px solid ${BRAND_ORANGE};
}
.workyt-pdf-content h2 {
    font-family: var(--font-funnel-display), Funnel Display, system-ui, sans-serif;
    font-weight: 700; color: ${BRAND_DARK}; font-size: 19px;
    margin: 22px 0 10px; padding-left: 10px; border-left: 4px solid ${BRAND_ORANGE};
}
.workyt-pdf-content h3 {
    font-family: var(--font-funnel-display), Funnel Display, system-ui, sans-serif;
    color: ${BRAND_ORANGE}; font-size: 16px; margin: 18px 0 6px;
}
.workyt-pdf-content p { margin: 0 0 10px; }
.workyt-pdf-content strong { color: ${BRAND_DARK}; }
.workyt-pdf-content a { color: ${BRAND_ORANGE}; text-decoration: underline; }
.workyt-pdf-content ul, .workyt-pdf-content ol { margin: 0 0 12px; padding-left: 22px; }
.workyt-pdf-content li { margin-bottom: 4px; }
.workyt-pdf-content blockquote {
    border-left: 4px solid ${BRAND_ORANGE}; background: #fff7ed;
    color: ${BRAND_DARK}; padding: 10px 14px; margin: 12px 0;
    font-style: italic; border-radius: 0 6px 6px 0;
}
.workyt-pdf-content code {
    background: #fff3e6; color: ${BRAND_DARK}; padding: 2px 6px;
    border-radius: 4px; font-size: 0.92em;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.workyt-pdf-content pre {
    background: #f6f6f6; padding: 12px; border-radius: 6px; overflow-x: auto;
    margin: 12px 0; border-left: 4px solid ${BRAND_ORANGE};
}
.workyt-pdf-content pre code { background: transparent; padding: 0; }
.workyt-pdf-content table { width: 100%; border-collapse: collapse; margin: 12px 0; }
.workyt-pdf-content th, .workyt-pdf-content td {
    border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left;
}
.workyt-pdf-content th { background: #fff3e6; color: ${BRAND_DARK}; font-weight: 600; }
.workyt-pdf-content img { max-width: 100%; border-radius: 6px; margin: 10px 0; }
.workyt-pdf-content hr {
    border: none; border-top: 2px dashed ${BRAND_ORANGE}; margin: 18px 0;
}
.workyt-pdf-content .katex-display {
    background: #fffaf3; border-radius: 6px; padding: 10px 8px;
    margin: 10px 0; border: 1px solid #ffe1c4;
}
`;

function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

const PreviewPane = memo(function PreviewPane({ markdown }: { markdown: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {markdown}
        </ReactMarkdown>
    );
});

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
    });
    const img = new Image();
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = dataUrl;
    });
    return { dataUrl, width, height };
}

export default function PdfComposerModal({
    open,
    onClose,
    onConfirm,
    defaultTitle,
    subject,
    level,
    authorName,
}: PdfComposerModalProps) {
    const [docTitle, setDocTitle] = useState(defaultTitle || "");
    const [markdown, setMarkdown] = useState("");
    const [coverPage, setCoverPage] = useState(true);
    const [showPreview, setShowPreview] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const debouncedMarkdown = useDebouncedValue(markdown, 400);
    const previewMarkdown = useMemo(() => debouncedMarkdown, [debouncedMarkdown]);

    useEffect(() => {
        if (open) {
            setError(null);
            setBusy(false);
            if (defaultTitle && !docTitle) setDocTitle(defaultTitle);
        }
    }, [open, defaultTitle, docTitle]);

    const handleConfirm = async () => {
        if (!previewRef.current) return;
        setBusy(true);
        setError(null);
        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import("html2canvas"),
                import("jspdf"),
            ]);

            const logo = await loadImageAsDataUrl(LOGO_URL).catch(() => null);

            const node = previewRef.current!;
            await new Promise((r) => setTimeout(r, 50));
            const CAPTURE_SCALE = 2;
            const canvas = await html2canvas(node, {
                scale: CAPTURE_SCALE,
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false,
            });

            // Extraction des titres pour le sommaire (positions calculées AVANT la pagination)
            const headingEls = node.querySelectorAll<HTMLElement>("h1, h2");
            const rawHeadings = Array.from(headingEls).map((el) => ({
                level: el.tagName === "H1" ? 1 : 2,
                text: (el.textContent || "").trim(),
                canvasY: el.offsetTop * CAPTURE_SCALE,
            }));
            const hasTOC = rawHeadings.length >= 2;

            const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const marginX = 40;
            const headerHeight = 64;
            const footerHeight = 40;
            const contentTop = headerHeight + 16;
            const contentBottom = pageHeight - footerHeight - 8;
            const contentHeight = contentBottom - contentTop;
            const contentWidth = pageWidth - marginX * 2;

            const drawHeader = (pageNum: number) => {
                if (pageNum === 1 && coverPage) return;
                if (logo) {
                    const logoH = 28;
                    const logoW = (logo.width * logoH) / logo.height;
                    pdf.addImage(logo.dataUrl, "PNG", marginX, 20, logoW, logoH);
                }
                if (docTitle) {
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(11);
                    pdf.setTextColor(BRAND_DARK);
                    const safeTitle = docTitle.length > 60 ? docTitle.slice(0, 57) + "…" : docTitle;
                    pdf.text(safeTitle, pageWidth - marginX, 38, { align: "right", maxWidth: pageWidth - marginX * 2 - 140 });
                }
                pdf.setDrawColor(BRAND_ORANGE);
                pdf.setLineWidth(1);
                pdf.line(marginX, headerHeight, pageWidth - marginX, headerHeight);
            };

            const drawFooter = (pageNum: number, totalPages: number) => {
                pdf.setDrawColor(230, 230, 230);
                pdf.setLineWidth(0.5);
                pdf.line(marginX, pageHeight - footerHeight, pageWidth - marginX, pageHeight - footerHeight);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(9);
                pdf.setTextColor(BRAND_GRAY);
                pdf.text("workyt.fr", marginX, pageHeight - 20);
                if (authorName) {
                    pdf.text(`Auteur : ${authorName}`, pageWidth / 2, pageHeight - 20, { align: "center" });
                }
                pdf.text(`Page ${pageNum} / ${totalPages}`, pageWidth - marginX, pageHeight - 20, { align: "right" });
            };

            const drawCoverPage = () => {
                // Fond grainy gradient déterministe selon matière + niveau
                try {
                    const bg = generateGradientBackground(
                        subject || "Workyt",
                        level || "",
                        Math.round(pageWidth * 1.5),
                        Math.round(pageHeight * 1.5),
                    );
                    if (bg) {
                        pdf.addImage(bg, "JPEG", 0, 0, pageWidth, pageHeight);
                    }
                } catch (e) {
                    console.warn("Impossible de générer le fond gradient", e);
                }

                // Carte blanche centrée pour garder la lisibilité du texte
                const cardW = pageWidth - 80;
                const cardH = 360;
                const cardX = 40;
                const cardY = (pageHeight - cardH) / 2;
                pdf.setFillColor(255, 255, 255);
                pdf.roundedRect(cardX, cardY, cardW, cardH, 12, 12, "F");

                if (logo) {
                    const logoH = 70;
                    const logoW = (logo.width * logoH) / logo.height;
                    pdf.addImage(logo.dataUrl, "PNG", (pageWidth - logoW) / 2, cardY + 40, logoW, logoH);
                }

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(26);
                pdf.setTextColor(BRAND_DARK);
                const titleLines = pdf.splitTextToSize(docTitle || "Fiche de révision", cardW - 60);
                const titleY = cardY + 150;
                pdf.text(titleLines, pageWidth / 2, titleY, { align: "center" });

                pdf.setDrawColor(BRAND_ORANGE);
                pdf.setLineWidth(2.5);
                const lineY = titleY + 14 + titleLines.length * 18;
                pdf.line(pageWidth / 2 - 28, lineY, pageWidth / 2 + 28, lineY);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(13);
                pdf.setTextColor(BRAND_GRAY);
                let metaY = lineY + 30;
                if (subject || level) {
                    const parts = [subject, level].filter(Boolean).join("  ·  ");
                    pdf.text(parts, pageWidth / 2, metaY, { align: "center" });
                    metaY += 20;
                }
                if (authorName) {
                    pdf.setFontSize(11);
                    pdf.text(`par ${authorName}`, pageWidth / 2, metaY, { align: "center" });
                    metaY += 16;
                }
                pdf.setFontSize(10);
                pdf.setTextColor(160, 160, 160);
                const dateStr = new Date().toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                });
                pdf.text(dateStr, pageWidth / 2, metaY, { align: "center" });

                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(10);
                pdf.setTextColor(BRAND_ORANGE);
                pdf.text("Fiche de révision — workyt.fr", pageWidth / 2, pageHeight - 50, { align: "center" });
            };

            const slicePx = Math.floor((contentHeight * canvas.width) / contentWidth);
            const pages: HTMLCanvasElement[] = [];
            let yOffset = 0;
            while (yOffset < canvas.height) {
                const h = Math.min(slicePx, canvas.height - yOffset);
                const slice = document.createElement("canvas");
                slice.width = canvas.width;
                slice.height = h;
                const ctx = slice.getContext("2d");
                if (!ctx) break;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, slice.width, slice.height);
                ctx.drawImage(canvas, 0, yOffset, canvas.width, h, 0, 0, canvas.width, h);
                pages.push(slice);
                yOffset += h;
            }

            const coverCount = coverPage ? 1 : 0;
            const tocCount = hasTOC ? 1 : 0;
            const totalPages = coverCount + tocCount + pages.length;

            const headingsWithPage = rawHeadings.map((h) => {
                const pageInContent = Math.min(pages.length - 1, Math.floor(h.canvasY / slicePx));
                return { ...h, finalPage: coverCount + tocCount + 1 + pageInContent };
            });

            const drawTOCPage = (pageNum: number) => {
                drawHeader(pageNum);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(22);
                pdf.setTextColor(BRAND_DARK);
                pdf.text("Sommaire", marginX, contentTop + 20);
                pdf.setDrawColor(BRAND_ORANGE);
                pdf.setLineWidth(2);
                pdf.line(marginX, contentTop + 30, marginX + 50, contentTop + 30);

                let y = contentTop + 60;
                pdf.setFont("helvetica", "normal");
                for (const h of headingsWithPage) {
                    if (y > contentBottom - 20) break;
                    const indent = h.level === 2 ? 20 : 0;
                    pdf.setFontSize(h.level === 1 ? 13 : 11);
                    pdf.setTextColor(h.level === 1 ? BRAND_DARK : "#555555");
                    const maxTextW = pageWidth - marginX * 2 - indent - 50;
                    const fitted = pdf.splitTextToSize(h.text, maxTextW)[0] || h.text;
                    pdf.text(fitted, marginX + indent, y);
                    const tw = pdf.getTextWidth(fitted);
                    pdf.setDrawColor(220, 220, 220);
                    pdf.setLineWidth(0.5);
                    pdf.line(marginX + indent + tw + 4, y - 2, pageWidth - marginX - 28, y - 2);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(BRAND_ORANGE);
                    pdf.text(String(h.finalPage), pageWidth - marginX, y, { align: "right" });
                    pdf.setFont("helvetica", "normal");
                    y += h.level === 1 ? 22 : 18;
                }
                drawFooter(pageNum, totalPages);
            };

            let pageIndex = 1;

            if (coverPage) {
                drawCoverPage();
                drawFooter(pageIndex, totalPages);
                pageIndex++;
                pdf.addPage();
            }

            if (hasTOC) {
                drawTOCPage(pageIndex);
                pageIndex++;
                if (pages.length > 0) pdf.addPage();
            }

            for (let i = 0; i < pages.length; i++) {
                const slice = pages[i];
                const sliceHeightPt = (slice.height * contentWidth) / slice.width;
                drawHeader(pageIndex);
                pdf.addImage(slice.toDataURL("image/png"), "PNG", marginX, contentTop, contentWidth, sliceHeightPt);
                drawFooter(pageIndex, totalPages);
                pageIndex++;
                if (i < pages.length - 1) pdf.addPage();
            }

            const safeTitle =
                (docTitle || "fiche").replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "fiche";
            const blob = pdf.output("blob");
            const file = new File([blob], `${safeTitle}.pdf`, { type: "application/pdf" });
            onConfirm(file);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Erreur lors de la génération du PDF");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-x-0 bottom-0 top-[88px] sm:top-[96px] z-40 bg-black/40 flex items-stretch justify-center p-2 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !busy) onClose();
            }}
        >
            <div className="flex flex-col w-full max-w-7xl bg-white rounded-lg shadow-2xl overflow-hidden">
                <style dangerouslySetInnerHTML={{ __html: PDF_CONTENT_CSS }} />
                <div className="flex items-center justify-between bg-white px-4 py-2 border-b">
                    <h2 className="font-semibold inline-flex items-center gap-2">
                        <FileText size={18} /> Rédiger une fiche (PDF)
                    </h2>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setShowPreview((v) => !v)}
                            className="hidden lg:inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-black px-2 py-1 rounded hover:bg-gray-100"
                            title={showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                        >
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPreview ? "Masquer aperçu" : "Aperçu"}
                        </button>
                        <label className="hidden sm:inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={coverPage}
                                onChange={(e) => setCoverPage(e.target.checked)}
                                className="accent-orange-500"
                            />
                            Page de garde
                        </label>
                        {error && <span className="text-sm text-red-600">{error}</span>}
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={busy || !markdown.trim()}
                            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                        >
                            {busy && <Loader2 size={14} className="animate-spin" />}
                            {busy ? "Génération…" : "Générer le PDF"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 ${showPreview ? "lg:max-w-[60%]" : ""}`}>
                        <div className="mb-4">
                            <label htmlFor="pdf-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Titre du document
                            </label>
                            <input
                                id="pdf-title"
                                type="text"
                                value={docTitle}
                                onChange={(e) => setDocTitle(e.target.value)}
                                placeholder="Ex. Théorèmes de Thalès — résumé"
                                className="w-full p-3 border border-gray-300 rounded bg-white text-black"
                                maxLength={120}
                            />
                            <label className="sm:hidden inline-flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={coverPage}
                                    onChange={(e) => setCoverPage(e.target.checked)}
                                    className="accent-orange-500"
                                />
                                Ajouter une page de garde
                            </label>
                        </div>

                        {markdown.trim().length === 0 && (
                            <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50/60">
                                <TemplatePicker
                                    onPick={(tpl: FicheTemplate) => setMarkdown(tpl.content)}
                                />
                            </div>
                        )}

                        <FicheEditor
                            value={markdown}
                            onChange={setMarkdown}
                            placeholder="Rédige ici… utilise la barre d'outils pour les titres, formules ($\frac{a}{b}$), listes, etc."
                        />
                    </div>

                    {showPreview && (
                        <div className="hidden lg:flex flex-col w-2/5 border-l border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Aperçu PDF</span>
                                <span className="text-[10px] text-gray-400">
                                    {markdown !== debouncedMarkdown ? "Mise à jour…" : "À jour"}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="bg-white rounded shadow-sm p-6 mx-auto" style={{ maxWidth: 600 }}>
                                    <div className="workyt-pdf-content prose max-w-none">
                                        {previewMarkdown.trim() ? (
                                            <PreviewPane markdown={previewMarkdown} />
                                        ) : (
                                            <p className="text-gray-400 italic text-sm">
                                                L'aperçu apparaîtra ici dès que tu commences à écrire.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden preview used for PDF rendering — branded styling */}
                    <div
                        style={{
                            position: "fixed",
                            left: "-99999px",
                            top: 0,
                            width: 800,
                            backgroundColor: "#ffffff",
                            padding: 32,
                        }}
                    >
                        <div
                            ref={previewRef}
                            className="workyt-pdf-content prose max-w-none"
                            style={{ width: 800 - 64 }}
                        >
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                {markdown}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
