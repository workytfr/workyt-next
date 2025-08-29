"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Image from "next/image";
import { educationData } from "@/data/educationData";
import MDEditor from "@uiw/react-md-editor";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession, signIn } from "next-auth/react";
import SectionManager from "./SectionManager";
import { UploadButton } from "@/utils/uploadthing";

interface CourseFormProps {
    course?: any;
    onSuccess: (course: any) => void;
    onError?: (error: any) => void;
}

export default function CourseForm({ course, onSuccess, onError }: CourseFormProps) {
    const { data: session, update } = useSession();
    const [formData, setFormData] = useState({
        title: course?.title || "",
        description: course?.description || "",
        niveau: course?.niveau || "",
        matiere: course?.matiere || "",
    });

    // Stocke l'URL de l'image uploadée
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(course?.image || "");
    const [imagePreview, setImagePreview] = useState<string>(course?.image || "");

    // Gestion d'erreur locale
    const [error, setError] = useState<string | null>(null);

    // Fonction de gestion d'erreur locale
    const handleError = (error: any, context: string) => {
        console.error(`Erreur dans ${context}:`, error);
        setError(`Une erreur est survenue dans ${context}. Veuillez réessayer.`);
        if (onError) {
            onError(error);
        }
        setTimeout(() => setError(null), 5000);
    };

    // Fonction sécurisée pour exécuter des opérations
    const safeExecute = (fn: Function, context: string) => {
        try {
            return fn();
        } catch (error) {
            handleError(error, context);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!session || !session.accessToken) {
            console.error("Erreur d'authentification : Aucun token fourni.");
            try {
                await signIn();
            } catch (error) {
                console.error("Erreur lors de la connexion:", error);
            }
            return;
        }

        const method = course ? "PUT" : "POST";
        const url = course ? `/api/courses/${course._id}` : "/api/courses";

        const payload = {
            title: formData.title,
            description: formData.description,
            niveau: formData.niveau,
            matiere: formData.matiere,
            image: uploadedImageUrl, // URL de l'image obtenue via Uploadthing
        };

        try {
            const res = await fetch(url, {
                method,
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (res.status === 401) {
                console.error("JWT expiré, rafraîchissement de la session...");
                try {
                    await update();
                } catch (error) {
                    console.error("Erreur lors du rafraîchissement de la session:", error);
                }
                return;
            }

            if (res.ok) {
                try {
                    const data = await res.json();
                    onSuccess(data);
                } catch (error) {
                    console.error("Erreur lors du parsing de la réponse:", error);
                }
            } else {
                console.error("Erreur lors de la création du cours :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
            <Input
                placeholder="Titre du cours"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <label className="block text-sm font-medium text-gray-700">Description du cours</label>
            <div className="border rounded-md">
                <MDEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value || "" })}
                    previewOptions={{
                        remarkPlugins: [remarkMath],
                        rehypePlugins: [rehypeKatex],
                    }}
                    height={200}
                    onError={(error) => {
                        console.error("Erreur de l'éditeur MD:", error);
                    }}
                />
            </div>

            <label className="block text-sm font-medium text-gray-700">Niveau scolaire</label>
            <Select onValueChange={(value) => setFormData({ ...formData, niveau: value })} value={formData.niveau}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                    {educationData.levels.map((level) => (
                        <SelectItem key={level} value={level}>
                            {level}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <label className="block text-sm font-medium text-gray-700">Matière</label>
            <Select onValueChange={(value) => setFormData({ ...formData, matiere: value })} value={formData.matiere}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                    {educationData.subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                            {subject}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Intégration du composant SectionManager */}
            {course?._id && (
                <div className="border-t pt-4">
                    <SectionManager 
                        courseId={course._id} 
                        session={session}
                        onError={(error: any) => {
                            if (onError) {
                                onError(error);
                            }
                        }}
                    />
                </div>
            )}

            <label className="block text-sm font-medium text-gray-700">Image de fond du cours</label>
            {/* Bouton Uploadthing pour uploader l'image */}
            <div className="border rounded-md p-4">
                <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                        if (res && res.length > 0) {
                            const imageUrl = res[0].url;
                            setUploadedImageUrl(imageUrl);
                            setImagePreview(imageUrl);
                        }
                    }}
                    onUploadError={(error: Error) => {
                        console.error("Erreur lors de l'upload:", error.message);
                    }}
                    onUploadBegin={(fileName) => {
                        console.log("Début de l'upload:", fileName);
                    }}
                />
            </div>

            {imagePreview && (
                <div className="mt-2">
                    <Image
                        src={imagePreview}
                        alt="Aperçu de l'image"
                        width={200}
                        height={100}
                        className="rounded-md shadow"
                        onError={(e) => {
                            console.error("Erreur de chargement de l'image:", e);
                            setImagePreview("");
                        }}
                    />
                </div>
            )}

            <Button type="submit">{course ? "Modifier" : "Créer"} le cours</Button>

            {/* Affichage de l'erreur locale */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="inline-flex text-red-400 hover:text-red-600"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
