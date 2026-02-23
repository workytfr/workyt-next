"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import SubjectIcon from "@/components/fiches/SubjectIcon";
import { CalendarIcon, LockClosedIcon, ReloadIcon } from "@radix-ui/react-icons";
import { FileText, ArrowLeft } from "lucide-react";
import CommentForm from "@/app/fiches/_components/CommentForm";
import FileViewer from "@/app/fiches/_components/FileViewer";
import LikedByList from "@/app/fiches/_components/LikedByList";
import CommentsList from "@/app/fiches/_components/CommentsList";
import StatusChanger from "@/app/fiches/_components/StatusChanger";
import DeleteFicheButton from "@/app/fiches/_components/DeleteFicheButton";
import ReportButton from "@/components/ReportButton";
import BookmarkButton from "@/components/BookmarkButton";
import { subjectGradients } from "@/data/educationData";

interface FicheViewProps {
    id: string;
}

export default function FicheView({ id }: FicheViewProps) {
    const { data: session } = useSession();
    const currentUser = session?.user || null;

    const [fiche, setFiche] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    const handleRetry = () => {
        setRetryCount(prevCount => prevCount + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-r from-orange-400 to-pink-500">
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
                                        <ArrowLeft size={16} /> Retour aux fiches
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Suggestions:</h3>
                            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                                <li>Vérifiez votre connexion internet</li>
                                <li>Le serveur peut être momentanément surchargé</li>
                                <li>L&apos;identifiant de la fiche est peut-être incorrect</li>
                                <li>La fiche a peut-être été supprimée</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const allowedRoles = ["Helpeur", "Rédacteur", "Correcteur", "Admin"];
    const userHasPermission = allowedRoles.includes(currentUser?.role ?? "");
    const isCreator = currentUser && fiche && currentUser.id === fiche.author._id.toString();
    const isAdmin = currentUser?.role === "Admin";

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

    const subjectGradient = subjectGradients[fiche.subject] || "from-orange-500 to-pink-500";

    const renderStatusBadge = (status: string) => {
        if (status === "Certifiée") {
            return (
                <div className="relative flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${getStatusBadgeStyle(status)} relative z-10`}>{status}</Badge>
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-25 animate-pulse"></div>
                        <img src={`/badge/${status}.svg`} alt={`Statut: ${status}`} className="h-12 w-12 relative z-10 filter drop-shadow-lg" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-60 rounded-full animate-shine"></div>
                    </div>
                </div>
            );
        } else if (status === "Vérifiée") {
            return (
                <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${getStatusBadgeStyle(status)}`}>{status}</Badge>
                    <img src={`/badge/${status}.svg`} alt={`Statut: ${status}`} className="h-10 w-10 filter drop-shadow" />
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <Badge className={`px-3 py-1 ${getStatusBadgeStyle(status)}`}>{status}</Badge>
                <img src={`/badge/${status}.svg`} alt={`Statut: ${status}`} className="h-8 w-8" />
            </div>
        );
    };

    // Détecter le type du premier fichier
    const firstFileUrl = fiche.files?.[0] || "";
    const firstFileBase = firstFileUrl.split("?")[0].toLowerCase();
    const hasPdfFile = fiche.files?.length > 0 && firstFileBase.endsWith(".pdf");
    const hasImageFile = fiche.files?.length > 0 && (firstFileBase.endsWith(".jpg") || firstFileBase.endsWith(".jpeg") || firstFileBase.endsWith(".png") || firstFileBase.endsWith(".webp"));

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden text-black">
            {/* En-tête */}
            <div
                className={`w-full py-10 md:py-14 bg-gradient-to-r ${subjectGradient}`}
                style={{ textShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)" }}
            >
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <Link href="/fiches" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors">
                        <ArrowLeft size={16} />
                        <span>Retour aux fiches</span>
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                                    <SubjectIcon subject={fiche.subject} size={24} className="text-white" />
                                </div>
                                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1 rounded-full text-sm">{fiche.subject}</Badge>
                                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1 rounded-full text-sm">{fiche.level}</Badge>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{fiche.title}</h1>
                            <div className="flex items-center text-white/80 text-sm">
                                <CalendarIcon className="mr-2" />
                                <span>Publié le {new Date(fiche.createdAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                        </div>
                        <BookmarkButton revisionId={fiche._id} size="lg" className="mt-2 p-2 bg-white/20 backdrop-blur-sm rounded-full" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl w-full mx-auto px-4 md:px-8 -mt-8 mb-12 relative z-10">
                {/* Carte principale */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Auteur + statut */}
                    <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <ProfileAvatar username={fiche.author?.username || "Inconnu"} points={fiche.author?.points || 0} userId={fiche.author?._id} role={fiche.author?.role} />
                            <div>
                                <Link href={`/compte/${fiche.author?._id}`}>
                                    <UsernameDisplay username={fiche.author?.username || "Inconnu"} userId={fiche.author?._id} className="font-medium hover:underline cursor-pointer block" role={fiche.author?.role} />
                                </Link>
                                <p className="text-sm text-gray-500">Auteur</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {renderStatusBadge(fiche.status)}
                            <ReportButton contentId={fiche._id} contentType="revision" variant="button" size="sm" />
                        </div>
                    </div>

                    {/* Aperçu image (seulement pour les images, pas les PDF) */}
                    {hasImageFile && (
                        <div className="relative border-b border-gray-100">
                            <div className="aspect-video w-full overflow-hidden bg-gray-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/api/file-proxy?ficheId=${fiche._id}&index=0`} alt="Aperçu" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    )}

                    {/* Contenu de la fiche */}
                    <div className="p-5 md:p-8">
                        {fiche.content && (
                            <div className="prose max-w-none text-black">
                                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{fiche.content}</ReactMarkdown>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4 flex-wrap">
                            <LikedByList revisionId={fiche._id} likedBy={fiche.likedBy || []} initialLikes={fiche.likes || 0} />
                            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                {fiche.comments?.length || 0} Commentaires
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Fichiers attachés - le PDF viewer est ici directement */}
                {fiche.files?.length > 0 && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-5 md:p-6 overflow-hidden">
                        <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
                            <FileText size={20} className="mr-2 text-gray-500" />
                            {hasPdfFile ? "Document" : "Fichiers attachés"} ({fiche.files.length})
                        </h2>
                        <FileViewer ficheId={fiche._id} files={fiche.files} />
                    </div>
                )}

                {/* Actions */}
                {(userHasPermission || isCreator) && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
                            <LockClosedIcon className="h-4 w-4 mr-2" />
                            Actions sur la fiche
                        </h2>
                        <div className="space-y-4">
                            {userHasPermission && (
                                <div>
                                    <h3 className="text-base font-medium mb-2 text-gray-700">Changer le statut</h3>
                                    <StatusChanger ficheId={fiche._id} currentStatus={fiche.status} onStatusChange={(newStatus) => setFiche((prev: any) => ({ ...prev, status: newStatus }))} />
                                </div>
                            )}
                            {(isCreator || isAdmin) && (
                                <div className="border-t pt-4">
                                    <h3 className="text-base font-medium mb-2 text-gray-700">Supprimer la fiche</h3>
                                    <DeleteFicheButton ficheId={fiche._id} ficheTitle={fiche.title} isCreator={isCreator} isAdmin={isAdmin} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Commentaires */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-5 md:p-6 overflow-hidden">
                    <h2 className="text-lg font-semibold mb-4 flex items-center text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Commentaires
                    </h2>
                    {currentUser ? (
                        <CommentForm revisionId={fiche._id} currentUser={currentUser} />
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
                            <p className="text-gray-600 mb-3">Veuillez vous connecter pour poster un commentaire.</p>
                            <Link href="/connexion">
                                <Button className="bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 text-white">Se connecter</Button>
                            </Link>
                        </div>
                    )}
                    <div className="mt-6">
                        <CommentsList revisionId={fiche._id} />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shine { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(100%) rotate(45deg); } }
                @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
                @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
                .animate-shine::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%); transform: rotate(45deg); animation: shine 2s infinite; }
                .animate-pulse { animation: pulse 2s infinite; }
                .animate-progress { animation: progress 1.5s linear; }
            `}</style>
        </div>
    );
}
