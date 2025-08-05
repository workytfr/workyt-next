"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2, BookOpen, FileText, Trophy, ChevronRight, Eye } from "lucide-react";
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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
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
    };
    lessons?: Array<{ _id: string; title: string }>;
    exercises?: Array<{ _id: string; title: string }>;
    quizzes?: Array<{ _id: string; title: string }>;
}

interface SearchFilters {
    query: string;
    courseId: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
}

// Gestion des sections
export default function SectionsPage() {
    const { data: session } = useSession();
    const [sections, setSections] = useState<Section[]>([]);
    const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
    const [isSectionQuizzesOpen, setIsSectionQuizzesOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [selectedSectionForQuiz, setSelectedSectionForQuiz] = useState<Section | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalSections, setTotalSections] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        courseId: "all",
        sortBy: "order",
        sortOrder: "asc",
    });

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

    const buildApiUrl = useCallback(() => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString(),
            search: filters.query,
            courseId: filters.courseId === "all" ? "" : filters.courseId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
        });
        return `/api/sections?${params.toString()}`;
    }, [page, itemsPerPage, filters]);

    // Charger les sections
    useEffect(() => {
        async function fetchSections() {
            if (!session?.accessToken) return;

            setLoading(true);
            try {
                const res = await fetch(buildApiUrl(), {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!res.ok) {
                    throw new Error(await res.text());
                }

                const data = await res.json();
                setSections(data.sections || []);
                setTotalSections(data.total || 0);
                setTotalPages(data.totalPages || 0);
            } catch (error) {
                console.error("Erreur lors du chargement des sections :", error);
                showToast({ title: "Erreur de chargement", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        fetchSections();
    }, [buildApiUrl, session?.accessToken]);

    // Charger les cours pour les filtres
    useEffect(() => {
        async function fetchCourses() {
            try {
                const res = await fetch('/api/courses?limit=1000');
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

    // Supprimer une section
    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette section ?")) return;

        try {
            const res = await fetch(`/api/sections/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (res.ok) {
                setSections((prev) => prev.filter((section) => section._id !== id));
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
                const newQuiz = await res.json();
                showToast({ title: "Quiz créé avec succès" });
                setIsQuizDialogOpen(false);
                setSelectedSectionForQuiz(null);
                
                // Recharger les sections pour voir le nouveau quiz
                // Vous pourriez aussi mettre à jour l'état local si nécessaire
            } else {
                const error = await res.json();
                showToast({ title: error.error || "Erreur lors de la création", variant: "destructive" });
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du quiz:', error);
            showToast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
        }
    };

    // Gestion des filtres
    const handleFiltersChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        setPage(1);
    };

    // Gestion de la pagination
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setPage(1);
    };

    return (
        <ToastProvider>
            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Gestion des Sections</h1>
                        <p className="text-gray-600">Gérez les sections et leurs contenus</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setSelectedSection(null)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter une section
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-full">
                                <DialogHeader>
                                    <DialogTitle>
                                        {selectedSection ? "Modifier la section" : "Ajouter une nouvelle section"}
                                    </DialogTitle>
                                </DialogHeader>
                                <SectionForm
                                    section={selectedSection ? {
                                        _id: selectedSection._id,
                                        title: selectedSection.title,
                                        order: selectedSection.order,
                                        courseId: typeof selectedSection.courseId === 'string' 
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
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rechercher
                            </label>
                            <input
                                type="text"
                                placeholder="Rechercher une section..."
                                value={filters.query}
                                onChange={(e) => handleFiltersChange({ ...filters, query: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cours
                            </label>
                            <Select
                                value={filters.courseId}
                                onValueChange={(value) => handleFiltersChange({ ...filters, courseId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les cours" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les cours</SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem key={course._id} value={course._id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tri
                            </label>
                            <Select
                                value={`${filters.sortBy}-${filters.sortOrder}`}
                                onValueChange={(value) => {
                                    const [sortBy, sortOrder] = value.split('-');
                                    handleFiltersChange({ ...filters, sortBy, sortOrder: sortOrder as "asc" | "desc" });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="order-asc">Ordre croissant</SelectItem>
                                    <SelectItem value="order-desc">Ordre décroissant</SelectItem>
                                    <SelectItem value="title-asc">Titre A-Z</SelectItem>
                                    <SelectItem value="title-desc">Titre Z-A</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Table des sections */}
                <div className="bg-white rounded-lg shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Section</TableHead>
                                <TableHead>Cours</TableHead>
                                <TableHead>Contenu</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                        <p className="mt-2 text-gray-500">Chargement des sections...</p>
                                    </TableCell>
                                </TableRow>
                            ) : sections.length > 0 ? (
                                sections.map((section) => (
                                    <TableRow key={section._id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">{section.title}</div>
                                                <div className="text-sm text-gray-500">
                                                    Ordre: {section.order}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                                                            <div className="font-medium text-gray-900">
                                                {typeof section.courseId === 'string' 
                                                    ? courses.find(c => c._id === section.courseId)?.title || 'Cours inconnu'
                                                    : section.courseId?.title || 'Cours inconnu'
                                                }
                                            </div>
                                                                                            <div className="text-sm text-gray-500">
                                                {typeof section.courseId === 'string' 
                                                    ? 'Cours ID: ' + section.courseId
                                                    : `${section.courseId?.niveau || 'N/A'} • ${section.courseId?.matiere || 'N/A'}`
                                                }
                                            </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm">
                                                        {section.lessons?.length || 0} leçon{section.lessons?.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm">
                                                        {section.exercises?.length || 0} exercice{section.exercises?.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                                    <span className="text-sm">
                                                        {section.quizzes?.length || 0} quiz{section.quizzes?.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSection(section);
                                                        setDialogOpen(true);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSectionForQuiz(section);
                                                        setIsQuizDialogOpen(true);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <Trophy className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSectionForQuiz(section);
                                                        setIsSectionQuizzesOpen(true);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(section._id)}
                                                    disabled={loading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <div className="text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>Aucune section trouvée</p>
                                            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination avancée */}
                {totalPages > 1 && (
                    <AdvancedPagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalSections}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        isLoading={loading}
                    />
                )}

                {/* Dialog pour créer un quiz */}
                <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                    <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Créer un quiz pour la section {selectedSectionForQuiz?.title ? `"${selectedSectionForQuiz.title}"` : ''}
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
                    <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Gestion des quiz - Section {selectedSectionForQuiz?.title ? `"${selectedSectionForQuiz.title}"` : ''}
                            </DialogTitle>
                        </DialogHeader>
                        {selectedSectionForQuiz && (
                            <SectionQuizzes
                                sectionId={selectedSectionForQuiz._id}
                                sectionTitle={selectedSectionForQuiz.title}
                                onQuizUpdated={() => {
                                    // Recharger les sections pour mettre à jour le compteur de quiz
                                    // Vous pourriez implémenter une fonction de rechargement ici
                                }}
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