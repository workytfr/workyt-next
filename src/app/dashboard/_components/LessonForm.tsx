"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { useSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ILesson } from "@/models/Lesson";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

interface LessonFormProps {
    lesson?: ILesson; // En édition, cette prop est définie
    onSuccess: (lesson: ILesson) => void;
}

export default function LessonForm({ lesson, onSuccess }: LessonFormProps) {
    const { data: session, update } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    // On garde la sélection du cours uniquement pour filtrer les sections
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    // Le champ qui sera envoyé est uniquement sectionId
    const [sectionId, setSectionId] = useState<string>(lesson?.sectionId.toString() || "");
    const [title, setTitle] = useState<string>(lesson?.title || "");
    const [content, setContent] = useState<string>(lesson?.content || "");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Lorsqu'une leçon est passée en mode édition, on met à jour les états
    useEffect(() => {
        if (lesson) {
            setSectionId(lesson.sectionId.toString());
            setTitle(lesson.title || "");
            setContent(lesson.content || "");
        }
    }, [lesson]);

    // Forcer le thème clair
    useEffect(() => {
        document.body.classList.remove("dark");
        document.body.style.backgroundColor = "white";
        document.body.style.color = "black";
    }, []);

    // Chargement des cours en fonction de la recherche
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch(
                    `/api/courses?page=1&limit=10&search=${encodeURIComponent(searchQuery)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );
                if (res.status === 401) {
                    console.error("JWT expiré, rafraîchissement de la session...");
                    await update();
                    return;
                }
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                setCourses(data.courses || []);
            } catch (error) {
                console.error("Erreur lors du chargement des cours :", error);
            } finally {
                setLoadingCourses(false);
            }
        }
        fetchCourses();
    }, [searchQuery, session?.accessToken, update]);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session || !session.user || !session.accessToken) {
            await signIn();
            return;
        }
        if (!sectionId || !title.trim() || !content.trim()) {
            console.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);
        try {
            let res;
            if (lesson) {
                // Mode édition : envoi d'un JSON (sans fichiers)
                const payload = {
                    sectionId,
                    title,
                    content,
                    authorId: session.user.id,
                };
                res = await fetch(`/api/lessons/${lesson._id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // Mode création : utilisation de FormData pour gérer l'upload de fichiers
                const formData = new FormData();
                formData.append("sectionId", sectionId);
                formData.append("title", title);
                formData.append("content", content);
                formData.append("authorId", session.user.id);
                files.forEach((file) => formData.append("media", file));
                res = await fetch("/api/lessons", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                    body: formData,
                });
            }
            if (res.status === 401) {
                console.error("JWT expiré, rafraîchissement de la session...");
                await update();
                return;
            }
            if (!res.ok) throw new Error(await res.text());
            const updatedLesson: ILesson = await res.json();
            onSuccess(updatedLesson);

            // Réinitialiser le formulaire en mode création
            if (!lesson) {
                setSelectedCourseId("");
                setSectionId("");
                setTitle("");
                setContent("");
                setFiles([]);
                setSearchQuery("");
            }
        } catch (error) {
            console.error("Erreur lors de la création/modification de la leçon", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[80vh] overflow-y-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select onValueChange={setSelectedCourseId} disabled={loadingCourses}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choisissez un cours" />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingCourses ? (
                            <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                        ) : (
                            courses.map((course) => (
                                <SelectItem key={course._id} value={course._id}>
                                    {course.title}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                {selectedCourseId && (
                    <Select onValueChange={setSectionId} disabled={!selectedCourseId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une section" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses
                                .find((course) => course._id === selectedCourseId)
                                ?.sections.map((section) => (
                                    <SelectItem key={section._id} value={section._id}>
                                        {section.title}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                )}
                <Input
                    placeholder="Titre de la leçon"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <RichTextEditor content={content} onChange={setContent} />
                <Input type="file" multiple onChange={handleFilesChange} />
                {files.length > 0 && (
                    <ul className="list-disc ml-4">
                        {files.map((file, index) => (
                            <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                )}
                <Button type="submit" disabled={loading || !sectionId}>
                    {loading
                        ? lesson
                            ? "Mise à jour en cours..."
                            : "Création en cours..."
                        : lesson
                            ? "Modifier la leçon"
                            : "Créer la leçon"}
                </Button>
            </form>
        </div>
    );
}
