"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { evalFileUrl } from "@/lib/evalFile";
import EvaluationPdfBuilder from "../_components/EvaluationPdfBuilder";
import {
    FileCheck,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    X,
    Target,
    Upload,
    FileText,
    Copy,
    Clock,
    ChevronDown,
    ChevronUp,
    Search,
} from "lucide-react";
import "../../../dashboard/styles/dashboard-theme.css";

interface Question {
    questionText: string;
    questionType: "text" | "multiple_choice" | "number" | "file_link";
    options?: string[];
    correctAnswer?: string;
    points: number;
    order: number;
}

interface Evaluation {
    _id: string;
    courseId: { _id: string; title: string };
    title: string;
    description: string;
    type: "form" | "pdf";
    duration: number;
    depositMinutes?: number;
    pdfUrl?: string;
    pdfExercises?: { enonce: string; points: number; difficulty: string }[];
    questions?: Question[];
    rewardPoints: number;
    linkedCompetencies: string[];
    isActive: boolean;
    createdBy: { _id: string; username: string };
    createdAt: string;
}

interface Course {
    _id: string;
    title: string;
}

/* ── Course search input with debounce ── */
function CourseSearchInput({
    token,
    value,
    label,
    disabled,
    onChange,
}: {
    token: string;
    value: { _id: string; title: string } | null;
    label: string;
    disabled?: boolean;
    onChange: (course: { _id: string; title: string } | null) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Course[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) { setResults([]); return; }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/courses?search=${encodeURIComponent(query)}&limit=8`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const d = await res.json();
                    setResults(d.courses || []);
                }
            } catch { /* ignore */ }
            setLoading(false);
        }, 300);
        return () => clearTimeout(timerRef.current);
    }, [query, token]);

    const select = (c: Course) => {
        onChange({ _id: c._id, title: c.title });
        setQuery("");
        setOpen(false);
    };

    const clear = () => {
        onChange(null);
        setQuery("");
    };

    if (value) {
        return (
            <div>
                <label className="dash-label mb-1 block text-xs">{label}</label>
                <div className="dash-input w-full flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{value.title}</span>
                    {!disabled && (
                        <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600 shrink-0">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <label className="dash-label mb-1 block text-xs">{label}</label>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => { if (results.length) setOpen(true); }}
                    className="dash-input w-full pl-8"
                    placeholder="Rechercher un cours..."
                    disabled={disabled}
                />
                {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
            </div>
            {open && results.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.map((c) => (
                        <button
                            key={c._id}
                            type="button"
                            onClick={() => select(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors truncate"
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
            )}
            {open && query.length >= 2 && !loading && results.length === 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-400 text-center">Aucun cours trouvé</p>
                </div>
            )}
        </div>
    );
}

const EMPTY_QUESTION: Question = {
    questionText: "",
    questionType: "text",
    options: [],
    correctAnswer: "",
    points: 1,
    order: 0,
};

export default function ManageEvaluationsPage() {
    const { data: session } = useSession();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Filtres
    const [filterCourse, setFilterCourse] = useState<{ _id: string; title: string } | null>(null);
    const [filterActive, setFilterActive] = useState("true");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Formulaire creation (inline, pas de modal)
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Evaluation | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Form state
    const [formCourse, setFormCourse] = useState<{ _id: string; title: string } | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formType, setFormType] = useState<"form" | "pdf">("pdf");
    const [formDuration, setFormDuration] = useState(60);
    const [formDeposit, setFormDeposit] = useState(10);
    const [formPdfUrl, setFormPdfUrl] = useState("");
    const [formPdfExercises, setFormPdfExercises] = useState<{ enonce: string; points: number; difficulty: string }[]>([]);
    const [formRewardPoints, setFormRewardPoints] = useState(100);
    const [formCompetencyIds, setFormCompetencyIds] = useState<string[]>([]);
    const [courseCompetencies, setCourseCompetencies] = useState<{ skillId: string; description: string }[]>([]);
    const [manualComp, setManualComp] = useState("");
    const [formQuestions, setFormQuestions] = useState<Question[]>([{ ...EMPTY_QUESTION }]);
    const [showComposer, setShowComposer] = useState(false);

    // Charger les évaluations
    const fetchEvaluations = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        const params = new URLSearchParams();
        if (filterCourse) params.set("courseId", filterCourse._id);
        if (filterActive) params.set("isActive", filterActive);
        params.set("page", String(page));
        params.set("limit", "20");

        try {
            const res = await fetch(`/api/evaluations?${params}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setEvaluations(data.evaluations || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch {
            setError("Erreur de chargement.");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, filterCourse, filterActive, page]);

    useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

    // Compétences disponibles pour le cours sélectionné (issues des quiz du cours).
    useEffect(() => {
        if (!formCourse?._id || !session?.accessToken) { setCourseCompetencies([]); return; }
        let cancelled = false;
        fetch(`/api/competencies/by-course?courseId=${formCourse._id}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                setCourseCompetencies((d.competencies || []).map((c: any) => ({ skillId: c.skillId, description: c.description || "" })));
            })
            .catch(() => { if (!cancelled) setCourseCompetencies([]); });
        return () => { cancelled = true; };
    }, [formCourse?._id, session?.accessToken]);

    const toggleCompetencyId = (id: string) =>
        setFormCompetencyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const addManualCompetencies = () => {
        const ids = manualComp.split(",").map((s) => s.trim()).filter(Boolean);
        if (ids.length) setFormCompetencyIds((prev) => Array.from(new Set([...prev, ...ids])));
        setManualComp("");
    };

    // Reset form
    const resetForm = () => {
        setEditing(null);
        setFormCourse(filterCourse || null);
        setFormTitle("");
        setFormDescription("");
        setFormType("pdf");
        setFormDuration(60);
        setFormDeposit(10);
        setFormPdfUrl("");
        setFormPdfExercises([]);
        setFormRewardPoints(100);
        setFormCompetencyIds([]);
        setManualComp("");
        setFormQuestions([{ ...EMPTY_QUESTION }]);
        setShowAdvanced(false);
        setError(null);
    };

    const openCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const openEdit = (ev: Evaluation) => {
        setEditing(ev);
        setFormCourse({ _id: ev.courseId._id, title: ev.courseId.title });
        setFormTitle(ev.title);
        setFormDescription(ev.description);
        setFormType(ev.type);
        setFormDuration(ev.duration);
        setFormDeposit(ev.depositMinutes ?? 10);
        setFormPdfUrl(ev.pdfUrl || "");
        setFormPdfExercises(ev.pdfExercises || []);
        setFormRewardPoints(ev.rewardPoints ?? 100);
        setFormCompetencyIds(ev.linkedCompetencies || []);
        setFormQuestions(ev.questions?.length
            ? ev.questions.map((q, i) => ({ ...q, order: q.order ?? i }))
            : [{ ...EMPTY_QUESTION }]);
        setShowAdvanced(true);
        setShowForm(true);
        setError(null);
    };

    const handleDuplicate = (ev: Evaluation) => {
        setEditing(null);
        setFormCourse({ _id: ev.courseId._id, title: ev.courseId.title });
        setFormTitle(`${ev.title} (copie)`);
        setFormDescription(ev.description);
        setFormType(ev.type);
        setFormDuration(ev.duration);
        setFormDeposit(ev.depositMinutes ?? 10);
        setFormPdfUrl(ev.pdfUrl || "");
        setFormPdfExercises(ev.pdfExercises || []);
        setFormRewardPoints(ev.rewardPoints ?? 100);
        setFormCompetencyIds(ev.linkedCompetencies || []);
        setFormQuestions(ev.questions?.length
            ? ev.questions.map((q, i) => ({ ...q, order: q.order ?? i }))
            : [{ ...EMPTY_QUESTION }]);
        setShowAdvanced(false);
        setShowForm(true);
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Upload PDF du sujet (dépôt manuel ou PDF généré via l'éditeur)
    const handlePdfUpload = async (file: File) => {
        if (!session?.accessToken || uploadingPdf) return;
        if (file.type !== "application/pdf") {
            setError("Seuls les fichiers PDF sont acceptés.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("Fichier trop lourd (max 10 Mo).");
            return;
        }

        setUploadingPdf(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("files", file);
            const res = await fetch("/api/evaluations/upload?context=subject", {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erreur upload."); return; }

            setFormPdfUrl(data.urls[0]);

            // Auto-remplir le titre depuis le nom du fichier si vide
            if (!formTitle) {
                const name = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
                setFormTitle(name.charAt(0).toUpperCase() + name.slice(1));
            }
        } catch {
            setError("Erreur réseau.");
        } finally {
            setUploadingPdf(false);
        }
    };

    // PDF généré depuis l'éditeur riche (texte, images, LaTeX, dessins) → upload R2
    // On garde aussi les énoncés pour permettre la réponse en ligne (mode hybride).
    const handleComposerConfirm = async (pdf: File, exercises: { enonce: string; points: number; difficulty: string }[]) => {
        setShowComposer(false);
        setFormPdfExercises(exercises);
        await handlePdfUpload(pdf);
    };

    // Drag & drop global
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type === "application/pdf") {
            if (!showForm) { openCreate(); setFormType("pdf"); }
            handlePdfUpload(file);
        }
    };

    // Save
    const handleSave = async () => {
        if (!session?.accessToken) return;
        setSaving(true);
        setError(null);
        setSuccess(null);

        const body: any = {
            courseId: formCourse?._id,
            title: formTitle,
            description: formDescription,
            type: formType,
            duration: formDuration,
            depositMinutes: formDeposit,
            rewardPoints: formRewardPoints,
            linkedCompetencies: formCompetencyIds.filter(Boolean),
        };

        if (formType === "pdf") {
            body.pdfUrl = formPdfUrl;
            body.pdfExercises = formPdfExercises;
        } else {
            body.questions = formQuestions.map((q, i) => ({
                ...q,
                order: i,
                options: q.questionType === "multiple_choice" ? q.options : [],
            }));
        }

        try {
            const url = editing ? `/api/evaluations/${editing._id}` : "/api/evaluations";
            const res = await fetch(url, {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erreur."); setSaving(false); return; }

            setSuccess(editing ? "Évaluation mise à jour." : "Évaluation créée !");
            setShowForm(false);
            resetForm();
            fetchEvaluations();
        } catch {
            setError("Erreur réseau.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!session?.accessToken || !confirm("Désactiver cette évaluation ?")) return;
        try {
            const res = await fetch(`/api/evaluations/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) fetchEvaluations();
        } catch {}
    };

    // Question helpers
    const updateQuestion = (idx: number, field: string, value: any) => {
        const next = [...formQuestions];
        (next[idx] as any)[field] = value;
        setFormQuestions(next);
    };
    const addQuestion = () => setFormQuestions([...formQuestions, { ...EMPTY_QUESTION, order: formQuestions.length }]);
    const removeQuestion = (idx: number) => { if (formQuestions.length > 1) setFormQuestions(formQuestions.filter((_, i) => i !== idx)); };
    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const next = [...formQuestions];
        const opts = [...(next[qIdx].options || [])];
        opts[oIdx] = value;
        next[qIdx] = { ...next[qIdx], options: opts };
        setFormQuestions(next);
    };
    const addOption = (qIdx: number) => {
        const next = [...formQuestions];
        next[qIdx] = { ...next[qIdx], options: [...(next[qIdx].options || []), ""] };
        setFormQuestions(next);
    };
    const removeOption = (qIdx: number, oIdx: number) => {
        const next = [...formQuestions];
        next[qIdx] = { ...next[qIdx], options: (next[qIdx].options || []).filter((_, i) => i !== oIdx) };
        setFormQuestions(next);
    };

    return (
        <div
            className="p-6 max-w-5xl mx-auto"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#37352f] flex items-center gap-2">
                        <FileCheck className="w-7 h-7 text-[#f97316]" />
                        Banque d&apos;exercices d&apos;évaluation
                    </h1>
                    <p className="text-sm text-[#6b6b6b] mt-1">
                        Créez des exercices que les élèves tireront au sort pour s&apos;entraîner — puis que vous corrigerez.
                    </p>
                </div>
                {!showForm && (
                    <button onClick={openCreate} className="dash-button dash-button-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Créer un exercice
                    </button>
                )}
            </div>

            {/* Encart explicatif : à quoi ça sert + parcours élève */}
            {!showForm && (
                <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                    <p className="text-sm font-semibold text-[#37352f] mb-2">Comment ça fonctionne&nbsp;?</p>
                    <ol className="grid gap-2 text-xs text-[#6b6b6b] sm:grid-cols-5">
                        <li className="flex items-start gap-1.5"><span className="font-bold text-[#f97316]">1.</span> Vous <strong>créez un exercice</strong> rattaché à un cours (PDF généré/déposé, ou formulaire).</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-[#f97316]">2.</span> L&apos;élève <strong>tire au sort</strong> un exercice du cours.</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-[#f97316]">3.</span> Il compose dans le <strong>temps imparti</strong> puis rend sa copie.</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-[#f97316]">4.</span> Vous <strong>corrigez</strong> et notez (points + compétences).</li>
                        <li className="flex items-start gap-1.5"><span className="font-bold text-[#f97316]">5.</span> L&apos;élève reçoit sa <strong>note</strong> et sa correction.</li>
                    </ol>
                </div>
            )}

            {/* Drop overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-50 bg-orange-500/10 border-4 border-dashed border-orange-400 flex items-center justify-center pointer-events-none">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <Upload className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-gray-800">Déposez le PDF du sujet</p>
                        <p className="text-sm text-gray-500">Il sera uploadé automatiquement</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <p className="text-sm text-emerald-700">{success}</p>
                    <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Formulaire inline */}
            {showForm && (
                <div className="dash-card mb-6">
                    <div className="dash-card-header flex items-center justify-between">
                        <span className="font-semibold text-[#37352f]">
                            {editing ? "Modifier l'exercice" : "Créer un exercice d'évaluation"}
                        </span>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[#6b6b6b] hover:text-[#37352f]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="dash-card-body space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Ligne 1 : Cours + Type + Durée + Points */}
                        <div className="grid grid-cols-8 gap-3">
                            <div className="col-span-3">
                                <CourseSearchInput
                                    token={session?.accessToken || ""}
                                    value={formCourse}
                                    label="Cours"
                                    disabled={!!editing}
                                    onChange={setFormCourse}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="dash-label mb-1 block text-xs">Format</label>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as "form" | "pdf")}
                                    className="dash-input w-full"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="form">Formulaire</option>
                                </select>
                                <p className="mt-1 text-[10px] text-[#9b9b9b]">PDF = sujet · Formulaire = QCM</p>
                            </div>
                            <div className="col-span-3">
                                <label className="dash-label mb-1 block text-xs">Durée</label>
                                <div className="flex items-center gap-2">
                                    {[30, 45, 60, 90, 120].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setFormDuration(d)}
                                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                                formDuration === d
                                                    ? "bg-[#f97316] text-white border-[#f97316]"
                                                    : "bg-white text-[#6b6b6b] border-[#e3e2e0] hover:border-[#f97316]"
                                            }`}
                                        >
                                            {d}m
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-1 text-[10px] text-[#9b9b9b]">Temps de composition (rédaction)</p>
                            </div>
                            <div className="col-span-3">
                                <label className="dash-label mb-1 block text-xs">Temps de dépôt</label>
                                <div className="flex items-center gap-2">
                                    {[0, 5, 10, 15, 20].map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setFormDeposit(d)}
                                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                                formDeposit === d
                                                    ? "bg-[#f97316] text-white border-[#f97316]"
                                                    : "bg-white text-[#6b6b6b] border-[#e3e2e0] hover:border-[#f97316]"
                                            }`}
                                        >
                                            {d === 0 ? "0" : `${d}m`}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-1 text-[10px] text-[#9b9b9b]">Temps EN PLUS pour scanner + déposer (total : {formDuration + formDeposit} min)</p>
                            </div>
                            <div className="col-span-1">
                                <label className="dash-label mb-1 block text-xs" title="Points de récompense Workyt, distribués au prorata de la note sur 20. Ce n'est PAS la note.">
                                    Récompense
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={500}
                                    value={formRewardPoints}
                                    onChange={(e) => setFormRewardPoints(Math.min(500, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="dash-input w-full"
                                />
                                <p className="mt-1 text-[10px] text-[#9b9b9b]">
                                    Points Workyt <strong>max</strong> — au prorata de la note /20 (ex. 15/20 → {Math.round(formRewardPoints * 0.75)}). Ce n&apos;est pas la note.
                                </p>
                            </div>
                        </div>

                        {/* PDF : Zone d'upload */}
                        {formType === "pdf" && (
                            <div>
                                {formPdfUrl ? (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-emerald-700">PDF du sujet uploadé</p>
                                            <a href={evalFileUrl(formPdfUrl)} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-emerald-600 hover:underline">
                                                Voir le fichier
                                            </a>
                                        </div>
                                        <button type="button" onClick={() => setFormPdfUrl("")} className="text-red-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Générer le sujet avec l'éditeur riche (texte, images, LaTeX, dessins) */}
                                        <button
                                            type="button"
                                            onClick={() => setShowComposer(true)}
                                            disabled={uploadingPdf}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#f97316] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#f97316] transition-colors hover:bg-[#ffedd5] disabled:opacity-50"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Composer les exercices → PDF (cards, lignes de réponse, LaTeX, dessins)
                                        </button>

                                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-gray-400">
                                            <span className="h-px flex-1 bg-gray-200" /> ou déposer un PDF existant <span className="h-px flex-1 bg-gray-200" />
                                        </div>

                                        <div
                                            onClick={() => pdfInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 hover:border-[#f97316] rounded-xl p-8 text-center cursor-pointer transition-colors"
                                        >
                                            <input
                                                ref={pdfInputRef}
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handlePdfUpload(file);
                                                    e.target.value = "";
                                                }}
                                                className="hidden"
                                            />
                                            {uploadingPdf ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
                                                    <p className="text-sm text-[#6b6b6b]">Upload en cours...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="w-10 h-10 text-gray-300" />
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium text-[#f97316]">Cliquez</span> ou glissez le sujet PDF ici
                                                    </p>
                                                    <p className="text-xs text-gray-400">Le titre sera rempli automatiquement</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Titre (auto-rempli pour PDF) */}
                        <div>
                            <label className="dash-label mb-1 block text-xs">Titre</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="dash-input w-full"
                                placeholder={formType === "pdf" ? "Auto-rempli depuis le nom du PDF" : "Ex: Contrôle algèbre T1"}
                            />
                        </div>

                        {/* Section avancée (collapsed par défaut) */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#37352f] transition-colors"
                        >
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Options avancées
                        </button>

                        {showAdvanced && (
                            <div className="space-y-4 pl-2 border-l-2 border-[#e3e2e0]">
                                <div>
                                    <label className="dash-label mb-1 block text-xs">Description</label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        className="dash-input w-full resize-y"
                                        rows={2}
                                        placeholder="Optionnel"
                                    />
                                </div>
                                <div>
                                    <label className="dash-label mb-1 block text-xs">
                                        Compétences évaluées {formCompetencyIds.length > 0 && <span className="text-[#f97316]">({formCompetencyIds.length})</span>}
                                    </label>
                                    <p className="text-[11px] text-gray-400 mb-2">
                                        Coche les compétences du programme testées par cette éval (issues des quiz du cours).
                                    </p>

                                    {/* Liste des compétences du cours */}
                                    {courseCompetencies.length > 0 ? (
                                        <div className="max-h-44 overflow-y-auto rounded-lg border border-[#e3e2e0] divide-y divide-gray-100">
                                            {courseCompetencies.map((c) => {
                                                const checked = formCompetencyIds.includes(c.skillId);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={c.skillId}
                                                        onClick={() => toggleCompetencyId(c.skillId)}
                                                        className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${checked ? "bg-orange-50" : "hover:bg-gray-50"}`}
                                                    >
                                                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-[#f97316] bg-[#f97316] text-white" : "border-gray-300"}`}>
                                                            {checked && <span className="text-[10px] leading-none">✓</span>}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block text-xs text-[#37352f]">{c.description || c.skillId}</span>
                                                            <span className="block font-mono text-[10px] text-gray-400">{c.skillId}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-400">
                                            {formCourse ? "Aucune compétence trouvée pour ce cours (ajoute-en via les quiz, ou saisis des codes ci-dessous)." : "Choisis d'abord un cours."}
                                        </p>
                                    )}

                                    {/* Compétences sélectionnées hors liste (ex. saisies manuellement) */}
                                    {formCompetencyIds.filter((id) => !courseCompetencies.some((c) => c.skillId === id)).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {formCompetencyIds
                                                .filter((id) => !courseCompetencies.some((c) => c.skillId === id))
                                                .map((id) => (
                                                    <span key={id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-600">
                                                        {id}
                                                        <button type="button" onClick={() => toggleCompetencyId(id)} className="text-gray-400 hover:text-red-500">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                        </div>
                                    )}

                                    {/* Ajout manuel de codes (avancé) */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={manualComp}
                                            onChange={(e) => setManualComp(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualCompetencies(); } }}
                                            className="dash-input flex-1 text-xs"
                                            placeholder="Ajouter des codes : C4-MATH-NC-CL-01, …"
                                        />
                                        <button type="button" onClick={addManualCompetencies} className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-600 hover:border-[#f97316]">
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="dash-label mb-1 block text-xs">Durée personnalisée (min)</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={180}
                                        value={formDuration}
                                        onChange={(e) => setFormDuration(parseInt(e.target.value) || 60)}
                                        className="dash-input w-24"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Questions (type form uniquement) */}
                        {formType === "form" && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="dash-label">Questions</label>
                                    <button onClick={addQuestion} className="dash-button dash-button-ghost dash-button-sm flex items-center gap-1 text-xs">
                                        <Plus className="w-3 h-3" /> Ajouter
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formQuestions.map((q, idx) => (
                                        <div key={idx} className="border border-[#e3e2e0] rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-[#6b6b6b]">Q{idx + 1}</span>
                                                {formQuestions.length > 1 && (
                                                    <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-500">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={q.questionText}
                                                onChange={(e) => updateQuestion(idx, "questionText", e.target.value)}
                                                className="dash-input w-full mb-2"
                                                placeholder="Texte de la question..."
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                <select
                                                    value={q.questionType}
                                                    onChange={(e) => updateQuestion(idx, "questionType", e.target.value)}
                                                    className="dash-input text-xs"
                                                >
                                                    <option value="text">Texte</option>
                                                    <option value="multiple_choice">QCM</option>
                                                    <option value="number">Nombre</option>
                                                    <option value="file_link">Lien fichier</option>
                                                </select>
                                                <input
                                                    type="number" min={0} value={q.points}
                                                    onChange={(e) => updateQuestion(idx, "points", parseInt(e.target.value) || 0)}
                                                    className="dash-input text-xs"
                                                    placeholder="Points"
                                                />
                                                <input
                                                    type="text" value={q.correctAnswer || ""}
                                                    onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                                                    className="dash-input text-xs"
                                                    placeholder="Réponse correcte"
                                                />
                                            </div>
                                            {q.questionType === "multiple_choice" && (
                                                <div className="mt-2 space-y-1">
                                                    {(q.options || []).map((opt, oi) => (
                                                        <div key={oi} className="flex items-center gap-1.5">
                                                            <input
                                                                type="text" value={opt}
                                                                onChange={(e) => updateOption(idx, oi, e.target.value)}
                                                                className="dash-input flex-1 text-xs"
                                                                placeholder={`Option ${oi + 1}`}
                                                            />
                                                            <button onClick={() => removeOption(idx, oi)} className="text-red-400 hover:text-red-500">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addOption(idx)} className="text-xs text-[#f97316] hover:text-[#ea580c] font-medium">
                                                        + Option
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="dash-button dash-button-secondary">
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formCourse || !formTitle || (formType === "pdf" && !formPdfUrl)}
                                className="dash-button dash-button-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                                ) : (
                                    editing ? "Mettre à jour" : "Publier"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 items-end mb-4">
                <div className="w-64">
                    <CourseSearchInput
                        token={session?.accessToken || ""}
                        value={filterCourse}
                        label="Filtrer par cours"
                        onChange={(c) => { setFilterCourse(c); setPage(1); }}
                    />
                </div>
                <select
                    value={filterActive}
                    onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
                    className="dash-input text-sm"
                >
                    <option value="true">Actives</option>
                    <option value="false">Désactivées</option>
                    <option value="">Toutes</option>
                </select>
            </div>

            {/* Liste */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
                </div>
            ) : evaluations.length === 0 ? (
                <div className="dash-empty">
                    <FileCheck className="dash-empty-icon" />
                    <h3 className="dash-empty-title">Aucune évaluation</h3>
                    <p className="text-sm text-[#6b6b6b]">Glissez un PDF ici pour commencer.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {evaluations.map((ev) => (
                        <div
                            key={ev._id}
                            className="dash-card hover:shadow-sm transition-shadow"
                        >
                            <div className="dash-card-body flex items-center gap-4 py-3">
                                {/* Icône type */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    ev.type === "pdf" ? "bg-purple-50" : "bg-blue-50"
                                }`}>
                                    {ev.type === "pdf" ? (
                                        <FileText className="w-5 h-5 text-purple-500" />
                                    ) : (
                                        <FileCheck className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#37352f] truncate">{ev.title}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-[#6b6b6b]">{ev.courseId?.title}</span>
                                        <span className="text-xs text-[#6b6b6b] flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {ev.duration}m
                                        </span>
                                        <span className="text-xs text-[#6b6b6b] flex items-center gap-1">
                                            <Target className="w-3 h-3" /> {ev.rewardPoints} pts
                                        </span>
                                        {ev.linkedCompetencies?.length > 0 && (
                                            <span className="text-xs text-[#6b6b6b] flex items-center gap-1">
                                                <Target className="w-3 h-3" /> {ev.linkedCompetencies.length}
                                            </span>
                                        )}
                                        {!ev.isActive && (
                                            <span className="text-xs text-red-400">Désactivée</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleDuplicate(ev)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Dupliquer"
                                    >
                                        <Copy className="w-4 h-4 text-[#6b6b6b]" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(ev)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <Pencil className="w-4 h-4 text-[#6b6b6b]" />
                                    </button>
                                    {session?.user?.role === "Admin" && (
                                        <button
                                            onClick={() => handleDelete(ev._id)}
                                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Désactiver"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-4">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="dash-button dash-button-secondary dash-button-sm disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="text-sm text-[#6b6b6b]">{page}/{totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="dash-button dash-button-secondary dash-button-sm disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Builder d'exercices → PDF (une card par exo, lignes de réponse, LaTeX/images/dessins) */}
            <EvaluationPdfBuilder
                open={showComposer}
                onClose={() => setShowComposer(false)}
                onConfirm={handleComposerConfirm}
                defaultTitle={formTitle}
                subject={formCourse?.title}
                authorName={session?.user?.username}
            />
        </div>
    );
}
