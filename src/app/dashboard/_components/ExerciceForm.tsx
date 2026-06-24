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
import MDEditor from "@uiw/react-md-editor/nohighlight";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

/** Extrait un id depuis une valeur qui peut être une string ou un objet peuplé {_id}. */
const extractId = (value: any): string => {
    if (!value) return "";
    if (typeof value === "object") return String(value._id || "");
    return String(value);
};

interface ExerciseFormProps {
    exercise?: any;
    onSuccess: (exercise: any) => void;
    /**
     * Quand on édite depuis une section connue (structure du cours), on verrouille
     * la section : on n'affiche pas le sélecteur cours/section, comme pour QuizForm.
     */
    lockedSectionId?: string;
    lockedSectionLabel?: string;
}

export default function ExerciseForm({ exercise, onSuccess, lockedSectionId, lockedSectionLabel }: ExerciseFormProps) {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<ICourse[]>([]);
    const [courseSearch, setCourseSearch] = useState<string>("");
    const [courseId, setCourseId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>(lockedSectionId || extractId(exercise?.sectionId));
    const [formData, setFormData] = useState({
        title: exercise?.title || "",
        content: exercise?.content || "",
        correctionText: exercise?.correction?.text || "",
        difficulty: exercise?.difficulty || "",
    });

    // Stocker les URLs d'image issues d'Uploadthing
    const [imagePreview, setImagePreview] = useState<string>(exercise?.image || "");
    const [correctionImagePreview, setCorrectionImagePreview] = useState<string>(exercise?.correction?.image || "");
    const [loading, setLoading] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Mise à jour si la prop exercise change
    useEffect(() => {
        if (exercise) {
            setFormData({
                title: exercise.title || "",
                content: exercise.content || "",
                correctionText: exercise.correction?.text || "",
                difficulty: exercise.difficulty || "",
            });
            setSectionId(extractId(exercise.sectionId));
            setImagePreview(exercise.image || "");
            setCorrectionImagePreview(exercise.correction?.image || "");
        }
    }, [exercise]);

    // Charger les cours une seule fois (inutile si la section est verrouillée)
    useEffect(() => {
        if (lockedSectionId) return;
        async function fetchCourses() {
            setLoadingCourses(true);
            try {
                const res = await fetch("/api/courses?limit=200");
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
    }, [lockedSectionId]);

    // Recherche dynamique des cours
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

    // Déterminer le cours associé à l'exercice (si existant)
    useEffect(() => {
        if (exercise && courses.length > 0) {
            const sid = extractId(exercise.sectionId);
            const courseFound = courses.find(course =>
                course.sections.some(section => section._id === sid)
            );
            if (courseFound) {
                setCourseId(courseFound._id);
            }
        }
    }, [exercise, courses]);

    // Soumission du formulaire
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

        // Création d'un FormData incluant les données et les URLs d'image
        const formDataToSend = new FormData();
        formDataToSend.append("sectionId", sectionId);
        formDataToSend.append("title", formData.title);
        formDataToSend.append("content", formData.content);
        formDataToSend.append("correctionText", formData.correctionText);
        formDataToSend.append("difficulty", formData.difficulty);

        if (imagePreview) {
            formDataToSend.append("image", imagePreview);
        }
        if (correctionImagePreview) {
            formDataToSend.append("correctionImage", correctionImagePreview);
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
            {lockedSectionId ? (
                lockedSectionLabel && (
                    <p className="text-sm text-gray-500">
                        Section : <span className="font-medium text-gray-700">{lockedSectionLabel}</span>
                    </p>
                )
            ) : (
                <>
                    {/* 🔍 Recherche de cours */}
                    <label className="block text-sm font-medium text-gray-700">Rechercher un cours</label>
                    <Input
                        placeholder="Tapez le nom d'un cours..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                    />

                    <label className="block text-sm font-medium text-gray-700">Sélectionner un cours</label>
                    <Select value={courseId} onValueChange={setCourseId} disabled={loadingCourses}>
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
                </>
            )}

            {/* 📌 Titre de l'exercice */}
            <Input
                placeholder="Titre de l'exercice"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            {/* 📌 Contenu de l'exercice */}
            <div data-color-mode="light">
            <MDEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value || "" })}
                highlightEnable={false}
                previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                }}
            />
            </div>

            {/* 📌 Texte de correction */}
            <div data-color-mode="light">
            <MDEditor
                value={formData.correctionText}
                onChange={(value) => setFormData({ ...formData, correctionText: value || "" })}
                highlightEnable={false}
                previewOptions={{
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [rehypeKatex],
                }}
            />
            </div>

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

            {/* Upload d'image d'exercice via Uploadthing */}
            <label className="block text-sm font-medium text-gray-700">Ajouter une image d&apos;exercice</label>
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                        const imageUrl = res[0].url;
                        setImagePreview(imageUrl);
                    }
                }}
                onUploadError={(error: Error) => {
                    console.error("Erreur lors de l'upload d'image d'exercice:", error.message);
                }}
            />
            {imagePreview && <Image src={imagePreview} alt="Exercice" width={200} height={100} />}

            {/* Upload d'image de correction via Uploadthing */}
            <label className="block text-sm font-medium text-gray-700">Ajouter une image de correction</label>
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                        const imageUrl = res[0].url;
                        setCorrectionImagePreview(imageUrl);
                    }
                }}
                onUploadError={(error: Error) => {
                    console.error("Erreur lors de l'upload d'image de correction:", error.message);
                }}
            />
            {correctionImagePreview && <Image src={correctionImagePreview} alt="Correction" width={200} height={100} />}

            <Button type="submit">{exercise ? "Modifier" : "Créer"} l&apos;exercice</Button>
            {loading && <Loader2 className="animate-spin" />}
        </form>
    );
}
