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
}

export default function CourseForm({ course, onSuccess }: CourseFormProps) {
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!session || !session.accessToken) {
            console.error("Erreur d'authentification : Aucun token fourni.");
            await signIn();
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
                await update();
                return;
            }

            if (res.ok) {
                const data = await res.json();
                onSuccess(data);
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
            <MDEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value || "" })}
                previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                }}
                height={200}
            />

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
            {course?._id && <SectionManager courseId={course._id} session={session} />}

            <label className="block text-sm font-medium text-gray-700">Image de fond du cours</label>
            {/* Bouton Uploadthing pour uploader l'image */}
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
            />

            {imagePreview && (
                <div className="mt-2">
                    <Image
                        src={imagePreview}
                        alt="Aperçu de l'image"
                        width={200}
                        height={100}
                        className="rounded-md shadow"
                    />
                </div>
            )}

            <Button type="submit">{course ? "Modifier" : "Créer"} le cours</Button>
        </form>
    );
}
