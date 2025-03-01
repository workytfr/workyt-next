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
import Image from "next/image";
import MDEditor from "@uiw/react-md-editor";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

interface ExerciseFormProps {
    exercise?: any;
    onSuccess: (exercise: any) => void;
}

export default function ExerciseForm({ exercise, onSuccess }: ExerciseFormProps) {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<ICourse[]>([]);
    const [courseSearch, setCourseSearch] = useState<string>("");
    const [courseId, setCourseId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>(exercise?.sectionId || "");
    const [formData, setFormData] = useState({
        title: exercise?.title || "",
        content: exercise?.content || "",
        correctionText: exercise?.correction?.text || "",
        difficulty: exercise?.difficulty || "",
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [correctionImageFile, setCorrectionImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(exercise?.image || "");
    const [correctionImagePreview, setCorrectionImagePreview] = useState<string>(exercise?.correction?.image || "");
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Mise à jour des états si la prop exercise change
    useEffect(() => {
        if (exercise) {
            setFormData({
                title: exercise.title || "",
                content: exercise.content || "",
                correctionText: exercise.correction?.text || "",
                difficulty: exercise.difficulty || "",
            });
            setSectionId(exercise.sectionId || "");
            setImagePreview(exercise.image || "");
            setCorrectionImagePreview(exercise.correction?.image || "");
        }
    }, [exercise]);

    // Lorsqu'on a chargé les cours, déterminer le cours associé à la section de l'exercice
    useEffect(() => {
        if (exercise && courses.length > 0) {
            const courseFound = courses.find(course =>
                course.sections.some(section => section._id === exercise.sectionId)
            );
            if (courseFound) {
                setCourseId(courseFound._id);
            }
        }
    }, [exercise, courses]);

    // 📌 Charger les cours et sections associées
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch(`/api/courses?page=1&limit=10`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                    setFilteredCourses(data.courses || []);
                } else {
                    console.error("Erreur lors du chargement des cours :", await res.text());
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
            } finally {
                setLoadingCourses(false);
            }
        }
        fetchCourses();
    }, [session?.accessToken]);

    // 🔍 Recherche dynamique des cours
    useEffect(() => {
        if (!courseSearch.trim()) {
            setFilteredCourses(courses);
        } else {
            const filtered = courses.filter((course) =>
                course.title.toLowerCase().includes(courseSearch.toLowerCase())
            );
            setFilteredCourses(filtered);
        }
    }, [courseSearch, courses]);

    // 📌 Gérer l'upload d'image et afficher la prévisualisation
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "exercise" | "correction") => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === "exercise") {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            } else {
                setCorrectionImageFile(file);
                setCorrectionImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleCorrectionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCorrectionImageFile(file);
            setCorrectionImagePreview(URL.createObjectURL(file));
        }
    };

    // 📌 Gérer la soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!session || !session.accessToken) {
            console.error("Erreur d'authentification : Aucun token fourni.");
            await signIn();
            return;
        }

        if (!sectionId || !formData.title || !formData.content || !formData.difficulty) {
            console.error("Veuillez remplir tous les champs obligatoires.");
            setLoading(false);
            return;
        }

        // ✅ Création d'un `FormData` pour envoyer les données et les images
        const formDataToSend = new FormData();
        formDataToSend.append("sectionId", sectionId);
        formDataToSend.append("title", formData.title);
        formDataToSend.append("content", formData.content);
        formDataToSend.append("correctionText", formData.correctionText);
        formDataToSend.append("difficulty", formData.difficulty);

        if (imageFile) {
            formDataToSend.append("image", imageFile);
        }

        if (correctionImageFile) {
            formDataToSend.append("correctionImage", correctionImageFile);
        }

        const method = exercise ? "PUT" : "POST";
        const url = exercise ? `/api/exercises/${exercise._id}` : "/api/exercises";

        try {
            const res = await fetch(url, {
                method,
                body: formDataToSend,
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            if (res.ok) {
                const data = await res.json();
                onSuccess(data);
            } else {
                console.error("Erreur lors de la création/modification de l'exercice :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
            {/* 🔍 Recherche de cours */}
            <label className="block text-sm font-medium text-gray-700">Rechercher un cours</label>
            <Input
                placeholder="Tapez le nom d'un cours..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
            />

            {/* 📌 Sélection du cours */}
            <label className="block text-sm font-medium text-gray-700">Sélectionner un cours</label>
            <Select onValueChange={setCourseId} disabled={loadingCourses}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisissez un cours" />
                </SelectTrigger>
                <SelectContent>
                    {filteredCourses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                            {course.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 📌 Sélection de la section */}
            <label className="block text-sm font-medium text-gray-700">Sélectionner une section</label>
            <Select onValueChange={setSectionId} value={sectionId} disabled={!courseId}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisissez une section" />
                </SelectTrigger>
                <SelectContent>
                    {filteredCourses
                        .find((course) => course._id === courseId)
                        ?.sections.map((section) => (
                            <SelectItem key={section._id} value={section._id}>
                                {section.title}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>

            {/* 📌 Titre de l'exercice */}
            <Input
                placeholder="Titre de l'exercice"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            {/* 📌 Contenu de l'exercice */}
            <MDEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value || "" })}
                previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                }}
            />

            {/* 📌 Texte de correction */}
            <MDEditor
                value={formData.correctionText}
                onChange={(value) => setFormData({ ...formData, correctionText: value || "" })}
                previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                }}
            />

            {/* 📌 Sélection de la difficulté */}
            <label className="block text-sm font-medium text-gray-700">Sélectionner une difficulté</label>
            <Select
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                value={formData.difficulty}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Choisissez un niveau" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Facile 1">Facile 1</SelectItem>
                    <SelectItem value="Facile 2">Facile 2</SelectItem>
                    <SelectItem value="Moyen 1">Moyen 1</SelectItem>
                    <SelectItem value="Moyen 2">Moyen 2</SelectItem>
                    <SelectItem value="Difficile 1">Difficile 1</SelectItem>
                    <SelectItem value="Difficile 2">Difficile 2</SelectItem>
                    <SelectItem value="Élite">Élite</SelectItem>
                </SelectContent>
            </Select>

            {/* 📌 Upload des images */}
            <label>Ajouter une image</label>
            <Input type="file" accept="image/*" onChange={(e) => handleImageChange(e, "exercise")} />
            {imagePreview && <Image src={imagePreview} alt="Exercice" width={200} height={100} />}

            <label>Image de correction</label>
            <Input type="file" accept="image/*" onChange={handleCorrectionImageChange} />
            {correctionImagePreview && <Image src={correctionImagePreview} alt="Correction" width={200} height={100} />}

            <Button type="submit">{exercise ? "Modifier" : "Créer"} l&apos;exercice</Button>
            {loading && <Loader2 className="animate-spin" />}
        </form>
    );
}
