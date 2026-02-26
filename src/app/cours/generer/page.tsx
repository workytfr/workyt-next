"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    Upload, Sparkles, ChevronDown, ChevronUp, GripVertical,
    Trash2, Plus, FileText, Loader2, BookOpen, ArrowLeft, Check
} from "lucide-react";
import { educationData } from "@/data/educationData";
import Link from "next/link";
import "katex/dist/katex.min.css";

interface LessonDraft {
    title: string;
    content: string;
    order: number;
}

interface SectionDraft {
    title: string;
    order: number;
    lessons: LessonDraft[];
    collapsed?: boolean;
}

interface CourseDraft {
    title: string;
    matiere: string;
    niveau: string;
    description?: string;
    sections: SectionDraft[];
}

type Step = "form" | "generating" | "editing";

export default function GenerateCoursePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>("form");
    const [title, setTitle] = useState("");
    const [matiere, setMatiere] = useState("");
    const [niveau, setNiveau] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [draft, setDraft] = useState<CourseDraft | null>(null);
    const [pdfInfo, setPdfInfo] = useState<{ pages: number; textLength: number } | null>(null);
    const [saving, setSaving] = useState(false);
    const [previewLesson, setPreviewLesson] = useState<string | null>(null);
    const [useWorkytV1, setUseWorkytV1] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.toLowerCase().endsWith(".pdf")) {
                setError("Seuls les fichiers PDF sont acceptés.");
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                setError("Le fichier ne doit pas dépasser 20 Mo.");
                return;
            }
            setPdfFile(file);
            setError("");
        }
    };

    const handleGenerate = async () => {
        if (!title.trim() || !matiere || !niveau || !pdfFile) {
            setError("Veuillez remplir tous les champs et uploader un PDF.");
            return;
        }

        setError("");
        setStep("generating");
        setProgressStep(1);
        setProgressMessage("Démarrage...");

        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("title", title.trim());
        formData.append("matiere", matiere);
        formData.append("niveau", niveau);

        try {
            const accessToken = (session as any)?.accessToken;
            const res = await fetch("/api/cours/generate", {
                method: "POST",
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
                credentials: "include",
                body: formData,
            });

            if (!res.ok) {
                const text = await res.text();
                let errMsg = "Erreur réseau. Veuillez réessayer.";
                try {
                    const json = JSON.parse(text);
                    if (json.error?.message) errMsg = json.error.message;
                    else if (json.message) errMsg = json.message;
                } catch {
                    if (res.status === 401) errMsg = "Session expirée. Veuillez vous reconnecter.";
                }
                setError(errMsg);
                setStep("form");
                return;
            }
            if (!res.body) {
                setError("Erreur de connexion. Veuillez réessayer.");
                setStep("form");
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parser les événements SSE
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                let eventType = "";
                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (eventType === "progress") {
                                setProgressStep(data.step);
                                setProgressMessage(data.message);
                            } else if (eventType === "done") {
                                setDraft(data.draft);
                                setPdfInfo(data.pdfInfo);
                                setStep("editing");
                            } else if (eventType === "error") {
                                setError(data.message || "Erreur lors de la génération.");
                                setStep("form");
                            }
                        } catch {
                            // Ignorer les données malformées
                        }
                    }
                }
            }
        } catch (err) {
            setError("Erreur réseau. Veuillez réessayer.");
            setStep("form");
        }
    };

    const handleConfirm = async () => {
        if (!draft || saving) return;

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/cours/generate/confirm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ ...draft, useWorkytV1 }),
            });

            const data = await res.json();

            if (data.success && data.courseId) {
                router.push(`/dashboard/cours`);
            } else {
                setError(data.message || "Erreur lors de la sauvegarde.");
            }
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setSaving(false);
        }
    };

    // --- Draft editing helpers ---

    const updateSection = (index: number, updates: Partial<SectionDraft>) => {
        if (!draft) return;
        const sections = [...draft.sections];
        sections[index] = { ...sections[index], ...updates };
        setDraft({ ...draft, sections });
    };

    const removeSection = (index: number) => {
        if (!draft) return;
        const sections = draft.sections.filter((_, i) => i !== index);
        sections.forEach((s, i) => (s.order = i + 1));
        setDraft({ ...draft, sections });
    };

    const addSection = () => {
        if (!draft) return;
        const newSection: SectionDraft = {
            title: "Nouvelle section",
            order: draft.sections.length + 1,
            lessons: [],
        };
        setDraft({ ...draft, sections: [...draft.sections, newSection] });
    };

    const moveSection = (index: number, direction: "up" | "down") => {
        if (!draft) return;
        const sections = [...draft.sections];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
        sections.forEach((s, i) => (s.order = i + 1));
        setDraft({ ...draft, sections });
    };

    const updateLesson = (sectionIndex: number, lessonIndex: number, updates: Partial<LessonDraft>) => {
        if (!draft) return;
        const sections = [...draft.sections];
        const lessons = [...sections[sectionIndex].lessons];
        lessons[lessonIndex] = { ...lessons[lessonIndex], ...updates };
        sections[sectionIndex] = { ...sections[sectionIndex], lessons };
        setDraft({ ...draft, sections });
    };

    const removeLesson = (sectionIndex: number, lessonIndex: number) => {
        if (!draft) return;
        const sections = [...draft.sections];
        const lessons = sections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
        lessons.forEach((l, i) => (l.order = i + 1));
        sections[sectionIndex] = { ...sections[sectionIndex], lessons };
        setDraft({ ...draft, sections });
    };

    const addLesson = (sectionIndex: number) => {
        if (!draft) return;
        const sections = [...draft.sections];
        const newLesson: LessonDraft = {
            title: "Nouvelle leçon",
            content: "",
            order: sections[sectionIndex].lessons.length + 1,
        };
        sections[sectionIndex] = {
            ...sections[sectionIndex],
            lessons: [...sections[sectionIndex].lessons, newLesson],
        };
        setDraft({ ...draft, sections });
    };

    const moveLesson = (sectionIndex: number, lessonIndex: number, direction: "up" | "down") => {
        if (!draft) return;
        const sections = [...draft.sections];
        const lessons = [...sections[sectionIndex].lessons];
        const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
        if (targetIndex < 0 || targetIndex >= lessons.length) return;
        [lessons[lessonIndex], lessons[targetIndex]] = [lessons[targetIndex], lessons[lessonIndex]];
        lessons.forEach((l, i) => (l.order = i + 1));
        sections[sectionIndex] = { ...sections[sectionIndex], lessons };
        setDraft({ ...draft, sections });
    };

    const toggleSectionCollapse = (index: number) => {
        updateSection(index, { collapsed: !draft?.sections[index].collapsed });
    };

    // --- Render ---

    const userRole = (session?.user as any)?.role;

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Connectez-vous</h2>
                    <p className="text-gray-500 mb-4">Connectez-vous pour générer un cours avec l&apos;IA.</p>
                    <Link href="/connexion">
                        <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-6">
                            Se connecter
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (userRole !== "Admin") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès restreint</h2>
                    <p className="text-gray-500 mb-4">Seuls les administrateurs peuvent générer des cours avec l&apos;IA.</p>
                    <Link href="/cours">
                        <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-6">
                            Retour aux cours
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Step: Generating (progression temps réel)
    if (step === "generating") {
        const steps = [
            { num: 1, label: "Authentification" },
            { num: 2, label: "Extraction du PDF" },
            { num: 3, label: "Envoi à l'IA" },
            { num: 4, label: "Analyse de la réponse" },
            { num: 5, label: "Finalisation" },
        ];

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <Sparkles className="w-16 h-16 text-purple-500 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Génération en cours</h2>
                    </div>

                    {/* Étapes */}
                    <div className="space-y-3 mb-6">
                        {steps.map((s) => {
                            const isActive = progressStep === s.num;
                            const isDone = progressStep > s.num;
                            return (
                                <div key={s.num} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                        isDone
                                            ? "bg-green-100 text-green-600"
                                            : isActive
                                                ? "bg-purple-100 text-purple-600"
                                                : "bg-gray-100 text-gray-400"
                                    }`}>
                                        {isDone ? (
                                            <Check className="w-4 h-4" />
                                        ) : isActive ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <span className="text-xs font-medium">{s.num}</span>
                                        )}
                                    </div>
                                    <span className={`text-sm transition-colors duration-300 ${
                                        isDone ? "text-green-700 font-medium" : isActive ? "text-purple-700 font-medium" : "text-gray-400"
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${(progressStep / 5) * 100}%` }}
                        />
                    </div>

                    {/* Message détaillé */}
                    <p className="text-sm text-gray-500 text-center min-h-[20px]">
                        {progressMessage}
                    </p>
                </div>
            </div>
        );
    }

    // Step: Editing draft
    if (step === "editing" && draft) {
        const totalLessons = draft.sections.reduce((sum, s) => sum + s.lessons.length, 0);

        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div
                    className="pt-14 pb-10 px-6 rounded-b-[2rem] shadow-lg mb-8"
                    style={{
                        backgroundImage: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%), url(/noise.webp)`,
                        backgroundSize: "cover, 2%",
                        backgroundBlendMode: "overlay",
                    }}
                >
                    <div className="max-w-5xl mx-auto">
                        <button onClick={() => setStep("form")} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                            <ArrowLeft size={18} />
                            <span>Retour au formulaire</span>
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">Brouillon du cours</h1>
                        <div className="flex flex-wrap gap-3 text-white/80 text-sm">
                            <span>{draft.sections.length} section{draft.sections.length > 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{totalLessons} leçon{totalLessons > 1 ? "s" : ""}</span>
                            {pdfInfo && (
                                <>
                                    <span>·</span>
                                    <span>{pdfInfo.pages} pages PDF</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 pb-12 space-y-6">
                    {/* Métadonnées du cours */}
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="draft-title">Titre du cours</Label>
                                <Input
                                    id="draft-title"
                                    value={draft.title}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="draft-desc">Description (optionnel)</Label>
                                <Textarea
                                    id="draft-desc"
                                    value={draft.description || ""}
                                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                                    placeholder="Description du cours..."
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Sections */}
                    {draft.sections.map((section, si) => (
                        <Card key={si} className="border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            {/* Section header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-400 uppercase flex-shrink-0">
                                    Section {section.order}
                                </span>
                                <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(si, { title: e.target.value })}
                                    className="flex-1 border-0 bg-transparent font-semibold text-gray-800 p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => moveSection(si, "up")}
                                        disabled={si === 0}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveSection(si, "down")}
                                        disabled={si === draft.sections.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => toggleSectionCollapse(si)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {section.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => removeSection(si)}
                                        className="p-1 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Section content (lessons) */}
                            {!section.collapsed && (
                                <CardContent className="p-4 space-y-3">
                                    {section.lessons.length === 0 && (
                                        <p className="text-sm text-gray-400 text-center py-4">Aucune leçon dans cette section.</p>
                                    )}
                                    {section.lessons.map((lesson, li) => {
                                        const lessonKey = `${si}-${li}`;
                                        const isPreview = previewLesson === lessonKey;
                                        return (
                                            <div key={li} className="border border-gray-100 rounded-xl p-3 bg-white">
                                                {/* Lesson header */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <Input
                                                        value={lesson.title}
                                                        onChange={(e) => updateLesson(si, li, { title: e.target.value })}
                                                        className="flex-1 border-0 bg-transparent font-medium text-sm text-gray-700 p-0 h-auto focus-visible:ring-0"
                                                    />
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => moveLesson(si, li, "up")}
                                                            disabled={li === 0}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveLesson(si, li, "down")}
                                                            disabled={li === section.lessons.length - 1}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewLesson(isPreview ? null : lessonKey)}
                                                            className={`p-1 rounded text-xs ${isPreview ? "text-purple-600 bg-purple-50" : "text-gray-400 hover:text-gray-600"}`}
                                                        >
                                                            {isPreview ? "Éditer" : "Aperçu"}
                                                        </button>
                                                        <button
                                                            onClick={() => removeLesson(si, li)}
                                                            className="p-1 text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Lesson content */}
                                                {isPreview ? (
                                                    <div
                                                        className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-3 [&_div[data-custom-block]]:my-3 [&_div[data-custom-block]]:p-3 [&_div[data-custom-block]]:rounded-lg [&_div[data-custom-block]]:border [&_div[blocktype=definition]]:bg-orange-50 [&_div[blocktype=definition]]:border-orange-200 [&_div[blocktype=propriete]]:bg-cyan-50 [&_div[blocktype=propriete]]:border-cyan-200 [&_div[blocktype=theoreme]]:bg-green-50 [&_div[blocktype=theoreme]]:border-green-200 [&_div[blocktype=exemple]]:bg-blue-50 [&_div[blocktype=exemple]]:border-blue-200 [&_div[blocktype=remarque]]:bg-amber-50 [&_div[blocktype=remarque]]:border-amber-200 [&_div[blocktype=attention]]:bg-red-50 [&_div[blocktype=attention]]:border-red-200"
                                                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                                                    />
                                                ) : (
                                                    <Textarea
                                                        value={lesson.content}
                                                        onChange={(e) => updateLesson(si, li, { content: e.target.value })}
                                                        rows={6}
                                                        className="text-sm font-mono"
                                                        placeholder="Contenu Markdown de la leçon..."
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}

                                    <button
                                        onClick={() => addLesson(si)}
                                        className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter une leçon
                                    </button>
                                </CardContent>
                            )}
                        </Card>
                    ))}

                    {/* Add section button */}
                    <button
                        onClick={addSection}
                        className="w-full py-3 border border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter une section
                    </button>

                    {/* Publish button */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setStep("form")}
                            className="rounded-xl"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={saving || draft.sections.length === 0}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl px-6 gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {saving ? "Publication..." : "Publier le cours"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Step: Form (default)
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div
                className="pt-14 pb-10 px-6 rounded-b-[2rem] shadow-lg mb-8"
                style={{
                    backgroundImage: `linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%), url(/noise.webp)`,
                    backgroundSize: "cover, 2%",
                    backgroundBlendMode: "overlay",
                }}
            >
                <div className="max-w-2xl mx-auto">
                    <Link href="/cours" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={18} />
                        <span>Retour aux cours</span>
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-8 h-8 text-white" />
                        <h1 className="text-3xl font-bold text-white">Générer un cours avec l&apos;IA</h1>
                    </div>
                    <p className="text-white/80">
                        Uploadez un PDF et laissez l&apos;IA structurer votre cours en sections et leçons.
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 pb-12">
                <Card className="border border-gray-200 rounded-2xl shadow-sm">
                    <CardContent className="p-6 space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Titre */}
                        <div>
                            <Label htmlFor="title">Titre du cours</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="ex: Les fonctions affines"
                            />
                        </div>

                        {/* Matière */}
                        <div>
                            <Label htmlFor="matiere">Matière</Label>
                            <select
                                id="matiere"
                                value={matiere}
                                onChange={(e) => setMatiere(e.target.value)}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">Sélectionner une matière</option>
                                {educationData.subjects.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Niveau */}
                        <div>
                            <Label htmlFor="niveau">Niveau</Label>
                            <select
                                id="niveau"
                                value={niveau}
                                onChange={(e) => setNiveau(e.target.value)}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">Sélectionner un niveau</option>
                                {educationData.levels.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>

                        {/* PDF Upload */}
                        <div>
                            <Label>Fichier PDF</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-1 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                                    pdfFile
                                        ? "border-purple-300 bg-purple-50"
                                        : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/50"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {pdfFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText className="w-8 h-8 text-purple-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-800">{pdfFile.name}</p>
                                            <p className="text-xs text-gray-500">{(pdfFile.size / (1024 * 1024)).toFixed(1)} Mo</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                                        <p className="text-sm text-gray-600 font-medium">
                                            Cliquez ou glissez un PDF ici
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PDF uniquement, 20 Mo max</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Workyt V1 author */}
                        <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useWorkytV1}
                                onChange={(e) => setUseWorkytV1(e.target.checked)}
                                className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                            />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Attribuer à Workyt V1</p>
                                <p className="text-xs text-amber-600">Cochez si ce cours provient de l&apos;ancienne version de Workyt.</p>
                            </div>
                        </label>

                        {/* Submit */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!title.trim() || !matiere || !niveau || !pdfFile}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl py-3 gap-2 text-base"
                        >
                            <Sparkles className="w-5 h-5" />
                            Générer avec MaitreRenardAI
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
