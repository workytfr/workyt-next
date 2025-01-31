"use client";

import React, { useState, useEffect, useRef } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@radix-ui/react-icons";
import Image from "next/image";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

interface FileViewerProps {
    files: string[]; // Liste des URLs de fichiers
}

const FileViewer: React.FC<FileViewerProps> = ({ files }) => {
    const [currentFileIndex, setCurrentFileIndex] = useState(0); // Index du fichier courant
    const [numPages, setNumPages] = useState<number | null>(null); // Nombre de pages d'un PDF
    const [currentPage, setCurrentPage] = useState(1); // Page actuelle d'un PDF
    const [isPdf, setIsPdf] = useState<boolean | null>(null); // Détecter si le fichier courant est un PDF
    const [isLoading, setIsLoading] = useState<boolean>(true); // Indique si le fichier est en cours de chargement
    const [containerWidth, setContainerWidth] = useState(0); // Largeur du conteneur

    const containerRef = useRef<HTMLDivElement>(null); // Référence pour le conteneur
    const currentFile = files[currentFileIndex];

    // Réinitialiser les états liés au fichier quand il change
    useEffect(() => {
        setIsPdf(null); // Réinitialiser le type du fichier
        setNumPages(null); // Réinitialiser le nombre de pages (si PDF)
        setCurrentPage(1); // Réinitialiser à la première page
        setIsLoading(true); // Indiquer que le fichier est en cours de chargement
    }, [currentFile]);

    // Vérifier le type MIME du fichier
    useEffect(() => {
        const fetchFileType = async () => {
            try {
                const response = await fetch(currentFile, { method: "HEAD" });
                const contentType = response.headers.get("content-type");
                setIsPdf(contentType?.includes("pdf") || false);
            } catch (error) {
                console.error("Erreur lors de la vérification du type MIME :", error);
                setIsPdf(null); // Définir comme inconnu en cas d'erreur
            } finally {
                setIsLoading(false); // Terminer le chargement
            }
        };

        fetchFileType();
    }, [currentFile]);

    // Mesurer la taille du conteneur
    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateContainerSize();
        window.addEventListener("resize", updateContainerSize);
        return () => window.removeEventListener("resize", updateContainerSize);
    }, []);

    const handlePdfLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setCurrentPage(1); // Réinitialiser à la première page
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = currentFile;
        link.download = currentFile.split("/").pop() || "document"; // Nom par défaut : "document"
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
    };

    const handleNextFile = () => {
        if (currentFileIndex < files.length - 1) {
            setCurrentFileIndex(currentFileIndex + 1);
        }
    };

    const handlePreviousFile = () => {
        if (currentFileIndex > 0) {
            setCurrentFileIndex(currentFileIndex - 1);
        }
    };

    const handleNextPage = () => {
        if (numPages && currentPage < numPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="space-y-4" ref={containerRef}>
            <div className="relative border p-4 rounded shadow max-w-full">
                {isLoading ? (
                    <p>Chargement du fichier...</p>
                ) : isPdf ? (
                    <div className="flex flex-col items-center relative">
                        <Document file={currentFile} onLoadSuccess={handlePdfLoadSuccess}>
                            <Page
                                key={`page_${currentPage}`}
                                pageNumber={currentPage}
                                width={containerWidth}
                                renderTextLayer={false} // Désactiver la couche texte
                            />
                        </Document>
                        {numPages && (
                            <div className="flex justify-between items-center mt-4">
                                <Button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                >
                                    Page précédente
                                </Button>
                                <p>
                                    {currentPage} sur {numPages}
                                </p>
                                <Button
                                    onClick={handleNextPage}
                                    disabled={currentPage === numPages}
                                    variant="outline"
                                >
                                    Page suivante
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Image
                        src={currentFile}
                        alt="Fichier attaché"
                        width={containerWidth}
                        height={400} // Hauteur fixe pour les images
                        className="w-full h-auto object-contain"
                    />
                )}
            </div>
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        onClick={handlePreviousFile}
                        disabled={currentFileIndex === 0}
                        variant="secondary"
                    >
                        Fichier précédent
                    </Button>
                    <Button
                        onClick={handleNextFile}
                        disabled={currentFileIndex === files.length - 1}
                        variant="secondary"
                    >
                        Fichier suivant
                    </Button>
                </div>
                <p>
                    Fichier {currentFileIndex + 1} sur {files.length}
                </p>
                <Button
                    onClick={handleDownload}
                    variant="secondary"
                    className="flex items-center gap-2"
                >
                    <DownloadIcon />
                    Télécharger
                </Button>
            </div>
        </div>
    );
};

export default FileViewer;
