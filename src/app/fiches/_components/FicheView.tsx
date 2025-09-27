"use client";
// Improved cover image and certification badge styles
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { pdfjs } from "react-pdf";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ui/profile";
import { fetchPdfAsBlob } from "@/utils/fetchPdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { TokensIcon, CalendarIcon, MixIcon, LockClosedIcon, ReloadIcon } from "@radix-ui/react-icons";
import CommentForm from "@/app/fiches/_components/CommentForm";
import FileViewer from "@/app/fiches/_components/FileViewer";
import LikedByList from "@/app/fiches/_components/LikedByList";
import CommentsList from "@/app/fiches/_components/CommentsList";
import StatusChanger from "@/app/fiches/_components/StatusChanger";
import ReportButton from "@/components/ReportButton";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs"

interface FicheViewProps {
    id: string;
}

export default function FicheView({ id }: FicheViewProps) {
    const { data: session } = useSession();
    const currentUser = session?.user || null;

    const [fiche, setFiche] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfCover, setPdfCover] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const fetchFiche = async () => {
        if (!id) {
            setError("Aucun ID de fiche trouvé.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsRetrying(retryCount > 0);

        try {
            // Ajout d'un paramètre de cache-busting pour éviter les problèmes de cache
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/api/fiches/${id}?t=${cacheBuster}`, {
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Erreur serveur" }));
                throw new Error(errorData.message || `Erreur ${response.status}: Impossible de récupérer la fiche.`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Erreur lors de la récupération des données.");
            }

            setFiche(data.data);

            // Générer la couverture pour un PDF
            if (data.data.files?.length > 0) {
                const isPdfFile = (url: string): boolean => {
                    const baseUrl = url.split('?')[0];
                    return baseUrl.toLowerCase().endsWith('.pdf');
                };

                if (isPdfFile(data.data.files[0])) {
                    await generatePdfCover(data.data.files[0]);
                }
            }
        } catch (err) {
            console.error("Erreur lors de la récupération de la fiche :", err);
            const errorMessage = err instanceof Error ? err.message : "Erreur de connexion au serveur";

            if (errorMessage.includes("buffering timed out") || errorMessage.includes("timed out after")) {
                setError("Le serveur de base de données met trop de temps à répondre. Veuillez réessayer.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
            setIsRetrying(false);
        }
    };

    useEffect(() => {
        fetchFiche();
    }, [id, retryCount]);

    const generatePdfCover = async (pdfUrl: string) => {
        try {
            // Récupérer le PDF en mode no-cors
            const blob = await fetchPdfAsBlob(pdfUrl);
            const pdfData = new Uint8Array(await blob.arrayBuffer());

            // Charger le document avec pdf.js
            const loadingTask = pdfjs.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            // Générer une vue de la première page avec une échelle améliorée pour remplir l'espace
            const viewport = page.getViewport({ scale: 1.5 }); // Échelle augmentée pour un meilleur remplissage
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (!context) {
                console.error("Impossible de créer un contexte de rendu.");
                return;
            }
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: context,
                viewport,
            };

            await page.render(renderContext).promise;

            const image = canvas.toDataURL("image/png");
            setPdfCover(image);
        } catch (err) {
            console.error("Erreur lors de la génération de la couverture PDF :", err);
            setPdfCover(null);
        }
    };

    const handleRetry = () => {
        setRetryCount(prevCount => prevCount + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen" style={{
                backgroundImage: `linear-gradient(to right, rgba(255, 140, 66, 0.8), rgba(255, 94, 120, 0.8)), url(/noise.webp)`,
                backgroundSize: "cover, 2%",
                backgroundBlendMode: "overlay",
            }}>
                <div className="max-w-4xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
                    <div className="p-8 bg-white rounded-xl shadow-lg space-y-6 relative overflow-hidden">
                        {isRetrying && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-200">
                                <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500 animate-progress"></div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-10 w-3/4 rounded-lg bg-gray-200" />
                            <Skeleton className="h-6 w-1/2 rounded-lg bg-gray-200" />
                        </div>
                        <div className="h-64 w-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full rounded-lg bg-gray-200" />
                            <Skeleton className="h-6 w-11/12 rounded-lg bg-gray-200" />
                            <Skeleton className="h-6 w-10/12 rounded-lg bg-gray-200" />
                        </div>
                        <div className="flex gap-4">
                            <Skeleton className="h-8 w-16 rounded-full bg-gray-200" />
                            <Skeleton className="h-8 w-16 rounded-full bg-gray-200" />
                            <Skeleton className="h-8 w-16 rounded-full bg-gray-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl w-full mx-auto px-4 md:px-8 py-16">
                    <div className="p-8 bg-white rounded-xl shadow-lg">
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
                            <p className="text-gray-600 mb-6">{error}</p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={handleRetry}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 text-white"
                                >
                                    <ReloadIcon className="h-4 w-4" /> Réessayer
                                </Button>

                                <Link href="/fiches">
                                    <Button variant="outline" className="flex items-center justify-center gap-2">
                                        Retour aux fiches
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Suggestions:</h3>
                            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                                <li>Vérifiez votre connexion internet</li>
                                <li>Le serveur peut être momentanément surchargé</li>
                                <li>L&apos;identifiant de la fiche est peut-être incorrect</li>                                <li>La fiche a peut-être été supprimée</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const allowedRoles = ["Rédacteur", "Correcteur", "Admin"];
    const userHasPermission = allowedRoles.includes(currentUser?.role ?? "");

    // Style amélioré pour les badges de statut
    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case "Certifiée":
                return "bg-blue-100 text-blue-800 border-blue-300 shadow-md shadow-blue-100";
            case "Vérifiée":
                return "bg-green-100 text-green-800 border-green-300 shadow-md shadow-green-100";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    // Style pour le conteneur de l'image de couverture
    const getCoverContainerStyle = (status: string) => {
        switch (status) {
            case "Certifiée":
                return "border-2 border-blue-300 bg-blue-50";
            case "Vérifiée":
                return "border-2 border-green-300 bg-green-50";
            default:
                return "border-2 border-gray-200 bg-gray-50";
        }
    };

    const headerStyle = {
        backgroundImage: `linear-gradient(to right, #FF8C42, #FF5E78), url(/noise.webp)`,
        backgroundSize: "cover, 3%",
        backgroundBlendMode: "overlay",
    };

    // Nouveau style pour le badge brillant de certification
    const renderStatusBadge = (status: string) => {
        if (status === "Certifiée") {
            return (
                <div className="relative flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${getStatusBadgeStyle(status)} relative z-10`}>
                        {status}
                    </Badge>
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-25 animate-pulse"></div>
                        <img
                            src={`/badge/${status}.svg`}
                            alt={`Statut: ${status}`}
                            className="h-12 w-12 relative z-10 filter drop-shadow-lg"
                        />
                        {/* Reflet brillant sur le badge */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-60 rounded-full animate-shine"></div>
                    </div>
                </div>
            );
        } else if (status === "Vérifiée") {
            return (
                <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${getStatusBadgeStyle(status)}`}>
                        {status}
                    </Badge>
                    <img
                        src={`/badge/${status}.svg`}
                        alt={`Statut: ${status}`}
                        className="h-10 w-10 filter drop-shadow"
                    />
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${getStatusBadgeStyle(status)}`}>
                        {status}
                    </Badge>
                    <img
                        src={`/badge/${status}.svg`}
                        alt={`Statut: ${status}`}
                        className="h-8 w-8"
                    />
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden text-black">
            {/* En-tête avec dégradé */}
            <div
                className="w-full py-12"
                style={{
                    ...headerStyle,
                    textShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)"
                }}
            >
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <h1 className="text-3xl font-bold text-white mb-2">{fiche.title}</h1>
                    <div className="flex items-center text-white opacity-90">
                        <CalendarIcon className="mr-2" />
                        <span>Publié le {new Date(fiche.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl w-full mx-auto px-4 md:px-8 -mt-10 mb-12 relative z-10">
                {/* Carte principale avec un design moderne */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Informations de l'auteur et badge de statut amélioré */}
                    <div className="p-6 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <ProfileAvatar
                                username={fiche.author?.username || "Inconnu"}
                                points={fiche.author?.points || 0}
                            />
                            <div>
                                <Link href={`/compte/${fiche.author?._id}`}>
                                    <p className="font-medium text-black hover:underline cursor-pointer">{fiche.author?.username || "Inconnu"}</p>
                                </Link>
                                <p className="text-sm text-gray-500">Auteur</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {renderStatusBadge(fiche.status)}
                            <ReportButton 
                                contentId={fiche._id} 
                                contentType="revision"
                                variant="button"
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Couverture améliorée pour remplir complètement l'espace */}
                    <div className={`relative ${getCoverContainerStyle(fiche.status)}`}>
                        {pdfCover ? (
                            <div className="aspect-video w-full overflow-hidden">
                                <img
                                    src={pdfCover}
                                    alt="Couverture du PDF"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay subtil selon le statut */}
                                <div className={`absolute inset-0 ${
                                    fiche.status === "Certifiée"
                                        ? "bg-blue-500 opacity-5"
                                        : fiche.status === "Vérifiée"
                                            ? "bg-green-500 opacity-5"
                                            : ""
                                }`}></div>
                            </div>
                        ) : fiche.files?.[0]?.endsWith(".jpg") || fiche.files?.[0]?.endsWith(".png") ? (
                            <div className="aspect-video w-full overflow-hidden">
                                <img
                                    src={fiche.files[0]}
                                    alt="Couverture"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay subtil selon le statut */}
                                <div className={`absolute inset-0 ${
                                    fiche.status === "Certifiée"
                                        ? "bg-blue-500 opacity-5"
                                        : fiche.status === "Vérifiée"
                                            ? "bg-green-500 opacity-5"
                                            : ""
                                }`}></div>
                            </div>
                        ) : (
                            <div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-medium">Aucun aperçu disponible</p>
                                </div>
                            </div>
                        )}

                        {/* Badges sur la couverture avec design amélioré */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <Badge className="bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 px-3 py-1.5 shadow-sm flex items-center gap-1.5 rounded-full">
                                <TokensIcon className="h-3.5 w-3.5" /> {fiche.subject}
                            </Badge>
                            <Badge className="bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 px-3 py-1.5 shadow-sm flex items-center gap-1.5 rounded-full">
                                <MixIcon className="h-3.5 w-3.5" /> {fiche.level}
                            </Badge>
                        </div>

                        {/* Badge de statut flottant pour les fiches certifiées ou vérifiées */}
                        {(fiche.status === "Certifiée" || fiche.status === "Vérifiée") && (
                            <div className="absolute top-4 right-4">
                                <div className={`px-4 py-2 rounded-full ${
                                    fiche.status === "Certifiée"
                                        ? "bg-blue-500 text-white"
                                        : "bg-green-500 text-white"
                                } font-bold shadow-lg flex items-center gap-2`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {fiche.status}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contenu de la fiche */}
                    <div className="p-6 md:p-8">
                        <div className="prose max-w-none text-black">
                            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                                {fiche.content}
                            </ReactMarkdown>
                        </div>

                        {/* Likes et commentaires */}
                        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4 flex-wrap">
                            <LikedByList
                                revisionId={fiche._id}
                                likedBy={fiche.likedBy || []}
                                initialLikes={fiche.likes || 0}
                            />
                            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                {fiche.comments?.length || 0} Commentaires
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Fichiers attachés */}
                {fiche.files?.length > 0 && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-6 overflow-hidden">
                        <h2 className="text-xl font-semibold mb-4 flex items-center text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Fichiers attachés
                        </h2>
                        <FileViewer files={fiche.files}/>
                    </div>
                )}

                {/* Changer le statut (visible uniquement pour les utilisateurs autorisés) */}
                {userHasPermission && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 flex items-center text-black">
                            <LockClosedIcon className="h-4 w-4 mr-2" />
                            Changer le statut
                        </h2>
                        <StatusChanger
                            ficheId={fiche._id}
                            currentStatus={fiche.status}
                            onStatusChange={(newStatus) => {
                                setFiche((prev: any) => ({ ...prev, status: newStatus }));
                            }}
                        />
                    </div>
                )}

                {/* Section commentaires */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-6 overflow-hidden">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Commentaires
                    </h2>

                    {currentUser ? (
                        <CommentForm revisionId={fiche._id} currentUser={currentUser}/>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
                            <p className="text-gray-600 mb-3">Veuillez vous connecter pour poster un commentaire.</p>
                            <Link href="/connexion">
                                <Button className="bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 text-white">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Liste des commentaires */}
                    <div className="mt-6">
                        <CommentsList revisionId={fiche._id}/>
                    </div>
                </div>
            </div>

            {/* Styles pour les animations */}
            <style jsx global>{`
                @keyframes shine {
                    0% { transform: translateX(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) rotate(45deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                
                .animate-shine::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        to right,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.3) 50%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    transform: rotate(45deg);
                    animation: shine 2s infinite;
                }
                
                .animate-pulse {
                    animation: pulse 2s infinite;
                }
                
                .animate-progress {
                    animation: progress 1.5s linear;
                }
            `}</style>
        </div>
    );
}