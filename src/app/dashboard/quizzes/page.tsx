"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2, Trophy, ChevronRight } from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import QuizForm from "./../_components/QuizForm";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import AdvancedPagination from "@/components/ui/AdvancedPagination";

interface Quiz {
    _id: string;
    title: string;
    description: string;
    sectionId?: {
        _id: string;
        title?: string;
        courseId?: {
            _id: string;
            title?: string;
        };
    };
    questions: Array<{
        question: string;
        questionType: string;
        point: number;
    }>;
    createdAt: string;
}

interface SearchFilters {
    query: string;
    sectionId: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
}

export default function QuizzesPage() {
    const { data: session } = useSession();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [sections, setSections] = useState<Array<{ _id: string; title: string; courseId?: { _id: string; title?: string } }>>([]);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalQuizzes, setTotalQuizzes] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        sectionId: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
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
            sectionId: filters.sectionId === "all" ? "" : filters.sectionId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
        });
        return `/api/quizzes?${params.toString()}`;
    }, [page, itemsPerPage, filters]);

    // Charger les quiz
    useEffect(() => {
        async function fetchQuizzes() {
            if (!session?.accessToken) return;

            setLoading(true);
            try {
                const res = await fetch(buildApiUrl(), {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setQuizzes(data.quizzes || data);
                    setTotalQuizzes(data.total || data.length);
                    setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
                } else {
                    console.error("Erreur lors du chargement des quiz");
                }
            } catch (error) {
                console.error("Erreur lors du chargement des quiz:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchQuizzes();
    }, [session?.accessToken, buildApiUrl]);

    // Charger les sections
    useEffect(() => {
        async function fetchSections() {
            if (!session?.accessToken) return;

            try {
                const res = await fetch('/api/sections?limit=1000', {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setSections(data.sections || data);
                } else {
                    console.error("Erreur lors du chargement des sections");
                }
            } catch (error) {
                console.error("Erreur lors du chargement des sections:", error);
            }
        }

        fetchSections();
    }, [session?.accessToken]);

    // Supprimer un quiz
    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) return;

        try {
            const res = await fetch(`/api/quizzes/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (res.ok) {
                setQuizzes(prev => prev.filter(quiz => quiz._id !== id));
                showToast({ title: "Quiz supprimé avec succès" });
            } else {
                const error = await res.json();
                showToast({ title: error.error || "Erreur lors de la suppression", variant: "destructive" });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            showToast({ title: "Erreur lors de la suppression", variant: "destructive" });
        }
    };

    // Sauvegarder un quiz (création ou modification)
    const handleSaveQuiz = async (quizData: any) => {
        try {
            const method = selectedQuiz ? 'PUT' : 'POST';
            const url = selectedQuiz ? `/api/quizzes/${selectedQuiz._id}` : '/api/quizzes';
            
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(quizData),
            });

            if (res.ok) {
                const savedQuiz = await res.json();
                
                if (selectedQuiz) {
                    // Modification
                    setQuizzes(prev => prev.map(q => q._id === selectedQuiz._id ? savedQuiz : q));
                    showToast({ title: "Quiz modifié avec succès" });
                } else {
                    // Création
                    setQuizzes(prev => [savedQuiz, ...prev]);
                    showToast({ title: "Quiz créé avec succès" });
                }
                
                setDialogOpen(false);
                setSelectedQuiz(null);
            } else {
                const error = await res.json();
                showToast({ title: error.error || "Erreur lors de la sauvegarde", variant: "destructive" });
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
                        <h1 className="text-3xl font-bold">Gestion des Quiz</h1>
                        <p className="text-gray-600">Gérez les quiz et leurs questions</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setSelectedQuiz(null)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter un quiz
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>
                                        {selectedQuiz ? "Modifier le quiz" : "Ajouter un nouveau quiz"}
                                    </DialogTitle>
                                </DialogHeader>
                                <QuizForm
                                    onSave={handleSaveQuiz}
                                    onCancel={() => {
                                        setDialogOpen(false);
                                        setSelectedQuiz(null);
                                    }}
                                    initialData={selectedQuiz}
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
                                placeholder="Rechercher un quiz..."
                                value={filters.query}
                                onChange={(e) => handleFiltersChange({ ...filters, query: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section
                            </label>
                            <Select
                                value={filters.sectionId}
                                onValueChange={(value) => handleFiltersChange({ ...filters, sectionId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Toutes les sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les sections</SelectItem>
                                    {sections.map((section) => (
                                        <SelectItem key={section._id} value={section._id}>
                                            {section.title} - {section.courseId?.title || 'Cours inconnu'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trier par
                            </label>
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value) => handleFiltersChange({ ...filters, sortBy: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="title">Titre</SelectItem>
                                    <SelectItem value="createdAt">Date de création</SelectItem>
                                    <SelectItem value="questions">Nombre de questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Tableau des quiz */}
                <div className="bg-white rounded-lg shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Quiz</TableHead>
                                <TableHead>Section</TableHead>
                                <TableHead>Questions</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            Chargement...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : quizzes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Aucun quiz trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                quizzes.map((quiz) => (
                                    <TableRow key={quiz._id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">
                                                    {quiz.title}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {quiz.description}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">
                                                    {quiz.sectionId?.title || 'Section inconnue'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {quiz.sectionId?.courseId?.title || 'Cours inconnu'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {quiz.questions.reduce((sum, q) => sum + q.point, 0)} points
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedQuiz(quiz);
                                                                setDialogOpen(true);
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Modifier le quiz</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(quiz._id)}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Supprimer le quiz</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <AdvancedPagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        totalItems={totalQuizzes}
                    />
                )}
            </div>
            <ToastViewport>
                <Toast open={toastOpen} onOpenChange={setToastOpen}>
                    <ToastTitle className={toastVariant === "destructive" ? "text-red-600" : ""}>
                        {toastMessage}
                    </ToastTitle>
                    <ToastClose />
                </Toast>
            </ToastViewport>
        </ToastProvider>
    );
} 