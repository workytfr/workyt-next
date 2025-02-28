"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import MDEditor from "@uiw/react-md-editor";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ILesson } from "@/models/Lesson";
import MarkdownBlockButtons from "./MarkdownBlockButtons";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

interface LessonFormProps {
    onSuccess: (lesson: ILesson) => void;
}

export default function LessonForm({ onSuccess }: LessonFormProps) {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [courseId, setCourseId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]); // ✅ Permet d'ajouter plusieurs fichiers
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // 🌍 Charger les cours avec pagination et recherche
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch(`/api/courses?page=1&limit=10&search=${searchQuery}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                } else {
                    console.error("Erreur lors du chargement des cours :", await res.text());
                }
            } catch (error) {
                console.error("Erreur réseau lors du chargement des cours :", error);
            } finally {
                setLoadingCourses(false);
            }
        }

        fetchCourses();
    }, [searchQuery, session?.accessToken]);

    // 🔥 Gérer l'ajout de fichiers
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]); // ✅ Ajoute plusieurs fichiers
        }
    };

    // 📌 Soumission du formulaire avec fichiers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!session || !session.user || !session.accessToken) {
            console.error("Erreur d'authentification : Veuillez vous connecter.");
            return;
        }

        if (!courseId || !sectionId || !title || !content) {
            console.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        const formData = new FormData();
        formData.append("courseId", courseId);
        formData.append("sectionId", sectionId);
        formData.append("title", title);
        formData.append("content", content);
        formData.append("authorId", session.user.id);
        files.forEach((file) => formData.append("media", file)); // ✅ Ajoute les fichiers

        try {
            const res = await fetch("/api/lessons", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formData,
            });

            if (res.ok) {
                const lesson: ILesson = await res.json();
                onSuccess(lesson);
            } else {
                console.error("Erreur lors de la création de la leçon", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[80vh] overflow-y-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Rechercher un cours..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

                <Select onValueChange={setCourseId} disabled={loadingCourses}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choisissez un cours" />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingCourses ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select onValueChange={setSectionId} disabled={!courseId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une section" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.find((course) => course._id === courseId)?.sections.map((section) => (
                            <SelectItem key={section._id} value={section._id}>{section.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input placeholder="Titre de la leçon" value={title} onChange={(e) => setTitle(e.target.value)} />

                <MDEditor value={content} onChange={(value) => setContent(value || "")} previewOptions={{ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }} height={250} />
                {/* 📌 Ajout de fichiers */}
                <Input type="file" multiple onChange={handleFilesChange} />
                
                <Button type="submit" disabled={loading || !sectionId}>{loading ? "Création en cours..." : "Créer la leçon"}</Button>
            </form>
        </div>
    );
}
