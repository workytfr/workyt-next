"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { pdfjs } from "react-pdf";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import Image from "next/image";
import ProfileAvatar from "@/components/ui/profile";
import { fetchPdfAsBlob } from "@/utils/fetchPdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import {TokensIcon , CalendarIcon, MixIcon, LockClosedIcon } from "@radix-ui/react-icons";
import CommentForm from "@/app/fiches/_components/CommentForm";
import FileViewer from "@/app/fiches/_components/FileViewer";
import LikedByList from "@/app/fiches/_components/LikedByList";
import CommentsList from "@/app/fiches/_components/CommentsList";
import StatusChanger from "@/app/fiches/_components/StatusChanger";


// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs"

interface FicheViewProps {
    id: string;
}

export default function FicheView({ id }: FicheViewProps) {
    const { data: session } = useSession(); // Récupérer la session
    const currentUser = session?.user || null; // Extraire l'utilisateur

    const [fiche, setFiche] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfCover, setPdfCover] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("Aucun ID de fiche trouvé.");
            setLoading(false);
            return;
        }

        const fetchFiche = async () => {
            try {
                const response = await fetch(`/api/fiches/${id}`);
                if (!response.ok) {
                    setError("Erreur lors de la récupération de la fiche.");
                    setLoading(false);
                    return;
                }                const data = await response.json();
                setFiche(data.data);

                // Générer la couverture pour un PDF
                const isPdfFile = (url: string): boolean => {
                    const baseUrl = url.split('?')[0]; // Supprime les paramètres après `?`
                    return baseUrl.endsWith('.pdf');
                };

                if (isPdfFile(data.data.files?.[0])) {
                    await generatePdfCover(data.data.files[0]);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchFiche().catch((err) => console.error("Erreur lors de la récupération de la fiche :", err));
    }, [id]);

    const generatePdfCover = async (pdfUrl: string) => {
        try {
            // Récupérer le PDF en mode no-cors
            const blob = await fetchPdfAsBlob(pdfUrl);
            const pdfData = new Uint8Array(await blob.arrayBuffer());

            // Charger le document avec pdf.js
            const loadingTask = pdfjs.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            // Générer une vue de la première page
            const viewport = page.getViewport({ scale: 1 });
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

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-10 w-3/4 rounded-lg bg-gray-300 animate-pulse" />
                    <Skeleton className="h-6 w-1/2 rounded-lg bg-gray-300 animate-pulse" />
                </div>
                <div className="h-64 w-full bg-gray-300 rounded-lg animate-pulse" />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-full rounded-lg bg-gray-300 animate-pulse" />
                    <Skeleton className="h-6 w-11/12 rounded-lg bg-gray-300 animate-pulse" />
                    <Skeleton className="h-6 w-10/12 rounded-lg bg-gray-300 animate-pulse" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-16 rounded-full bg-gray-300 animate-pulse" />
                    <Skeleton className="h-8 w-16 rounded-full bg-gray-300 animate-pulse" />
                    <Skeleton className="h-8 w-16 rounded-full bg-gray-300 animate-pulse" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert className="bg-red-100 p-4 rounded border border-red-200">
                <AlertTitle className="text-black">Erreur</AlertTitle>
                <AlertDescription className="text-black">{error}</AlertDescription>
            </Alert>
        );
    }

    const allowedRoles = ["Rédacteur", "Correcteur", "Admin"];
    const userHasPermission = allowedRoles.includes(currentUser?.role ?? "");

    // Définir la classe CSS pour la couleur de la couverture en fonction du statut
    const getStatusBackgroundColor = (status: string) => {
        switch (status) {
            case "Vérifiée":
                return "bg-green-100";
            case "Certifiée":
                return "bg-blue-100";
            default:
                return "bg-gray-100";
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white text-black">
            <div className="max-w-4xl mx-auto p-8 space-y-6 bg-white text-black relative">

                {/* Couverture */}
                <div
                    className={`relative shadow rounded-lg p-4 border border-gray-300 ${getStatusBackgroundColor(
                        fiche.status
                    )}`}
                >
                    {pdfCover ? (
                        <Image
                            src={pdfCover}
                            alt="Couverture du PDF"
                            width={500}
                            height={256}
                            className="w-full h-64 object-cover rounded"
                        />
                    ) : fiche.files?.[0]?.endsWith(".jpg") || fiche.files?.[0]?.endsWith(".png") ? (
                        <Image
                            src={fiche.files[0]}
                            alt="Couverture"
                            className="w-full h-64 object-cover rounded"
                        />
                    ) : (
                        <div className="h-64 w-full bg-gray-200 flex items-center justify-center text-gray-500">
                            Aucun aperçu disponible
                        </div>
                    )}

                    {/* Badges en haut à gauche */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge>
                            <span className="mr-1"><TokensIcon/></span> {fiche.subject}
                        </Badge>
                        <Badge>
                            <span className="mr-1"><MixIcon/></span> {fiche.level}
                        </Badge>
                    </div>

                    {/* Badge en haut à droite */}
                    <div className="absolute top-2 right-2">
                        <Image
                            src={`/badge/${fiche.status}.svg`}
                            alt={`Statut: ${fiche.status}`}
                            width={40}
                            height={40}
                            className="rounded"
                        />
                    </div>

                    {/* Badge en bas à droite */}
                    <div className="absolute bottom-2 right-2">
                        <Badge>
                            <span
                                className="mr-1"><CalendarIcon/></span> {new Date(fiche.createdAt).toLocaleDateString("fr-FR")}
                        </Badge>
                    </div>

                    {/* Profil en bas à gauche */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <ProfileAvatar username={fiche.author?.username || "Inconnu"}
                                       points={fiche.author?.points || 0}/>
                    </div>
                </div>

                {/* Informations principales */}
                <div className="bg-white shadow rounded-lg p-6 border border-gray-300 space-y-4">
                    <h1 className="text-2xl font-bold">{fiche.title}</h1>
                    <p className="text-gray-600">Auteur : {fiche.author?.username || "Inconnu"}</p>
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                        {fiche.content}
                    </ReactMarkdown>
                </div>

                {/* Badges */}
                <div className="flex gap-4 flex-wrap">
                    <LikedByList
                        revisionId={fiche._id}
                        likedBy={fiche.likedBy || []}
                        initialLikes={fiche.likes || 0}
                    />
                    <Badge>{fiche.comments?.length} Commentaires</Badge>
                </div>

                {/* Fichiers attachés */}
                {fiche.files?.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-300">
                        <h2 className="text-xl font-semibold mb-4">Fichiers Attachés :</h2>
                        <FileViewer files={fiche.files}/>
                    </div>
                )}
                {/* Ajouter le composant StatusChanger */}
                {userHasPermission && (
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-300">
                        <h2 className="text-xl font-semibold mb-4">
                            Changer le statut <LockClosedIcon className="inline-block ml-2" />
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
                <div className="bg-white shadow rounded-lg p-6 border border-gray-300">
                    <h2 className="text-xl font-semibold">Commentaires</h2>
                    {currentUser ? (
                        <CommentForm revisionId={fiche._id} currentUser={currentUser}/>
                    ) : (
                        <p>Veuillez vous connecter pour poster un commentaire.</p>
                    )}
                    {/* Liste des commentaires */}
                    <div className="mt-4">
                        <CommentsList revisionId={fiche._id}/>
                    </div>
                </div>

            </div>
        </div>
    );
}
