"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
    Download,
    ChevronUp,
    ChevronDown,
    FileText,
    Maximize2,
    X,
    Loader2,
    ZoomIn,
    ZoomOut,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
    blobUrl: string;
    proxyUrl: string;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    /** Contenu placé à gauche de la barre d'outils (ex. navigation entre fichiers) */
    headerStart?: React.ReactNode;
    /** Page et zoom de départ (conservés lors de la bascule plein écran) */
    initialPage?: number;
    initialZoomIndex?: number;
    onViewChange?: (view: { page: number; zoomIndex: number }) => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 2;
/** Pages rendues de part et d'autre de la page courante ; les autres sont des emplacements vides. */
const RENDER_WINDOW = 2;
const PAGE_GAP = 16;

const toolBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--wk-ink)] transition hover:bg-[var(--wk-paper-2)] disabled:pointer-events-none disabled:opacity-30";

/**
 * Lecteur PDF des fiches : pages en défilement continu, barre d'outils fixe
 * en haut (page, zoom, téléchargement, plein écran). Le plein écran lui-même
 * est géré par FileViewer (portail au-dessus de la navbar).
 */
const PdfViewer: React.FC<PdfViewerProps> = ({ blobUrl, proxyUrl, isFullscreen, toggleFullscreen, headerStart, initialPage = 1, initialZoomIndex = DEFAULT_ZOOM_INDEX, onViewChange }) => {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageDraft, setPageDraft] = useState<string | null>(null);
    const [zoomIndex, setZoomIndex] = useState(initialZoomIndex);
    const [containerWidth, setContainerWidth] = useState(0);
    const [ratio, setRatio] = useState(1.414); // hauteur / largeur, A4 par défaut
    const scrollerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const pendingScroll = useRef(initialPage > 1 ? initialPage : 0);

    const scale = ZOOM_LEVELS[zoomIndex];

    // Largeur disponible, suivie en continu (redimensionnement, bascule plein écran)
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        onViewChange?.({ page: currentPage, zoomIndex });
    }, [currentPage, zoomIndex, onViewChange]);

    // Reprise à la page mémorisée, une fois les emplacements de pages en place
    useEffect(() => {
        const target = pendingScroll.current;
        if (!target || !numPages || !containerWidth) return;
        const el = pageRefs.current[target - 1];
        const scroller = scrollerRef.current;
        if (el && scroller) {
            scroller.scrollTop = el.offsetTop - PAGE_GAP;
            pendingScroll.current = 0;
        }
    }, [numPages, containerWidth]);

    const pageWidth = containerWidth > 0
        ? Math.max(200, Math.min(containerWidth - 32, isFullscreen ? 1000 : 900)) * scale
        : undefined;

    const onDocumentLoadSuccess = useCallback((pdf: { numPages: number; getPage: (n: number) => Promise<{ view: number[] }> }) => {
        setNumPages(pdf.numPages);
        pdf.getPage(1).then((p) => {
            const [x1, y1, x2, y2] = p.view;
            if (x2 - x1 > 0) setRatio((y2 - y1) / (x2 - x1));
        }).catch(() => {});
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error("react-pdf load error:", error);
    }, []);

    const goToPage = useCallback((n: number) => {
        const target = Math.min(Math.max(1, n), numPages || 1);
        const el = pageRefs.current[target - 1];
        const scroller = scrollerRef.current;
        if (el && scroller) scroller.scrollTo({ top: el.offsetTop - PAGE_GAP, behavior: "smooth" });
        setCurrentPage(target);
    }, [numPages]);

    // Page courante = celle qui occupe le tiers haut de la zone visible
    const handleScroll = () => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const probe = scroller.scrollTop + scroller.clientHeight / 3;
        let page = 1;
        for (let i = 0; i < pageRefs.current.length; i++) {
            const el = pageRefs.current[i];
            if (el && el.offsetTop <= probe) page = i + 1;
        }
        if (page !== currentPage) setCurrentPage(page);
    };

    const handleDownload = () => window.open(proxyUrl, "_blank");
    const zoomIn = () => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
    const zoomOut = () => setZoomIndex((i) => Math.max(0, i - 1));

    // Raccourcis clavier, uniquement en plein écran (sinon ils gêneraient la page)
    useEffect(() => {
        if (!isFullscreen) return;
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
            if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goToPage(currentPage + 1); }
            else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goToPage(currentPage - 1); }
            else if (e.key === "+" || e.key === "=") zoomIn();
            else if (e.key === "-") zoomOut();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isFullscreen, currentPage, goToPage]);

    const commitPageDraft = () => {
        if (pageDraft !== null) {
            const n = parseInt(pageDraft, 10);
            if (!Number.isNaN(n)) goToPage(n);
        }
        setPageDraft(null);
    };

    const placeholderHeight = pageWidth ? pageWidth * ratio : 600;

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Barre d'outils */}
            <div className="flex shrink-0 items-center gap-1 border-b border-[rgba(26,21,18,0.08)] bg-white px-2 py-1.5 sm:gap-2 sm:px-3">
                <div className="flex min-w-0 flex-1 items-center gap-1">{headerStart}</div>

                {/* Pages */}
                <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className={toolBtn} aria-label="Page précédente">
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <label className="flex items-center gap-1 text-sm text-[rgba(26,21,18,0.6)]">
                        <span className="sr-only">Aller à la page</span>
                        <input
                            inputMode="numeric"
                            value={pageDraft ?? String(currentPage)}
                            onChange={(e) => setPageDraft(e.target.value.replace(/\D/g, ""))}
                            onFocus={(e) => e.target.select()}
                            onBlur={commitPageDraft}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className="h-8 w-10 rounded-lg border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] text-center text-sm font-semibold text-[var(--wk-ink)] outline-none focus:border-[var(--wk-accent)]"
                        />
                        <span className="whitespace-nowrap">/ {numPages || "…"}</span>
                    </label>
                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages} className={toolBtn} aria-label="Page suivante">
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>

                <span className="mx-1 hidden h-5 w-px bg-[rgba(26,21,18,0.1)] sm:block" />

                {/* Zoom */}
                <div className="hidden items-center gap-0.5 sm:flex">
                    <button type="button" onClick={zoomOut} disabled={zoomIndex <= 0} className={toolBtn} aria-label="Dézoomer">
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)}
                        className="min-w-[48px] rounded-full px-1.5 py-1 text-xs font-semibold text-[rgba(26,21,18,0.7)] hover:bg-[var(--wk-paper-2)]"
                        title="Ajuster à la largeur"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button type="button" onClick={zoomIn} disabled={zoomIndex >= ZOOM_LEVELS.length - 1} className={toolBtn} aria-label="Zoomer">
                        <ZoomIn className="h-4 w-4" />
                    </button>
                </div>

                <span className="mx-1 hidden h-5 w-px bg-[rgba(26,21,18,0.1)] sm:block" />

                <button type="button" onClick={handleDownload} className={toolBtn} aria-label="Télécharger" title="Télécharger">
                    <Download className="h-4 w-4" />
                </button>
                {isFullscreen ? (
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--wk-ink)] px-3.5 text-sm font-semibold text-[var(--wk-paper)] transition hover:bg-black"
                        title="Quitter le plein écran (Échap)"
                    >
                        <X className="h-4 w-4" /> <span className="hidden sm:inline">Fermer</span>
                    </button>
                ) : (
                    <button type="button" onClick={toggleFullscreen} className={toolBtn} aria-label="Plein écran" title="Plein écran">
                        <Maximize2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Pages en défilement continu */}
            <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-auto bg-[var(--wk-paper-2)]"
            >
                <Document
                    file={blobUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-[var(--wk-accent)]" />
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center justify-center gap-4 py-20">
                            <FileText size={48} className="text-[rgba(26,21,18,0.25)]" />
                            <p className="text-[rgba(26,21,18,0.6)]">Erreur de chargement du PDF</p>
                            <button type="button" onClick={handleDownload} className="wk-btn-orange !py-2 text-sm">
                                <Download size={16} /> Télécharger
                            </button>
                        </div>
                    }
                    className="flex flex-col items-center px-4"
                >
                    {Array.from({ length: numPages }, (_, i) => {
                        const n = i + 1;
                        const visible = Math.abs(n - currentPage) <= RENDER_WINDOW;
                        return (
                            <div
                                key={n}
                                ref={(el) => { pageRefs.current[i] = el; }}
                                style={{ paddingTop: PAGE_GAP, paddingBottom: n === numPages ? PAGE_GAP * 2 : 0 }}
                            >
                                {visible ? (
                                    <Page
                                        pageNumber={n}
                                        width={pageWidth}
                                        loading={<div style={{ width: pageWidth, height: placeholderHeight }} className="bg-white" />}
                                        className="overflow-hidden rounded-md shadow-[0_6px_24px_rgba(26,21,18,0.12)]"
                                    />
                                ) : (
                                    <div style={{ width: pageWidth, height: placeholderHeight }} className="rounded-md bg-white/70" />
                                )}
                            </div>
                        );
                    })}
                </Document>
            </div>
        </div>
    );
};

export default PdfViewer;
