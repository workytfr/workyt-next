"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/skeleton";
import { educationData } from "@/data/educationData";

// Import dynamique pour éviter les problèmes de rendu côté serveur
const MdEditor = dynamic(() => import("md-editor-rt").then((mod) => mod.MdEditor), { ssr: false });

export default function UploadForm() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [subject, setSubject] = useState("");
    const [level, setLevel] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Indicateur de soumission

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-white">
                <Skeleton className="w-48 h-8 rounded" />
                <Skeleton className="w-full max-w-2xl h-16 rounded" />
                <Skeleton className="w-full max-w-2xl h-72 rounded" />
                <Skeleton className="w-32 h-10 rounded" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !subject || !level) {
            setAlertMessage("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setIsSubmitting(true); // Active l'indicateur de soumission

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("subject", subject);
        formData.append("level", level);

        files.forEach((file) => formData.append("file", file));

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/fiches", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Erreur : ${response.statusText}`);
            }

            const result = await response.json();
            setAlertMessage("Fiche publiée avec succès !");
            router.push("/success-page");
        } catch (error) {
            console.error("Erreur lors de la publication :", error);
            setAlertMessage("Une erreur est survenue lors de la publication de la fiche.");
        } finally {
            setIsSubmitting(false); // Désactive l'indicateur de soumission
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white text-black">
            <div className="flex-grow container mx-auto mt-8 px-4 sm:px-6 lg:px-8">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-6 p-8 bg-white shadow-lg rounded-lg w-full max-w-6xl mx-auto"
                >
                    <h1 className="text-3xl font-bold text-center">Publier une fiche</h1>

                    {/* Alert Component */}
                    {alertMessage && (
                        <Alert
                            className="bg-red-100 text-red-800 p-4 rounded border border-red-200"
                            role="alert"
                        >
                            <div>
                                <AlertTitle>Notification</AlertTitle>
                                <AlertDescription>{alertMessage}</AlertDescription>
                            </div>
                        </Alert>
                    )}

                    <Input
                        type="text"
                        placeholder="Titre"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded bg-white text-black"
                    />
                    <div className="flex-grow">
                        <MdEditor
                            modelValue={content}
                            onChange={setContent}
                            previewTheme="github"
                            theme="light"
                            language="fr"
                            style={{ height: "400px", width: "100%" }}
                        />
                    </div>
                    <div className="flex space-x-4">
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="flex-1 p-4 border border-gray-300 rounded bg-white text-black"
                        >
                            <option value="" disabled>
                                Choisir une matière
                            </option>
                            {educationData.subjects.map((subject, index) => (
                                <option key={index} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </select>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="flex-1 p-4 border border-gray-300 rounded bg-white text-black"
                        >
                            <option value="" disabled>
                                Choisir un niveau
                            </option>
                            {educationData.levels.map((level, index) => (
                                <option key={index} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        type="file"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        className="w-full p-4 border border-gray-300 rounded bg-white text-black"
                    />

                    {/* Submit Button with Loading State */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 ${
                            isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-800"
                        } text-white`}
                    >
                        {isSubmitting ? "Envoi en cours..." : "Publier"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
