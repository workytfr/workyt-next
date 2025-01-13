"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import Navbar from "@/components/navbar/Navbar";

export default function FichePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [fiche, setFiche] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchFiche = async () => {
            try {
                const response = await fetch(`/api/fiches/${id}`);
                if (!response.ok) throw new Error("Erreur lors de la récupération de la fiche.");
                const data = await response.json();
                setFiche(data.data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchFiche();
    }, [id]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/fiches/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Erreur lors de la suppression de la fiche.");
            alert("Fiche supprimée avec succès !");
            router.push("/fiches");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-8 w-1/2 rounded bg-gray-300" />
                <Skeleton className="h-6 w-full rounded bg-gray-300" />
                <Skeleton className="h-64 w-full rounded bg-gray-300" />
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

    return (
        <div className="min-h-screen flex flex-col bg-white text-black">
            <Navbar/>
            <div className="max-w-4xl mx-auto p-8 space-y-6 bg-white text-black">
                {/* Card: Fiche */}
                <div className="bg-white shadow rounded-lg p-6 border border-gray-300">
                    <h1 className="text-3xl font-bold mb-2">{fiche.title}</h1>
                    <p className="text-gray-600 mb-4">Auteur : {fiche.author?.name || "Inconnu"}</p>
                    <div className="prose max-w-none">{fiche.content}</div>
                </div>

                {/* Card: Fichiers attachés */}
                {fiche.files?.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-300">
                        <h2 className="text-2xl font-semibold mb-4">Fichiers :</h2>
                        <ul className="list-disc pl-5">
                            {fiche.files.map((file: string, index: number) => (
                                <li key={index}>
                                    <a
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        Télécharger le fichier {index + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Card: Actions utilisateur */}
                <div className="bg-white shadow rounded-lg p-6 border border-gray-300 flex justify-between">
                    <Button
                        onClick={() => router.push(`/fiches/${id}/edit`)}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                        Modifier
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`${
                            isDeleting ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                        } text-white`}
                    >
                        {isDeleting ? "Suppression..." : "Supprimer"}
                    </Button>
                </div>

                {/* Card: Commentaires */}
                <div className="bg-white shadow rounded-lg p-6 border border-gray-300">
                    <h2 className="text-2xl font-semibold mb-4">Commentaires :</h2>
                    {fiche.comments?.length > 0 ? (
                        <ul className="space-y-4">
                            {fiche.comments.map((comment: any, index: number) => (
                                <li
                                    key={index}
                                    className="border border-gray-300 p-4 rounded shadow bg-gray-50"
                                >
                                    <p className="font-semibold">{comment.author?.name || "Anonyme"}</p>
                                    <p>{comment.content}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">Aucun commentaire pour cette fiche.</p>
                    )}
                </div>
            </div>
        </div>
            );
            }
