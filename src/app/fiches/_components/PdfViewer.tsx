"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
    Maximize2,
    Minimize2,
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
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 2;

const PdfViewer: React.FC<PdfViewerProps> = ({ blobUrl, proxyUrl, isFullscreen, toggleFullscreen }) => {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const scale = ZOOM_LEVELS[zoomIndex];

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, [isFullscreen]);

    useEffect(() => {
        setCurrentPage(1);
        setNumPages(0);
        setZoomIndex(DEFAULT_ZOOM_INDEX);
    }, [blobUrl]);

    const onDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
        setNumPages(total);
        setCurrentPage(1);
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error("react-pdf load error:", error);
    }, []);

    const handleDownload = () => window.open(proxyUrl, "_blank");
    const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
    const goToNextPage = () => setCurrentPage((p) => Math.min(numPages, p + 1));
    const zoomIn = () => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
    const zoomOut = () => setZoomIndex((i) => Math.max(0, i - 1));
    const resetZoom = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

    // Raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPrevPage();
            else if (e.key === "ArrowRight") goToNextPage();
            else if (e.key === "Escape" && isFullscreen) toggleFullscreen();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [numPages, isFullscreen]);

    const pageWidth = containerWidth > 0
        ? Math.min(containerWidth - (isFullscreen ? 140 : 100), 900) * scale
        : undefined;

    return (
        <div ref={containerRef} className="relative flex flex-col h-full">
            {/* Zone PDF avec scroll */}
            <div className={`flex-1 overflow-auto ${isFullscreen ? "bg-gray-900" : "bg-gray-100"} rounded-t-xl`}>
                <div className="flex justify-center py-6 min-h-full">
                    <Document
                        file={blobUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                            </div>
                        }
                        error={
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <FileText size={48} className="text-gray-300" />
                                <p className={isFullscreen ? "text-gray-300" : "text-gray-500"}>Erreur de chargement du PDF</p>
                                <Button onClick={handleDownload} className="gap-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                                    <Download size={16} /> Télécharger
                                </Button>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={currentPage}
                            width={pageWidth}
                            loading={
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 size={24} className="animate-spin text-orange-500" />
                                </div>
                            }
                            className="shadow-lg"
                        />
                    </Document>
                </div>
            </div>

            {/* Flèches de navigation sur les côtés */}
            {numPages > 1 && (
                <>
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage <= 1}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2.5 transition-all
                            ${currentPage <= 1 ? "opacity-0 pointer-events-none" : "opacity-80 hover:opacity-100"}
                            ${isFullscreen
                                ? "bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm"
                                : "bg-white hover:bg-gray-100 text-gray-700 shadow-md border border-gray-200"
                            }`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage >= numPages}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full p-2.5 transition-all
                            ${currentPage >= numPages ? "opacity-0 pointer-events-none" : "opacity-80 hover:opacity-100"}
                            ${isFullscreen
                                ? "bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm"
                                : "bg-white hover:bg-gray-100 text-gray-700 shadow-md border border-gray-200"
                            }`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </>
            )}

            {/* Barre flottante en bas */}
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
                ${isFullscreen
                    ? "bg-black/70 backdrop-blur-md border border-white/10"
                    : "bg-white/95 backdrop-blur-sm border border-gray-200"
                }`}
            >
                {/* Indicateur de page */}
                <span className={`text-xs font-medium px-2 ${isFullscreen ? "text-white/80" : "text-gray-500"}`}>
                    {currentPage} / {numPages}
                </span>

                <div className={`w-px h-5 ${isFullscreen ? "bg-white/20" : "bg-gray-200"}`} />

                {/* Zoom */}
                <button
                    onClick={zoomOut}
                    disabled={zoomIndex <= 0}
                    className={`p-1.5 rounded-full transition-colors disabled:opacity-30
                        ${isFullscreen ? "text-white/80 hover:bg-white/15" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    <ZoomOut size={15} />
                </button>
                <button
                    onClick={resetZoom}
                    className={`text-xs font-medium min-w-[38px] text-center transition-opacity hover:opacity-70
                        ${isFullscreen ? "text-white/80" : "text-gray-600"}`}
                >
                    {Math.round(scale * 100)}%
                </button>
                <button
                    onClick={zoomIn}
                    disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
                    className={`p-1.5 rounded-full transition-colors disabled:opacity-30
                        ${isFullscreen ? "text-white/80 hover:bg-white/15" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    <ZoomIn size={15} />
                </button>

                <div className={`w-px h-5 ${isFullscreen ? "bg-white/20" : "bg-gray-200"}`} />

                {/* Plein écran */}
                <button
                    onClick={toggleFullscreen}
                    className={`p-1.5 rounded-full transition-colors
                        ${isFullscreen ? "text-white/80 hover:bg-white/15" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                {/* Télécharger */}
                <button
                    onClick={handleDownload}
                    className={`p-1.5 rounded-full transition-colors
                        ${isFullscreen ? "text-white/80 hover:bg-white/15" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    <Download size={15} />
                </button>
            </div>
        </div>
    );
};

export default PdfViewer;
