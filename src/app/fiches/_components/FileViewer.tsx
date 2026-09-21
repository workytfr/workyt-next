"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    Maximize2,
    X,
    Loader2,
} from "lucide-react";

// Import dynamique pour éviter DOMMatrix SSR crash (pdfjs-dist utilise des API navigateur)
const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

interface FileViewerProps {
    ficheId: string;
    files: string[];
}

const toolBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--wk-ink)] transition hover:bg-[var(--wk-paper-2)] disabled:pointer-events-none disabled:opacity-30";

const FileViewer: React.FC<FileViewerProps> = ({ ficheId, files }) => {
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageErrorSrc, setImageErrorSrc] = useState<string | null>(null);
    const [pdfState, setPdfState] = useState<{ src: string; blobUrl: string | null; error: boolean } | null>(null);
    // Page et zoom du lecteur PDF, repris quand on entre / sort du plein écran
    const liveView = useRef<{ page: number; zoomIndex: number } | null>(null);
    const [savedView, setSavedView] = useState<{ page: number; zoomIndex: number } | null>(null);
    const rememberView = useCallback((v: { page: number; zoomIndex: number }) => { liveView.current = v; }, []);

    const currentFile = files[currentFileIndex];
    const proxyUrl = `/api/file-proxy?ficheId=${ficheId}&index=${currentFileIndex}`;

    const isPdf = (url: string): boolean => {
        const path = url.split("?")[0];
        return path.toLowerCase().endsWith(".pdf");
    };

    const currentIsPdf = isPdf(currentFile);
    const pdfReady = pdfState?.src === proxyUrl ? pdfState : null;
    const loading = currentIsPdf && !pdfReady;
    const blobUrl = pdfReady?.blobUrl ?? null;
    const fetchError = !!pdfReady?.error;
    const imageError = imageErrorSrc === proxyUrl;

    // Fetch PDF via proxy → Blob URL. L'état est rattaché à l'URL chargée :
    // tant qu'il ne correspond pas au fichier courant, on est en chargement.
    useEffect(() => {
        if (!currentIsPdf) return;
        let cancelled = false;
        let created: string | null = null;

        fetch(proxyUrl)
            .then((res) => {
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                created = URL.createObjectURL(blob);
                setPdfState({ src: proxyUrl, blobUrl: created, error: false });
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Erreur chargement fichier:", err);
                setPdfState({ src: proxyUrl, blobUrl: null, error: true });
            });

        return () => {
            cancelled = true;
            if (created) URL.revokeObjectURL(created);
        };
    }, [currentIsPdf, proxyUrl]);

    // Plein écran : on bloque le défilement de la page et Échap referme
    useEffect(() => {
        if (!isFullscreen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSavedView(liveView.current);
                setIsFullscreen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [isFullscreen]);

    const handleDownload = () => window.open(proxyUrl, "_blank");
    const handleNextFile = () => {
        if (currentFileIndex < files.length - 1) { liveView.current = null; setSavedView(null); setCurrentFileIndex(currentFileIndex + 1); }
    };
    const handlePreviousFile = () => {
        if (currentFileIndex > 0) { liveView.current = null; setSavedView(null); setCurrentFileIndex(currentFileIndex - 1); }
    };
    const toggleFullscreen = () => {
        setSavedView(liveView.current);
        setIsFullscreen(!isFullscreen);
    };

    // Navigation entre fichiers (placée dans la barre d'outils)
    const fileNav = files.length > 1 ? (
        <div className="flex items-center gap-0.5">
            <button type="button" onClick={handlePreviousFile} disabled={currentFileIndex === 0} className={toolBtn} aria-label="Fichier précédent">
                <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="whitespace-nowrap text-xs font-semibold text-[rgba(26,21,18,0.65)]">
                <span className="hidden sm:inline">Fichier </span>{currentFileIndex + 1}/{files.length}
            </span>
            <button type="button" onClick={handleNextFile} disabled={currentFileIndex === files.length - 1} className={toolBtn} aria-label="Fichier suivant">
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    ) : (
        <span className="hidden items-center gap-1.5 pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(26,21,18,0.5)] sm:inline-flex">
            {currentIsPdf ? <FileText className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            {currentIsPdf ? "Document PDF" : "Image"}
        </span>
    );

    const renderContent = () => {
        if (currentIsPdf) {
            if (loading) {
                return (
                    <div className="flex h-full flex-col items-center justify-center py-16">
                        <Loader2 size={32} className="mb-3 animate-spin text-[var(--wk-accent)]" />
                        <p className="text-sm text-[rgba(26,21,18,0.55)]">Chargement du document…</p>
                    </div>
                );
            }
            if (fetchError || !blobUrl) {
                return (
                    <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
                        <FileText size={48} className="mb-4 text-[rgba(26,21,18,0.25)]" />
                        <p className="mb-4 text-[rgba(26,21,18,0.65)]">Impossible de charger le PDF.</p>
                        <button type="button" onClick={handleDownload} className="wk-btn-orange !py-2 text-sm">
                            <Download size={16} /> Télécharger le fichier
                        </button>
                    </div>
                );
            }
            return (
                <PdfViewer
                    key={blobUrl}
                    blobUrl={blobUrl}
                    proxyUrl={proxyUrl}
                    isFullscreen={isFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    headerStart={fileNav}
                    initialPage={savedView?.page}
                    initialZoomIndex={savedView?.zoomIndex}
                    onViewChange={rememberView}
                />
            );
        }

        // Image
        return (
            <div className="flex h-full flex-col bg-white">
                <div className="flex shrink-0 items-center gap-1 border-b border-[rgba(26,21,18,0.08)] px-2 py-1.5 sm:gap-2 sm:px-3">
                    <div className="flex min-w-0 flex-1 items-center">{fileNav}</div>
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
                <div className="flex flex-1 items-center justify-center overflow-auto bg-[var(--wk-paper-2)] p-4">
                    {imageError ? (
                        <div className="flex flex-col items-center py-16 text-center">
                            <ImageIcon size={48} className="mb-4 text-[rgba(26,21,18,0.25)]" />
                            <p className="mb-4 text-[rgba(26,21,18,0.65)]">Impossible d&apos;afficher l&apos;image.</p>
                            <button type="button" onClick={handleDownload} className="wk-btn-orange !py-2 text-sm">
                                <Download size={16} /> Télécharger le fichier
                            </button>
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={proxyUrl}
                            alt="Fichier attaché"
                            className={`max-w-full object-contain rounded-md shadow-[0_6px_24px_rgba(26,21,18,0.12)] ${isFullscreen ? "max-h-full" : "max-h-[75vh] cursor-zoom-in"}`}
                            onClick={isFullscreen ? undefined : toggleFullscreen}
                            onError={() => setImageErrorSrc(proxyUrl)}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Plein écran : rendu dans <body>, au-dessus de la navbar (z-[100]) et de ses menus (z-[200]) */}
            {isFullscreen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[300] flex flex-col bg-[var(--wk-paper-2)]"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Lecture en plein écran"
                    >
                        {renderContent()}
                    </div>,
                    document.body
                )}

            {/* Vue normale (masquée pendant le plein écran pour ne pas charger deux lecteurs) */}
            <div
                className="overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white"
                style={currentIsPdf ? { height: "80vh", minHeight: 500 } : undefined}
            >
                {isFullscreen ? (
                    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 bg-[var(--wk-paper-2)] p-6 text-center">
                        <Maximize2 className="h-6 w-6 text-[rgba(26,21,18,0.35)]" />
                        <p className="text-sm text-[rgba(26,21,18,0.6)]">Lecture en plein écran</p>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </>
    );
};

export default FileViewer;
