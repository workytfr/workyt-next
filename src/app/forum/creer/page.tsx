"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/skeleton";
import MDEditor from "@uiw/react-md-editor";
import { educationData } from "@/data/educationData";
import { FaFileUpload, FaGraduationCap, FaCheck, FaSpinner, FaPen, FaTrash } from "react-icons/fa";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

export default function ForumPostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [classLevel, setClassLevel] = useState("");
    const [subject, setSubject] = useState("");
    const [whatIDid, setWhatIDid] = useState<string | undefined>("");
    const [whatINeed, setWhatINeed] = useState<string | undefined>("");
    const [points, setPoints] = useState<number>(5);
    const [files, setFiles] = useState<File[]>([]);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gray-100">
                <Skeleton className="w-48 h-8 rounded" />
                <Skeleton className="w-full max-w-2xl h-16 rounded" />
                <Skeleton className="w-full max-w-2xl h-72 rounded" />
                <Skeleton className="w-32 h-10 rounded" />
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles([...files, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !subject || !classLevel || !whatIDid || !whatINeed) {
            setAlertMessage("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("classLevel", classLevel);
        formData.append("subject", subject);
        formData.append("whatIDid", whatIDid || "");
        formData.append("whatINeed", whatINeed || "");
        formData.append("points", points.toString());

        files.forEach((file) => {
            formData.append("attachments", file);
            console.log("Ajout de fichier :", file.name);
        });

        console.log("FormData après ajout des fichiers :", formData.getAll("attachments"));

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/forum/creer", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Erreur : ${response.statusText}`);
            }

            setAlertMessage("Question publiée avec succès !");
            router.push("/forum");
        } catch (error) {
            console.error("Erreur lors de la publication :", error);
            setAlertMessage("Une erreur est survenue lors de la publication de la question.");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-3xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
              Poser une Question
            </h1>

            {alertMessage && (
                <Alert className="bg-red-100 text-red-800 p-4 rounded border border-red-200 mt-4">
                    <div>
                        <AlertTitle>Notification</AlertTitle>
                        <AlertDescription>{alertMessage}</AlertDescription>
                    </div>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col space-y-6 mt-4">
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaGraduationCap /> Titre de la question
                    </label>
                    <Input
                        type="text"
                        placeholder="Ex: Comment résoudre cette équation ?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border rounded-md p-3"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Matière</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 border rounded-md bg-white">
                            <option value="" disabled>Choisir une matière</option>
                            {educationData.subjects.map((subj, index) => (
                                <option key={index} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Niveau</label>
                        <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full p-3 border rounded-md bg-white">
                            <option value="" disabled>Choisir un niveau</option>
                            {educationData.levels.map((lvl, index) => (
                                <option key={index} value={lvl}>{lvl}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <FaPen className="text-blue-500" /> Ce que j&apos;ai fait
                    </h3>
                    <p className={"text-sm text-gray-500"}>Décrivez ce que vous avez déjà fait pour résoudre votre problème.</p>
                    <MDEditor
                        value={whatIDid}
                        onChange={setWhatIDid}
                        height={150}
                        previewOptions={{
                            remarkPlugins: [remarkMath],
                            rehypePlugins: [rehypeKatex],
                        }}
                    />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <FaPen className="text-green-500" /> Ce que j&apos;attends</h3>
                    <p className={"text-sm text-gray-500"}>Décrivez ce que vous attendez de la communauté.</p>
                    <MDEditor
                        value={whatINeed}
                        onChange={setWhatINeed}
                        height={150}
                        previewOptions={{
                            remarkPlugins: [remarkMath],
                            rehypePlugins: [rehypeKatex],
                        }}
                    />
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <FaFileUpload className="text-blue-500" /> Ajouter des fichiers
                    </h3>
                    <Input type="file" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
                    {files.length > 0 && (
                        <ul className="mt-2">
                            {files.map((file, index) => (
                                <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md mt-2">
                                    <span className="text-gray-700 flex items-center gap-2">📎 {file.name}</span>
                                    <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                                        <FaTrash />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Section des points */}
                <div className="flex items-center justify-end space-x-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaCheck/> Points mis en jeu
                    </label>
                    <Input
                        type="number"
                        min="1"
                        max="15"
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value))}
                        className="w-20 border rounded-md p-2"
                    />
                </div>

                <Button type="submit" className="w-full">
                    {isSubmitting ? <FaSpinner className="animate-spin"/> : "Publier la question"}
                </Button>
            </form>
        </div>
    );
}
