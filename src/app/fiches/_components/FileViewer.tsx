"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    Maximize2,
    Minimize2,
    Loader2,
} from "lucide-react";

// Import dynamique pour éviter DOMMatrix SSR crash (pdfjs-dist utilise des API navigateur)
const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

interface FileViewerProps {
    ficheId: string;
    files: string[];
}

const FileViewer: React.FC<FileViewerProps> = ({ ficheId, files }) => {
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const currentFile = files[currentFileIndex];
    const proxyUrl = `/api/file-proxy?ficheId=${ficheId}&index=${currentFileIndex}`;

    const isPdf = (url: string): boolean => {
        const path = url.split("?")[0];
        return path.toLowerCase().endsWith(".pdf");
    };

    const currentIsPdf = isPdf(currentFile);

    // Fetch PDF via proxy → Blob URL
    useEffect(() => {
        setImageError(false);
        setFetchError(false);

        if (!currentIsPdf) {
            setBlobUrl(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setBlobUrl(null);

        fetch(proxyUrl)
            .then((res) => {
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Erreur chargement fichier:", err);
                setFetchError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            setBlobUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [currentFileIndex, ficheId, currentIsPdf, proxyUrl]);

    const handleDownload = () => window.open(proxyUrl, "_blank");
    const handleNextFile = () => {
        if (currentFileIndex < files.length - 1) setCurrentFileIndex(currentFileIndex + 1);
    };
    const handlePreviousFile = () => {
        if (currentFileIndex > 0) setCurrentFileIndex(currentFileIndex - 1);
    };
    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Rendu PDF
    const renderPdfContent = (heightClass: string) => {
        if (loading) {
            return (
                <div className={`flex flex-col items-center justify-center ${heightClass}`}>
                    <Loader2 size={32} className="animate-spin text-orange-500 mb-3" />
                    <p className="text-gray-500 text-sm">Chargement du document...</p>
                </div>
            );
        }

        if (fetchError || !blobUrl) {
            return (
                <div className={`flex flex-col items-center justify-center ${heightClass}`}>
                    <FileText size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">Impossible de charger le PDF.</p>
                    <Button onClick={handleDownload} className="gap-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                        <Download size={16} /> Télécharger le fichier
                    </Button>
                </div>
            );
        }

        return (
            <PdfViewer
                blobUrl={blobUrl}
                proxyUrl={proxyUrl}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
            />
        );
    };

    return (
        <>
            {/* Overlay fullscreen */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
                    {currentIsPdf ? (
                        renderPdfContent("h-full")
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 bg-black/50">
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <ImageIcon size={16} />
                                    <span>Fichier {currentFileIndex + 1} sur {files.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={handleDownload} variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2">
                                        <Download size={14} /> Télécharger
                                    </Button>
                                    <Button onClick={toggleFullscreen} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                                        <Minimize2 size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={proxyUrl} alt="Fichier" className="max-w-full max-h-full object-contain" />
                            </div>
                        </>
                    )}
                    {files.length > 1 && (
                        <>
                            {currentFileIndex > 0 && (
                                <button onClick={handlePreviousFile} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-3 text-white transition-colors z-10">
                                    <ChevronLeft size={24} />
                                </button>
                            )}
                            {currentFileIndex < files.length - 1 && (
                                <button onClick={handleNextFile} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-3 text-white transition-colors z-10">
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Vue normale */}
            <div className="space-y-3">
                {files.length > 1 && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                        <Button onClick={handlePreviousFile} disabled={currentFileIndex === 0} variant="ghost" size="sm" className="gap-1">
                            <ChevronLeft size={16} /> Précédent
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            {currentIsPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                            <span>Fichier {currentFileIndex + 1} sur {files.length}</span>
                        </div>
                        <Button onClick={handleNextFile} disabled={currentFileIndex === files.length - 1} variant="ghost" size="sm" className="gap-1">
                            Suivant <ChevronRight size={16} />
                        </Button>
                    </div>
                )}

                <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    {currentIsPdf ? (
                        <div className="w-full" style={{ height: "80vh", minHeight: "500px" }}>
                            {renderPdfContent("py-16 px-4")}
                        </div>
                    ) : imageError ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <ImageIcon size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-600 mb-4">Impossible d&apos;afficher l&apos;image.</p>
                            <Button onClick={handleDownload} className="gap-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                                <Download size={16} /> Télécharger le fichier
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-center p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={proxyUrl}
                                alt="Fichier attaché"
                                className="max-w-full h-auto object-contain rounded-lg cursor-pointer"
                                style={{ maxHeight: "80vh" }}
                                onClick={toggleFullscreen}
                                onError={() => setImageError(true)}
                            />
                        </div>
                    )}
                </div>

                {!currentIsPdf && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ImageIcon size={14} />
                            <span>Image</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={toggleFullscreen} variant="outline" size="sm" className="gap-2 rounded-xl">
                                <Maximize2 size={14} />
                                <span className="hidden sm:inline">Plein écran</span>
                            </Button>
                            <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2 rounded-xl">
                                <Download size={14} />
                                Télécharger
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FileViewer;
