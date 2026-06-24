"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent } from "@/components/ui/Card";
import {
    Upload, Sparkles, ChevronDown, ChevronUp, GripVertical,
    Trash2, Plus, FileText, Loader2, BookOpen, ArrowLeft, Check,
    Trophy, ChevronRight, ListChecks, AlertCircle
} from "lucide-react";
import { educationData } from "@/data/educationData";
import MascotLoader from "@/components/ui/MascotLoader";
import Link from "next/link";
import "katex/dist/katex.min.css";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface QuestionDraft {
    question: string;
    questionType: string;
    answerSelectionType: "single" | "multiple";
    answers: string[];
    correctAnswer: any;
    explanation?: string;
    point: number;
}

interface QuizDraft {
    sectionIndex: number;
    title: string;
    description?: string;
    questions: QuestionDraft[];
    collapsed?: boolean;
}

interface CourseDraft {
    title: string;
    matiere: string;
    niveau: string;
    description?: string;
    sections: SectionDraft[];
    quizzes: QuizDraft[];
}

type Step = "form" | "generating" | "editing";

// ─── Types de questions disponibles ───────────────────────────────────────────

const ALL_QUIZ_TYPES = [
    { value: "QCM", label: "QCM", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "Vrai/Faux", label: "Vrai / Faux", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "Réponse courte", label: "Réponse courte", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { value: "Texte à trous", label: "Texte à trous", color: "bg-teal-50 text-teal-700 border-teal-200" },
    { value: "Classement", label: "Classement", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "Glisser-déposer", label: "Glisser-déposer", color: "bg-pink-50 text-pink-700 border-pink-200" },
    { value: "Slider", label: "Slider", color: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "Code", label: "Code", color: "bg-gray-100 text-gray-700 border-gray-300" },
];

const TYPE_BADGE_COLORS: Record<string, string> = {
    "QCM": "bg-blue-50 text-blue-700",
    "Vrai/Faux": "bg-emerald-50 text-emerald-700",
    "Réponse courte": "bg-purple-50 text-purple-700",
    "Texte à trous": "bg-teal-50 text-teal-700",
    "Classement": "bg-amber-50 text-amber-700",
    "Glisser-déposer": "bg-pink-50 text-pink-700",
    "Slider": "bg-orange-50 text-orange-700",
    "Code": "bg-gray-100 text-gray-700",
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function GenerateCoursePage() {
    const { data: session, status } = useSession();
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

    // Options quiz
    const [generateQuizzes, setGenerateQuizzes] = useState(true);
    const [allowedTypes, setAllowedTypes] = useState<string[]>([
        "QCM", "Vrai/Faux", "Réponse courte", "Texte à trous", "Classement", "Glisser-déposer"
    ]);

    const toggleType = (type: string) => {
        setAllowedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    // ─── Fichier PDF ───────────────────────────────────────────────────────────

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

    // ─── Génération ───────────────────────────────────────────────────────────

    const handleGenerate = async () => {
        if (!title.trim() || !matiere || !niveau || !pdfFile) {
            setError("Veuillez remplir tous les champs et uploader un PDF.");
            return;
        }
        if (generateQuizzes && allowedTypes.length === 0) {
            setError("Sélectionnez au moins un type de question pour les quiz.");
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
        formData.append("generateQuizzes", String(generateQuizzes));
        if (generateQuizzes) {
            formData.append("allowedTypes", allowedTypes.join(","));
        }

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

                let boundary = buffer.indexOf("\n\n");
                while (boundary !== -1) {
                    const rawEvent = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);

                    let currentEventType = "";
                    let currentData = "";

                    for (const line of rawEvent.split("\n")) {
                        if (line.startsWith("event: ")) currentEventType = line.slice(7).trim();
                        else if (line.startsWith("data: ")) currentData = line.slice(6);
                    }

                    if (currentData) {
                        try {
                            const data = JSON.parse(currentData);
                            if (currentEventType === "progress") {
                                setProgressStep(data.step);
                                setProgressMessage(data.message);
                            } else if (currentEventType === "done") {
                                setDraft({
                                    ...data.draft,
                                    quizzes: (data.draft.quizzes || []).map((q: QuizDraft) => ({ ...q, collapsed: true })),
                                });
                                setPdfInfo(data.pdfInfo);
                                setStep("editing");
                            } else if (currentEventType === "error") {
                                setError(data.message || "Erreur lors de la génération.");
                                setStep("form");
                            }
                        } catch {
                            // données SSE malformées ignorées
                        }
                    }

                    boundary = buffer.indexOf("\n\n");
                }
            }
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
            setStep("form");
        }
    };

    // ─── Confirmation ──────────────────────────────────────────────────────────

    const handleConfirm = async () => {
        if (!draft || saving) return;

        setSaving(true);
        setError("");

        // Retirer les champs UI avant d'envoyer
        const payload = {
            ...draft,
            sections: draft.sections.map(({ collapsed: _c, ...s }) => s),
            quizzes: draft.quizzes.map(({ collapsed: _c, ...q }) => q),
            useWorkytV1,
        };

        try {
            const res = await fetch("/api/cours/generate/confirm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${(session as any)?.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success && data.courseId) {
                router.push("/dashboard/cours");
            } else {
                setError(data.message || "Erreur lors de la sauvegarde.");
            }
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setSaving(false);
        }
    };

    // ─── Helpers sections / leçons ─────────────────────────────────────────────

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
        // Mettre à jour les sectionIndex des quiz
        const quizzes = draft.quizzes
            .filter(q => q.sectionIndex !== index)
            .map(q => ({ ...q, sectionIndex: q.sectionIndex > index ? q.sectionIndex - 1 : q.sectionIndex }));
        setDraft({ ...draft, sections, quizzes });
    };

    const addSection = () => {
        if (!draft) return;
        setDraft({
            ...draft,
            sections: [...draft.sections, { title: "Nouvelle section", order: draft.sections.length + 1, lessons: [] }],
        });
    };

    const moveSection = (index: number, direction: "up" | "down") => {
        if (!draft) return;
        const sections = [...draft.sections];
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= sections.length) return;
        [sections[index], sections[target]] = [sections[target], sections[index]];
        sections.forEach((s, i) => (s.order = i + 1));
        // Mettre à jour les sectionIndex des quiz
        const quizzes = draft.quizzes.map(q => {
            if (q.sectionIndex === index) return { ...q, sectionIndex: target };
            if (q.sectionIndex === target) return { ...q, sectionIndex: index };
            return q;
        });
        setDraft({ ...draft, sections, quizzes });
    };

    const updateLesson = (si: number, li: number, updates: Partial<LessonDraft>) => {
        if (!draft) return;
        const sections = [...draft.sections];
        const lessons = [...sections[si].lessons];
        lessons[li] = { ...lessons[li], ...updates };
        sections[si] = { ...sections[si], lessons };
        setDraft({ ...draft, sections });
    };

    const removeLesson = (si: number, li: number) => {
        if (!draft) return;
        const sections = [...draft.sections];
        const lessons = sections[si].lessons.filter((_, i) => i !== li);
        lessons.forEach((l, i) => (l.order = i + 1));
        sections[si] = { ...sections[si], lessons };
        setDraft({ ...draft, sections });
    };

    const addLesson = (si: number) => {
        if (!draft) return;
        const sections = [...draft.sections];
        sections[si] = {
            ...sections[si],
            lessons: [...sections[si].lessons, { title: "Nouvelle leçon", content: "", order: sections[si].lessons.length + 1 }],
        };
        setDraft({ ...draft, sections });
    };

    const moveLesson = (si: number, li: number, direction: "up" | "down") => {
        if (!draft) return;
        const sections = [...draft.sections];
        const lessons = [...sections[si].lessons];
        const target = direction === "up" ? li - 1 : li + 1;
        if (target < 0 || target >= lessons.length) return;
        [lessons[li], lessons[target]] = [lessons[target], lessons[li]];
        lessons.forEach((l, i) => (l.order = i + 1));
        sections[si] = { ...sections[si], lessons };
        setDraft({ ...draft, sections });
    };

    // ─── Helpers quiz ──────────────────────────────────────────────────────────

    const removeQuiz = (qi: number) => {
        if (!draft) return;
        setDraft({ ...draft, quizzes: draft.quizzes.filter((_, i) => i !== qi) });
    };

    const removeQuestion = (qi: number, questionIdx: number) => {
        if (!draft) return;
        const quizzes = [...draft.quizzes];
        quizzes[qi] = {
            ...quizzes[qi],
            questions: quizzes[qi].questions.filter((_, i) => i !== questionIdx),
        };
        setDraft({ ...draft, quizzes });
    };

    const toggleQuizCollapse = (qi: number) => {
        if (!draft) return;
        const quizzes = [...draft.quizzes];
        quizzes[qi] = { ...quizzes[qi], collapsed: !quizzes[qi].collapsed };
        setDraft({ ...draft, quizzes });
    };

    // ─── Guards ────────────────────────────────────────────────────────────────

    const userRole = (session?.user as any)?.role;

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

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

    if (userRole !== "Admin" && userRole !== "Rédacteur" && userRole !== "Correcteur") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès restreint</h2>
                    <p className="text-gray-500 mb-4">Seuls les administrateurs et rédacteurs peuvent générer des cours avec l&apos;IA.</p>
                    <Link href="/cours">
                        <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-6">
                            Retour aux cours
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Étape : Génération en cours ───────────────────────────────────────────

    if (step === "generating") {
        const steps = [
            { num: 1, label: "Authentification" },
            { num: 2, label: "Extraction du PDF" },
            { num: 3, label: "Envoi à l'IA" },
            { num: 4, label: "Analyse de la réponse" },
            { num: 5, label: "Structuration du cours" },
            ...(generateQuizzes ? [{ num: 6, label: "Génération des quiz" }] : []),
        ];
        const totalSteps = steps.length;

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-sm">
                    <div className="text-center mb-8">
                        <MascotLoader message="MaitreRenardAI prépare votre cours…" size="lg" />
                        <h2 className="text-xl font-semibold text-gray-800">Génération en cours</h2>
                        <p className="text-sm text-gray-400 mt-1">Cela peut prendre quelques instants…</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {steps.map((s) => {
                            const isActive = progressStep === s.num;
                            const isDone = progressStep > s.num;
                            return (
                                <div key={s.num} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                        isDone ? "bg-green-100 text-green-600"
                                        : isActive ? "bg-purple-100 text-purple-600"
                                        : "bg-gray-100 text-gray-400"
                                    }`}>
                                        {isDone ? <Check className="w-4 h-4" />
                                        : isActive ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <span className="text-xs font-medium">{s.num}</span>}
                                    </div>
                                    <span className={`text-sm transition-colors duration-300 ${
                                        isDone ? "text-green-700 font-medium"
                                        : isActive ? "text-purple-700 font-medium"
                                        : "text-gray-400"
                                    }`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${(progressStep / totalSteps) * 100}%` }}
                        />
                    </div>

                    <p className="text-sm text-gray-500 text-center min-h-[20px]">
                        {progressMessage}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Étape : Édition du brouillon ─────────────────────────────────────────

    if (step === "editing" && draft) {
        const totalLessons = draft.sections.reduce((sum, s) => sum + s.lessons.length, 0);
        const totalQuestions = draft.quizzes.reduce((sum, q) => sum + q.questions.length, 0);

        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div
                    className="pt-14 pb-10 px-6 rounded-b-[2rem] shadow-lg mb-8"
                    style={{
                        backgroundImage: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)",
                    }}
                >
                    <div className="max-w-5xl mx-auto">
                        <button onClick={() => setStep("form")} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                            <ArrowLeft size={18} />
                            Retour au formulaire
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">Brouillon du cours</h1>
                        <div className="flex flex-wrap gap-3 text-white/80 text-sm">
                            <span>{draft.sections.length} section{draft.sections.length > 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{totalLessons} leçon{totalLessons > 1 ? "s" : ""}</span>
                            {draft.quizzes.length > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <Trophy className="w-3.5 h-3.5" />
                                        {draft.quizzes.length} quiz · {totalQuestions} questions
                                    </span>
                                </>
                            )}
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
                    {/* Métadonnées */}
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
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Sections + quiz associés */}
                    {draft.sections.map((section, si) => {
                        const sectionQuizzes = draft.quizzes
                            .map((q, qi) => ({ ...q, qi }))
                            .filter(q => q.sectionIndex === si);

                        return (
                            <Card key={si} className="border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                {/* En-tête section */}
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
                                        <button onClick={() => moveSection(si, "up")} disabled={si === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveSection(si, "down")} disabled={si === draft.sections.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => updateSection(si, { collapsed: !section.collapsed })} className="p-1 text-gray-400 hover:text-gray-600">
                                            {section.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => removeSection(si)} className="p-1 text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Leçons */}
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
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <Input
                                                            value={lesson.title}
                                                            onChange={(e) => updateLesson(si, li, { title: e.target.value })}
                                                            className="flex-1 border-0 bg-transparent font-medium text-sm text-gray-700 p-0 h-auto focus-visible:ring-0"
                                                        />
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button onClick={() => moveLesson(si, li, "up")} disabled={li === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => moveLesson(si, li, "down")} disabled={li === section.lessons.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setPreviewLesson(isPreview ? null : lessonKey)}
                                                                className={`p-1 rounded text-xs ${isPreview ? "text-purple-600 bg-purple-50" : "text-gray-400 hover:text-gray-600"}`}
                                                            >
                                                                {isPreview ? "Éditer" : "Aperçu"}
                                                            </button>
                                                            <button onClick={() => removeLesson(si, li)} className="p-1 text-gray-400 hover:text-red-500">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

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
                                                            placeholder="Contenu HTML de la leçon..."
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

                                        {/* Quiz de cette section */}
                                        {sectionQuizzes.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mt-4 mb-2">
                                                    <Trophy className="w-3.5 h-3.5" />
                                                    Quiz générés
                                                </p>
                                                {sectionQuizzes.map(({ qi, ...quiz }) => (
                                                    <div key={qi} className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/30">
                                                        {/* En-tête quiz */}
                                                        <div className="flex items-center gap-2 px-3 py-2.5">
                                                            <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                                                                {quiz.title}
                                                            </span>
                                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                                {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""}
                                                            </span>
                                                            <button
                                                                onClick={() => toggleQuizCollapse(qi)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                            >
                                                                {quiz.collapsed
                                                                    ? <ChevronRight className="w-4 h-4" />
                                                                    : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => removeQuiz(qi)}
                                                                className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        {/* Questions du quiz */}
                                                        {!quiz.collapsed && (
                                                            <div className="border-t border-amber-200 divide-y divide-amber-100">
                                                                {quiz.questions.map((q, qIdx) => (
                                                                    <div key={qIdx} className="flex items-start gap-2 px-3 py-2 bg-white">
                                                                        <span className="text-xs text-gray-400 w-5 flex-shrink-0 mt-0.5 text-right">{qIdx + 1}.</span>
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${TYPE_BADGE_COLORS[q.questionType] || "bg-gray-100 text-gray-600"}`}>
                                                                            {q.questionType}
                                                                        </span>
                                                                        <span className="flex-1 text-xs text-gray-700 line-clamp-2">{q.question}</span>
                                                                        <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{q.point}pt</span>
                                                                        <button
                                                                            onClick={() => removeQuestion(qi, qIdx)}
                                                                            className="p-0.5 text-gray-300 hover:text-red-400 flex-shrink-0"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}

                    {/* Ajouter une section */}
                    <button
                        onClick={addSection}
                        className="w-full py-3 border border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter une section
                    </button>

                    {/* Quiz sans section associée (sectionIndex invalide) */}
                    {draft.quizzes.filter(q => q.sectionIndex >= draft.sections.length).length > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Certains quiz sont liés à des sections supprimées et seront ignorés lors de la publication.</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep("form")} className="rounded-xl">
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={saving || draft.sections.length === 0}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl px-6 gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {saving ? "Publication..." : "Publier le cours"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Étape : Formulaire ────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div
                className="pt-14 pb-10 px-6 rounded-b-[2rem] shadow-lg mb-8"
                style={{ backgroundImage: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)" }}
            >
                <div className="max-w-2xl mx-auto">
                    <Link href="/cours" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={18} />
                        Retour aux cours
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-8 h-8 text-white" />
                        <h1 className="text-3xl font-bold text-white">Générer un cours avec l&apos;IA</h1>
                    </div>
                    <p className="text-white/80">
                        Uploadez un PDF et laissez l&apos;IA structurer votre cours en sections, leçons et quiz.
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 pb-12 space-y-4">
                <Card className="border border-gray-200 rounded-2xl shadow-sm">
                    <CardContent className="p-6 space-y-5">
                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
                                    pdfFile ? "border-purple-300 bg-purple-50" : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/50"
                                }`}
                            >
                                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
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
                                        <p className="text-sm text-gray-600 font-medium">Cliquez ou glissez un PDF ici</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF uniquement, 20 Mo max</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Option : Générer des quiz */}
                        <div className={`rounded-xl border-2 overflow-hidden transition-colors ${generateQuizzes ? "border-amber-200 bg-amber-50/40" : "border-gray-200"}`}>
                            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={generateQuizzes}
                                    onChange={(e) => setGenerateQuizzes(e.target.checked)}
                                    className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                                />
                                <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">Générer des quiz par section</p>
                                    <p className="text-xs text-gray-500">L&apos;IA créera un quiz de 5 à 8 questions pour chaque section du cours.</p>
                                </div>
                            </label>

                            {generateQuizzes && (
                                <div className="px-4 pb-4 pt-1 border-t border-amber-200">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <ListChecks className="w-3.5 h-3.5 text-gray-400" />
                                        <p className="text-xs font-medium text-gray-500">Types de questions autorisés</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {ALL_QUIZ_TYPES.map((type) => {
                                            const isOn = allowedTypes.includes(type.value);
                                            return (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => toggleType(type.value)}
                                                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                                                        isOn ? type.color + " border-current shadow-sm" : "border-gray-200 text-gray-400 bg-white hover:border-gray-300"
                                                    }`}
                                                >
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {allowedTypes.length === 0 && (
                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Sélectionnez au moins un type.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Workyt V1 */}
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

                        {/* Bouton générer */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!title.trim() || !matiere || !niveau || !pdfFile || (generateQuizzes && allowedTypes.length === 0)}
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
