"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2, Download, BookOpen, CheckCircle, Clock, FileText, Video, Users, Calendar, Edit } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import LessonForm from "./../_components/LessonForm";
import { ILesson } from "@/models/Lesson";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import AdvancedPagination from "@/components/ui/AdvancedPagination";
import LessonAdvancedSearch from "@/components/ui/LessonAdvancedSearch";
import LessonStats from "@/components/ui/LessonStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string; courseId: string }[];
}

interface SearchFilters {
    query: string;
    status: string;
    courseId: string;
    sectionId: string;
    authorId: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    hasMedia: boolean;
}

interface Stats {
    total: number;
    published: number;
    pending: number;
    draft: number;
    withMedia: number;
    byCourse: Record<string, number>;
    byStatus: Record<string, number>;
    recentLessons: number;
    avgMediaPerLesson: number;
}

export default function LessonsPage() {
    const { data: session, update } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [lessons, setLessons] = useState<ILesson[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<ILesson | undefined>(undefined);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalLessons, setTotalLessons] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        status: "all",
        courseId: "all",
        sectionId: "all",
        authorId: "all",
        sortBy: "order",
        sortOrder: "asc",
        hasMedia: false
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
            status: filters.status === "all" ? "" : filters.status,
            courseId: filters.courseId === "all" ? "" : filters.courseId,
            sectionId: filters.sectionId === "all" ? "" : filters.sectionId,
            authorId: filters.authorId === "all" ? "" : filters.authorId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            hasMedia: filters.hasMedia.toString(),
        });
        return `/api/lessons?${params.toString()}`;
    }, [page, itemsPerPage, filters]);

    // Chargement des cours
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch("/api/courses?page=1&limit=100", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                if (res.status === 401) {
                    console.error("JWT expiré, rafraîchissement de la session...");
                    await update();
                    return;
                }
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
    }, [session?.accessToken, update]);

    // Chargement des leçons avec pagination et filtres
    useEffect(() => {
        async function fetchLessons() {
            if (!session?.accessToken) return;
            setLoadingLessons(true);
            try {
                const res = await fetch(buildApiUrl(), {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                if (res.status === 401) {
                    console.error("JWT expiré, rafraîchissement de la session...");
                    await update();
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setLessons(data.lessons || []);
                    setTotalLessons(data.total || 0);
                    setTotalPages(data.totalPages || 0);
                    setStats(data.stats || null);
                } else {
                    console.error("Erreur lors du chargement des leçons :", await res.text());
                }
            } catch (error) {
                console.error("Erreur lors du chargement des leçons :", error);
            } finally {
                setLoadingLessons(false);
            }
        }
        fetchLessons();
    }, [buildApiUrl, session?.accessToken, update]);

    // Suppression d'une leçon
    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette leçon ?")) return;
        try {
            const res = await fetch(`/api/lessons/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });
            if (res.status === 401) {
                console.error("JWT expiré, rafraîchissement de la session...");
                await update();
                return;
            }
            if (res.ok) {
                setLessons((prev) => prev.filter((lesson) => lesson._id !== id));
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
        }
    };

    // Mettre à jour le statut d'une leçon
    const handleStatusChange = async (lessonId: string, newStatus: string) => {
        if (!session?.accessToken) return;

        try {
            const res = await fetch("/api/lessons", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ lessonId, newStatus }),
            });

            if (res.status === 401) {
                console.error("JWT expiré, rafraîchissement de la session...");
                await update();
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                console.error("Erreur lors de la mise à jour du statut :", data.error);
                showToast({ title: "Erreur lors de la mise à jour du statut", variant: "destructive" });
                return;
            }

            const { lesson: updatedLesson } = await res.json();

            setLessons((prev) =>
                prev.map((l) => (l._id === lessonId ? { ...l, status: updatedLesson.status } as ILesson : l))
            );

            showToast({ title: "Statut mis à jour avec succès" });

        } catch (err) {
            console.error("Erreur réseau :", err);
            showToast({ title: "Erreur réseau", variant: "destructive" });
        }
    };

    // Gestion des filtres
    const handleFiltersChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        setPage(1); // Retour à la première page lors du changement de filtres
    };

    // Gestion de la pagination
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setPage(1); // Retour à la première page
    };

    // Export des données
    const handleExport = () => {
        const csvContent = [
            ['Ordre', 'Titre', 'Statut', 'Cours', 'Section', 'Auteur', 'Média', 'Date de création'],
            ...lessons.map(lesson => [
                lesson.order?.toString() || '',
                lesson.title || '',
                lesson.status || '',
                (lesson.sectionId as any)?.courseId?.title || '',
                (lesson.sectionId as any)?.title || '',
                (lesson.author as any)?.name || '',
                lesson.media?.length?.toString() || '0',
                lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString('fr-FR') : ''
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `lecons_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Obtenir toutes les sections pour les filtres
    const allSections = courses.flatMap(course => 
        course.sections.map(section => ({
            ...section,
            courseId: course._id
        }))
    );

    return (
        <ToastProvider>
            <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des Leçons</h1>
                    <p className="text-gray-600">Gérez les leçons de la plateforme</p>
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={loadingLessons}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) setSelectedLesson(undefined);
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter une leçon
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedLesson ? "Modifier la leçon" : "Ajouter une nouvelle leçon"}
                                </DialogTitle>
                            </DialogHeader>
                            <LessonForm
                                lesson={selectedLesson}
                                onSuccess={(newLesson: ILesson) => {
                                    setLessons((prev) =>
                                        selectedLesson
                                            ? prev.map((l) => (l._id === newLesson._id ? newLesson : l))
                                            : [...prev, newLesson]
                                    );
                                    setDialogOpen(false);
                                    setSelectedLesson(undefined);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Statistiques détaillées */}
            {stats && (
                <LessonStats stats={stats} />
            )}

            {/* Barre de recherche et filtres */}
            <LessonAdvancedSearch
                onFiltersChange={handleFiltersChange}
                isLoading={loadingLessons}
                totalResults={totalLessons}
                stats={stats}
                courses={courses}
                sections={allSections}
            />

            {/* Table des leçons */}
            <div className="bg-white rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Leçon</TableHead>
                            <TableHead>Informations</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Média</TableHead>
                            <TableHead>Auteur</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingLessons ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                    <p className="mt-2 text-gray-500">Chargement des leçons...</p>
                                </TableCell>
                            </TableRow>
                        ) : lessons.length > 0 ? (
                            lessons.map((lesson) => (
                                <TableRow key={lesson._id as string}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-medium text-gray-900">{lesson.title}</div>
                                            <div className="text-sm text-gray-500">
                                                Ordre: {lesson.order}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm">
                                                <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                                                {(lesson.sectionId as any)?.courseId?.title || 'Cours inconnu'}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <FileText className="h-4 w-4 mr-2" />
                                                {(lesson.sectionId as any)?.title || 'Section inconnue'}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {session?.user?.role === "Admin" || session?.user?.role === "Correcteur" ? (
                                            <Select
                                                value={lesson.status}
                                                onValueChange={(newValue) => handleStatusChange(lesson._id as string, newValue)}
                                                disabled={loadingLessons}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Choisir un statut" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="En attente de correction">En attente de correction</SelectItem>
                                                    <SelectItem value="En cours de rédaction">En cours de rédaction</SelectItem>
                                                    <SelectItem value="Validée">Validée</SelectItem>
                                                    <SelectItem value="Brouillon">Brouillon</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge 
                                                className={`${
                                                    lesson.status === 'Validée' ? 'bg-green-500 text-white' :
                                                    lesson.status === 'En attente de correction' ? 'bg-yellow-500 text-white' :
                                                    lesson.status === 'En cours de rédaction' ? 'bg-blue-500 text-white' :
                                                    'bg-gray-500 text-white'
                                                } whitespace-nowrap px-2 py-1 text-sm`}
                                            >
                                                {lesson.status}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Video className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">
                                                {lesson.media?.length || 0} fichier{(lesson.media?.length || 0) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {lesson.media && lesson.media.length > 0 && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-pointer text-xs text-blue-600">
                                                        Voir les fichiers
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs p-2 text-sm">
                                                    <ul className="list-disc pl-4">
                                                        {lesson.media.slice(0, 3).map((media, idx) => (
                                                            <li key={idx}>{media.split('/').pop()}</li>
                                                        ))}
                                                        {lesson.media.length > 3 && (
                                                            <li>... et {lesson.media.length - 3} autres</li>
                                                        )}
                                                    </ul>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            <div className="text-sm">
                                                {(lesson.author as any)?.name || 'Auteur inconnu'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedLesson(lesson);
                                                    setDialogOpen(true);
                                                }}
                                                disabled={loadingLessons}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(lesson._id as string)}
                                                disabled={loadingLessons}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="text-gray-500">
                                        <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>Aucune leçon trouvée</p>
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
                    totalItems={totalLessons}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    isLoading={loadingLessons}
                />
            )}

            {/* Affichage du Toast */}
            <ToastViewport>
                {toastOpen && (
                    <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant}>
                        <ToastTitle>{toastMessage}</ToastTitle>
                        <ToastClose />
                    </Toast>
                )}
            </ToastViewport>
        </div>
        </ToastProvider>
    );
}
