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
import { FaFileUpload, FaGraduationCap, FaCheck, FaSpinner, FaPen, FaTrash, FaImage, FaQuestion } from "react-icons/fa";
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
            router.push("/forum");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-indigo-50">
                <Skeleton className="w-48 h-8 rounded" />
                <Skeleton className="w-full max-w-2xl h-16 rounded" />
                <Skeleton className="w-full max-w-2xl h-72 rounded" />
                <Skeleton className="w-32 h-10 rounded" />
            </div>
        );
    }

    /** 📌 Fonction d'upload sur Imgur **/
    const uploadImageToImgur = async (file: File, setEditorContent: React.Dispatch<React.SetStateAction<string | undefined>>) => {
        const clientId = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID;
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("https://api.imgur.com/3/image", {
                method: "POST",
                headers: {
                    Authorization: `Client-ID ${clientId}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                const imageUrl = data.data.link;
                setEditorContent((prev) => `${prev}\n\n![Image](${imageUrl})`); // ✅ Ajout automatique dans l'éditeur
            } else {
                setAlertMessage("Erreur lors de l'upload de l'image.");
            }
        } catch (error) {
            console.error("Erreur d'upload sur Imgur :", error);
            setAlertMessage("Impossible d'uploader l'image.");
        }
    };

    /** 📌 Fonction de gestion de l'upload depuis l'éditeur **/
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, setEditorContent: React.Dispatch<React.SetStateAction<string | undefined>>) => {
        const file = event.target.files?.[0];
        if (file) {
            await uploadImageToImgur(file, setEditorContent);
        }
    };

    /** 📌 Empêcher la soumission du formulaire lors du clic sur "Ajouter une image" **/
    const handleImageUploadClick = (inputId: string) => {
        document.getElementById(inputId)?.click();
    };

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
        });


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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-10 px-4">
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-xl border border-purple-100">
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center justify-center gap-3">
                    <FaQuestion className="text-purple-500" /> Poser une Question
                </h1>

                {alertMessage && (
                    <Alert className={`p-4 rounded-lg border mt-4 ${alertMessage.includes("succès") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                        <div>
                            <AlertTitle className="font-semibold">{alertMessage.includes("succès") ? "Bravo !" : "Attention"}</AlertTitle>
                            <AlertDescription>{alertMessage}</AlertDescription>
                        </div>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col space-y-6 mt-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-indigo-700 flex items-center gap-2 mb-2">
                            <FaGraduationCap className="text-purple-500" /> Titre de la question
                        </label>
                        <Input
                            type="text"
                            placeholder="Ex: Comment résoudre cette équation ?"
                            value={title}
                            onChange={(e) => {
                                const newTitle = e.target.value.slice(0, 100);
                                setTitle(newTitle);
                            }}
                            className="border border-indigo-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 text-black"
                        />
                        <div className="text-xs text-right text-indigo-400 mt-1">{title.length}/100</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-indigo-700 mb-2 block">Matière</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-3 border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 text-black"
                            >
                                <option value="" disabled>Choisir une matière</option>
                                {educationData.subjects.map((subj, index) => (
                                    <option key={index} value={subj}>{subj}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-indigo-700 mb-2 block">Niveau</label>
                            <select
                                value={classLevel}
                                onChange={(e) => setClassLevel(e.target.value)}
                                className="w-full p-3 border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 text-black"
                            >
                                <option value="" disabled>Choisir un niveau</option>
                                {educationData.levels.map((lvl, index) => (
                                    <option key={index} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h3 className="text-lg font-medium text-indigo-800 flex items-center gap-2 mb-2">
                            <FaPen className="text-blue-500" /> Ce que j&apos;ai fait
                        </h3>
                        <p className="text-sm text-indigo-600 mb-3">Décrivez ce que vous avez déjà fait pour résoudre votre problème.</p>
                        <div className="rounded-lg overflow-hidden">
                            <MDEditor
                                value={whatIDid}
                                onChange={setWhatIDid}
                                height={150}
                                highlightEnable={false}
                                previewOptions={{
                                    remarkPlugins: [remarkMath],
                                    rehypePlugins: [rehypeKatex],
                                }}
                            />
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2 mb-2">
                            <FaPen className="text-purple-500" /> Ce que j&apos;attends
                        </h3>
                        <p className="text-sm text-purple-600 mb-3">Décrivez ce que vous attendez de la communauté.</p>
                        <div className="rounded-lg overflow-hidden">
                            <MDEditor
                                value={whatINeed}
                                onChange={setWhatINeed}
                                height={150}
                                highlightEnable={false}
                                previewOptions={{
                                    remarkPlugins: [remarkMath],
                                    rehypePlugins: [rehypeKatex],
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            className="mt-3 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 transition duration-200"
                            onClick={() => handleImageUploadClick("uploadWhatINeed")}
                        >
                            <FaImage /> Ajouter une image
                        </Button>
                        <input type="file" id="uploadWhatINeed" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setWhatINeed)} />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="text-lg font-medium text-blue-800 flex items-center gap-2 mb-3">
                            <FaFileUpload className="text-blue-500" /> Ajouter des fichiers
                        </h3>
                        <Input
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            onChange={handleFileChange}
                            className="border border-blue-200 bg-white"
                        />
                        {files.length > 0 && (
                            <ul className="mt-3 space-y-2">
                                {files.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                                        <span className="text-indigo-700 flex items-center gap-2">📎 {file.name}</span>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                            type="button"
                                        >
                                            <FaTrash />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Section des points */}
                    <div className="flex items-center justify-end space-x-2 border-t border-purple-100 pt-4">
                        <label className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                            <FaCheck className="text-purple-500"/> Points mis en jeu
                        </label>
                        <Input
                            type="number"
                            min="1"
                            max="15"
                            value={points}
                            onChange={(e) => setPoints(parseInt(e.target.value))}
                            className="w-20 border border-indigo-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent text-black"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    >
                        {isSubmitting ?
                            <FaSpinner className="animate-spin mr-2"/> :
                            "Publier la question"
                        }
                    </Button>
                </form>
            </div>
        </div>
    );
}