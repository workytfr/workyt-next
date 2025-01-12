"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Hook pour gérer la session
import { useRouter } from "next/navigation"; // Pour rediriger l'utilisateur
import Navbar from "@/components/navbar/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { educationData } from "@/data/educationData";

export default function UploadForm() {
    const { data: session, status } = useSession(); // Récupération de la session
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [subject, setSubject] = useState("");
    const [level, setLevel] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    // Redirection si l'utilisateur n'est pas connecté
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/"); // Redirige vers la page de connexion
        }
    }, [status, router]);

    // Ne rien afficher tant que l'état de la session n'est pas déterminé
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Chargement...</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation des champs
        if (!title || !subject || !level) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("subject", subject);
        formData.append("level", level);

        files.forEach((file) => formData.append("file", file));

        try {
            const token = (session as any)?.accessToken || ""; // Assurez-vous que `accessToken` contient le JWT
            console.log("Token JWT :", token);
            console.log("Données de session :", session);
            const response = await fetch("/api/fiches", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Ajoutez le token JWT ici
                },
                body: formData,
            });


            if (!response.ok) {
                throw new Error(`Erreur : ${response.statusText}`);
            }

            const result = await response.json();
            console.log("Fiche publiée :", result);
            alert("Fiche publiée avec succès !");
            router.push("/success-page"); // Redirection après succès
        } catch (error) {
            console.error("Erreur lors de la publication :", error);
            alert("Une erreur est survenue lors de la publication de la fiche.");
        }
    };

    return (
        <div className="min-h-screen bg-white text-black">
            <Navbar />
            <div className="container mx-auto mt-8 px-4 sm:px-6 lg:px-8 space-y-6">
                <h1 className="text-2xl font-bold text-center">Publier une fiche</h1>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 max-w-2xl mx-auto p-6 border border-black rounded bg-white"
                >
                    <Input
                        type="text"
                        placeholder="Titre"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-black rounded bg-white text-black"
                    />
                    <Textarea
                        placeholder="Contenu"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-2 border border-black rounded bg-white text-black"
                    />
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2 border border-black rounded bg-white text-black"
                    >
                        <option value="" disabled>Choisir une matière</option>
                        {educationData.subjects.map((subject, index) => (
                            <option key={index} value={subject}>
                                {subject}
                            </option>
                        ))}
                    </select>
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full p-2 border border-black rounded bg-white text-black"
                    >
                        <option value="" disabled>Choisir un niveau</option>
                        {educationData.levels.map((level, index) => (
                            <option key={index} value={level}>
                                {level}
                            </option>
                        ))}
                    </select>
                    <Input
                        type="file"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        className="w-full p-2 border border-black rounded bg-white text-black"
                    />
                    <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                        Publier
                    </Button>
                </form>
            </div>
        </div>
    );
}
