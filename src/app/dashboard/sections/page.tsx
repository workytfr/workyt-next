"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Pencil,
    Trash2,
    Plus,
    Loader2,
    BookOpen,
    FileText,
    Trophy,
    Dumbbell,
    ChevronRight,
    Eye,
    Search,
    Layers,
    ExternalLink,
    ChevronsDownUp,
    ChevronsUpDown,
} from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import SectionForm from "./../_components/SectionForm";
import QuizForm from "./../_components/QuizForm";
import SectionQuizzes from "./../_components/SectionQuizzes";
import { useConfirm } from "../_components/useConfirm";
import AdvancedPagination from "@/components/ui/AdvancedPagination";

interface Section {
    _id: string;
    title: string;
    order: number;
    courseId: string | {
        _id: string;
        title: string;
        niveau: string;
        matiere: string;
    } | null;
    lessons?: Array<{ _id: string; title: string }>;
    exercises?: Array<{ _id: string; title: string }>;
    quizzes?: Array<{ _id: string; title: string }>;
}

interface CourseGroup {
    id: string;
    title: string;
    niveau?: string;
    matiere?: string;
    sections: Section[];
}

// Assez pour charger toutes les sections d'un coup : le regroupement par cours
// se fait ici, une pagination par section couperait un cours en deux.
const FETCH_LIMIT = 2000;
const NO_COURSE = "__sans_cours__";

// « theoreme » doit trouver « Théorème »
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

// Gestion des sections, rangées par cours
export default function SectionsPage() {
    const { data: session } = useSession();
    const { confirm, confirmDialog } = useConfirm();
    const [sections, setSections] = useState<Section[]>([]);
    const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
    const [isSectionQuizzesOpen, setIsSectionQuizzesOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [selectedSectionForQuiz, setSelectedSectionForQuiz] = useState<Section | null>(null);
    const [loading, setLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [mySections, setMySections] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);
    // Pagination PAR COURS : un cours n'est jamais coupé entre deux pages
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Activer "Mes cours" par défaut pour les non-Admins
    useEffect(() => {
        if (session?.user?.role && session.user.role !== "Admin") {
            setMySections(true);
        }
    }, [session?.user?.role]);

    // Gestion du Toast
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");

    const showToast = ({ title, variant }: { title: string; variant?: "default" | "destructive" }) => {
        setToastMessage(title);
        setToastVariant(variant || "default");
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 3000);
    };

    // Charger toutes les sections (la recherche se fait ensuite dans la page)
    useEffect(() => {
        async function fetchSections() {
            if (!session?.accessToken) return;

            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: "1",
                    limit: String(FETCH_LIMIT),
                    sortBy: "order",
                    sortOrder: "asc",
                    authorId: mySections && session?.user?.id ? session.user.id : "",
                });
                const res = await fetch(`/api/sections?${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!res.ok) {
                    throw new Error(await res.text());
                }

                const data = await res.json();
                setSections(data.sections || []);
            } catch (error) {
                console.error("Erreur lors du chargement des sections :", error);
                showToast({ title: "Erreur de chargement", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        fetchSections();
    }, [mySections, session?.accessToken, session?.user?.id]);

    // Charger les cours pour le formulaire de section
    useEffect(() => {
        async function fetchCourses() {
            try {
                const res = await fetch('/api/courses?limit=200');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des cours :", error);
            }
        }

        fetchCourses();
    }, []);

    // Regroupement par cours, sections dans l'ordre du cours
    const groups = useMemo<CourseGroup[]>(() => {
        const byCourse = new Map<string, CourseGroup>();
        for (const s of sections) {
            const c = s.courseId;
            const id = !c ? NO_COURSE : typeof c === "string" ? c : c._id;
            if (!byCourse.has(id)) {
                byCourse.set(id, {
                    id,
                    title: !c
                        ? "Sans cours"
                        : typeof c === "string"
                        ? courses.find((co) => co._id === c)?.title || "Cours inconnu"
                        : c.title || "Cours inconnu",
                    niveau: c && typeof c === "object" ? c.niveau : undefined,
                    matiere: c && typeof c === "object" ? c.matiere : undefined,
                    sections: [],
                });
            }
            byCourse.get(id)!.sections.push(s);
        }
        const list = [...byCourse.values()];
        list.forEach((g) => g.sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        // Cours par ordre alphabétique, « Sans cours » à la fin
        return list.sort((a, b) =>
            a.id === NO_COURSE ? 1 : b.id === NO_COURSE ? -1 : a.title.localeCompare(b.title, "fr")
        );
    }, [sections, courses]);

    // Recherche : sur le titre du cours ou d'une section
    const q = norm(query.trim());
    const visibleGroups = useMemo(() => {
        if (!q) return groups;
        return groups
            .map((g) =>
                norm(g.title).includes(q)
                    ? g
                    : { ...g, sections: g.sections.filter((s) => norm(s.title).includes(q)) }
            )
            .filter((g) => g.sections.length > 0);
    }, [groups, q]);

    const totalPages = Math.max(1, Math.ceil(visibleGroups.length / perPage));
    // Une recherche ou un filtre réduit la liste : on ne reste pas sur une page vide
    const currentPage = Math.min(page, totalPages);
    const pageGroups = visibleGroups.slice((currentPage - 1) * perPage, currentPage * perPage);

    // Pendant une recherche, tous les cours trouvés sont dépliés
    const isOpen = (id: string) => Boolean(q) || expanded.includes(id);
    const toggle = (id: string) =>
        setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    const allOpen = pageGroups.length > 0 && pageGroups.every((g) => expanded.includes(g.id));

    // Supprimer une section
    const handleDelete = async (section: Section) => {
        const ok = await confirm({
            title: `Supprimer « ${section.title} » ?`,
            description: "Ses leçons, quiz et exercices ne seront plus rattachés au cours.",
            confirmLabel: "Supprimer",
            danger: true,
        });
        if (!ok) return;

        try {
            const res = await fetch(`/api/sections/${section._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (res.ok) {
                setSections((prev) => prev.filter((s) => s._id !== section._id));
                showToast({ title: "Section supprimée avec succès." });
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
                showToast({ title: "Erreur lors de la suppression", variant: "destructive" });
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
            showToast({ title: "Erreur réseau", variant: "destructive" });
        }
    };

    // Sauvegarder un quiz
    const handleSaveQuiz = async (quizData: any) => {
        try {
            const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(quizData),
            });

            if (res.ok) {
                showToast({ title: "Quiz créé avec succès" });
                setIsQuizDialogOpen(false);
                setSelectedSectionForQuiz(null);
            } else {
                const error = await res.json();
                showToast({ title: error.error || "Erreur lors de la création", variant: "destructive" });
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du quiz:', error);
            showToast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
        }
    };

    const totalSections = visibleGroups.reduce((n, g) => n + g.sections.length, 0);

    return (
        <ToastProvider>
            {confirmDialog}
            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                    <div>
                        <h1 className="dash-main-title">Sections</h1>
                        <p className="dash-main-subtitle">
                            Une ligne par cours : déplie-la pour voir ses sections dans l&apos;ordre.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedSection(null);
                            setDialogOpen(true);
                        }}
                        className="dash-button dash-button-primary rounded-full"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter une section
                    </button>
                </div>

                {/* Recherche et filtres */}
                <div className="dash-card p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#97938e]" />
                        <input
                            type="search"
                            placeholder="Rechercher un cours ou une section…"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setPage(1);
                            }}
                            className="dash-input rounded-full pl-10"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[#1a1512] whitespace-nowrap cursor-pointer">
                        <input
                            type="checkbox"
                            checked={mySections}
                            onChange={(e) => {
                                setMySections(e.target.checked);
                                setPage(1);
                            }}
                            className="h-4 w-4 rounded accent-[#ff6a1a]"
                        />
                        Mes cours uniquement
                    </label>
                    <button
                        type="button"
                        onClick={() => setExpanded(allOpen ? [] : pageGroups.map((g) => g.id))}
                        disabled={Boolean(q) || visibleGroups.length === 0}
                        className="dash-button dash-button-secondary dash-button-sm rounded-full disabled:opacity-40"
                    >
                        {allOpen ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                        {allOpen ? "Tout replier" : "Tout déplier"}
                    </button>
                </div>

                {/* Compteur */}
                {!loading && visibleGroups.length > 0 && (
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97938e]">
                        {plural(visibleGroups.length, "cours", "cours")} · {plural(totalSections, "section", "sections")}
                    </p>
                )}

                {/* Tableau dépliable : une ligne par cours */}
                {loading ? (
                    <div className="dash-card py-12 text-center">
                        <Loader2 className="animate-spin w-6 h-6 mx-auto text-[#ff6a1a]" />
                        <p className="mt-2 text-sm text-[#6b625c]">Chargement des sections…</p>
                    </div>
                ) : visibleGroups.length === 0 ? (
                    <div className="dash-card py-12 text-center">
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe3] text-[#6b625c]">
                            <Layers className="h-6 w-6" />
                        </span>
                        <p className="font-medium text-[#1a1512]">Aucune section trouvée</p>
                        <p className="text-sm text-[#6b625c]">
                            {q ? "Essaie un autre mot." : mySections ? "Décoche « Mes cours uniquement » pour tout voir." : ""}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pageGroups.map((group) => {
                            const open = isOpen(group.id);
                            const lessons = group.sections.reduce((n, s) => n + (s.lessons?.length || 0), 0);
                            const quizzes = group.sections.reduce((n, s) => n + (s.quizzes?.length || 0), 0);
                            const exercises = group.sections.reduce((n, s) => n + (s.exercises?.length || 0), 0);

                            return (
                                <div key={group.id} className="dash-card">
                                    {/* Ligne du cours */}
                                    <div className={`flex items-center gap-3 px-4 py-3 transition-colors sm:px-5 ${open ? "bg-[#f5efe3]" : ""}`}>
                                        <button
                                            type="button"
                                            onClick={() => toggle(group.id)}
                                            aria-expanded={open}
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        >
                                            <ChevronRight
                                                className={`h-5 w-5 shrink-0 text-[#6b625c] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                                            />
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6a1a] text-white">
                                                <BookOpen className="h-5 w-5" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-serif-display text-lg leading-tight text-[#1a1512]">
                                                    {group.title}
                                                </span>
                                                <span className="mt-0.5 block truncate text-xs text-[#6b625c]">
                                                    {[group.matiere, group.niveau].filter(Boolean).join(" · ")}
                                                    {(group.matiere || group.niveau) && " — "}
                                                    {plural(group.sections.length, "section", "sections")} ·{" "}
                                                    {plural(lessons, "leçon", "leçons")} · {plural(quizzes, "quiz", "quiz")} ·{" "}
                                                    {plural(exercises, "exercice", "exercices")}
                                                </span>
                                            </span>
                                        </button>
                                        {group.id !== NO_COURSE && (
                                            <Link
                                                href={`/dashboard/cours/${group.id}/gestion`}
                                                className="dash-button dash-button-secondary dash-button-sm hidden rounded-full sm:inline-flex"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Gérer le cours
                                            </Link>
                                        )}
                                    </div>

                                    {/* Sections du cours, dans l'ordre */}
                                    {open && (
                                        <ol className="border-t border-[#e6e0d6] divide-y divide-[#e6e0d6]">
                                            {group.sections.map((section, i) => (
                                                <li
                                                    key={section._id}
                                                    // Lignes alternées blanc / papier, filet encre 8 %, survol orange clair
                                                    className={`group flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-[#fff4ec] sm:flex-row sm:items-center sm:gap-3 sm:px-6 ${
                                                        i % 2 === 0 ? "bg-white" : "bg-[#fdfaf4]"
                                                    }`}
                                                >
                                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1a1512] font-serif-display text-base text-[#fdfaf4]">
                                                            {i + 1}
                                                        </span>
                                                        <span className="min-w-0 flex-1 truncate font-medium text-[#1a1512]">
                                                            {section.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 pl-11 sm:pl-0">
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#eaf6fb] px-1.5 py-0.5 text-xs font-medium text-[#2f86b3]" title="Leçons">
                                                            <FileText className="h-3 w-3" />
                                                            {section.lessons?.length || 0}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-1.5 py-0.5 text-xs font-medium text-[#9a5d00]" title="Quiz">
                                                            <Trophy className="h-3 w-3" />
                                                            {section.quizzes?.length || 0}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#ecfdf5] px-1.5 py-0.5 text-xs font-medium text-[#3f8a1f]" title="Exercices">
                                                            <Dumbbell className="h-3 w-3" />
                                                            {section.exercises?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 pl-9 sm:pl-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSection(section);
                                                                setDialogOpen(true);
                                                            }}
                                                            className="rounded-full p-2 text-[#6b625c] hover:bg-[#f5efe3] hover:text-[#1a1512]"
                                                            title="Modifier la section"
                                                            aria-label="Modifier la section"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSectionForQuiz(section);
                                                                setIsQuizDialogOpen(true);
                                                            }}
                                                            className="rounded-full p-2 text-[#6b625c] hover:bg-[#f5efe3] hover:text-[#1a1512]"
                                                            title="Créer un quiz"
                                                            aria-label="Créer un quiz"
                                                        >
                                                            <Trophy className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSectionForQuiz(section);
                                                                setIsSectionQuizzesOpen(true);
                                                            }}
                                                            className="rounded-full p-2 text-[#6b625c] hover:bg-[#f5efe3] hover:text-[#1a1512]"
                                                            title="Voir les quiz"
                                                            aria-label="Voir les quiz"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(section)}
                                                            className="rounded-full p-2 text-[#c2272d] hover:bg-[#fdecec]"
                                                            title="Supprimer la section"
                                                            aria-label="Supprimer la section"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination (par cours) */}
                {!loading && visibleGroups.length > perPage && (
                    <AdvancedPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={visibleGroups.length}
                        itemsPerPage={perPage}
                        itemLabel="cours"
                        pageSizes={[5, 10, 20, 50]}
                        onPageChange={(p) => {
                            setPage(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        onItemsPerPageChange={(n) => {
                            setPerPage(n);
                            setPage(1);
                        }}
                    />
                )}

                {/* Dialog pour créer / modifier une section */}
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent overlayClassName="dash-dialog-overlay" className="dash-dialog max-w-4xl w-full">
                        <DialogHeader className="dash-dialog-header">
                            <DialogTitle>
                                {selectedSection ? "Modifier la section" : "Ajouter une nouvelle section"}
                            </DialogTitle>
                        </DialogHeader>
                        <SectionForm
                            section={selectedSection ? {
                                _id: selectedSection._id,
                                title: selectedSection.title,
                                order: selectedSection.order,
                                courseId: !selectedSection.courseId
                                    ? ""
                                    : typeof selectedSection.courseId === 'string'
                                    ? selectedSection.courseId
                                    : selectedSection.courseId._id
                            } : undefined}
                            courses={courses}
                            onSuccess={(newSection: any) => {
                                setSections((prev) =>
                                    selectedSection
                                        ? prev.map((s) => (s._id === newSection._id ? { ...s, ...newSection } : s))
                                        : [...prev, newSection]
                                );
                                setDialogOpen(false);
                                showToast({ title: selectedSection ? "Section mise à jour" : "Section créée" });
                            }}
                            onCancel={() => setDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* Dialog pour créer un quiz */}
                <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                    <DialogContent overlayClassName="dash-dialog-overlay" className="dash-dialog max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="dash-dialog-header">
                            <DialogTitle>
                                Créer un quiz pour la section {selectedSectionForQuiz?.title ? `« ${selectedSectionForQuiz.title} »` : ''}
                            </DialogTitle>
                        </DialogHeader>
                        {selectedSectionForQuiz && (
                            <QuizForm
                                sectionId={selectedSectionForQuiz._id}
                                onSave={handleSaveQuiz}
                                onCancel={() => {
                                    setIsQuizDialogOpen(false);
                                    setSelectedSectionForQuiz(null);
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog pour gérer les quiz d'une section */}
                <Dialog open={isSectionQuizzesOpen} onOpenChange={setIsSectionQuizzesOpen}>
                    <DialogContent overlayClassName="dash-dialog-overlay" className="dash-dialog max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="dash-dialog-header">
                            <DialogTitle>
                                Quiz de la section {selectedSectionForQuiz?.title ? `« ${selectedSectionForQuiz.title} »` : ''}
                            </DialogTitle>
                        </DialogHeader>
                        {selectedSectionForQuiz && (
                            <SectionQuizzes
                                sectionId={selectedSectionForQuiz._id}
                                sectionTitle={selectedSectionForQuiz.title}
                                onQuizUpdated={() => {}}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Affichage du Toast */}
            <ToastViewport>
                {toastOpen && (
                    <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant}>
                        <ToastTitle>{toastMessage}</ToastTitle>
                        <ToastClose />
                    </Toast>
                )}
            </ToastViewport>
        </ToastProvider>
    );
}
