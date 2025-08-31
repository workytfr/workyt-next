"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2, Download, BookOpen, CheckCircle, Clock, XCircle, FileText, Users, Calendar } from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import CourseForm from "./../_components/CourseForm";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/Tooltip";
import AdvancedPagination from "@/components/ui/AdvancedPagination";
import CourseAdvancedSearch from "@/components/ui/CourseAdvancedSearch";
import CourseStats from "@/components/ui/CourseStats";

interface Section {
    _id: string;
    title: string;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    niveau: string;
    matiere: string;
    status: string;
    sections: Section[];
    authors: Array<{ _id: string; name: string }>;
    createdAt: string;
    updatedAt: string;
}

interface SearchFilters {
    query: string;
    status: string;
    niveau: string;
    matiere: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    hasSections: boolean;
    authorId: string;
}

interface Stats {
    total: number;
    published: number;
    pending: number;
    cancelled: number;
    withSections: number;
    byLevel: Record<string, number>;
    bySubject: Record<string, number>;
    recentCourses: number;
    avgSectionsPerCourse: number;
}

// Retourne des classes CSS personnalisées en fonction du statut
const getBadgeClass = (status: string) => {
    try {
        if (!status) return "bg-gray-500 text-white";
        switch (status) {
            case "publie":
                return "bg-green-500 text-white";
            case "annule":
                return "bg-red-500 text-white";
            case "en_attente_verification":
                return "bg-yellow-500 text-white";
            case "en_attente_publication":
                return "bg-blue-500 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    } catch (error) {
        console.error("Erreur lors de la détermination de la classe du badge:", error);
        return "bg-gray-500 text-white";
    }
};

// Formate le statut : supprime les underscores et capitalise chaque mot
const formatStatus = (status: string) => {
    try {
        if (!status) return "Inconnu";
        return status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    } catch (error) {
        console.error("Erreur lors du formatage du statut:", error);
        return status || "Inconnu";
    }
};

export default function CoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCourses, setTotalCourses] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        status: "all",
        niveau: "all",
        matiere: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
        hasSections: false,
        authorId: "all"
    });

    // Gestion du Toast
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");

    // Gestion d'erreur globale
    const [error, setError] = useState<string | null>(null);

    // Fonction de gestion d'erreur globale
    const handleGlobalError = (error: any, context: string) => {
        console.error(`Erreur dans ${context}:`, error);
        setError(`Une erreur est survenue dans ${context}. Veuillez réessayer.`);
        setTimeout(() => setError(null), 5000);
    };

    // Gestionnaire d'erreur global pour les composants
    const safeExecute = (fn: Function, context: string) => {
        try {
            return fn();
        } catch (error) {
            handleGlobalError(error, context);
            return null;
        }
    };

    // Gestionnaire d'erreur pour les composants enfants
    const handleChildError = (error: any, context: string) => {
        handleGlobalError(error, context);
    };

    const showToast = ({ title, variant }: { title: string; variant?: "default" | "destructive" }) => {
        try {
            setToastMessage(title);
            setToastVariant(variant || "default");
            setToastOpen(true);
            setTimeout(() => setToastOpen(false), 3000);
        } catch (error) {
            console.error("Erreur lors de l'affichage du toast:", error);
        }
    };

    const buildApiUrl = useCallback(() => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: itemsPerPage.toString(),
                search: filters.query,
                status: filters.status === "all" ? "" : filters.status,
                niveau: filters.niveau === "all" ? "" : filters.niveau,
                matiere: filters.matiere === "all" ? "" : filters.matiere,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                hasSections: filters.hasSections.toString(),
                authorId: filters.authorId === "all" ? "" : filters.authorId,
            });
            return `/api/courses?${params.toString()}`;
        } catch (error) {
            console.error("Erreur lors de la construction de l'URL:", error);
            return `/api/courses?page=${page}&limit=${itemsPerPage}`;
        }
    }, [page, itemsPerPage, filters]);

    // Charger les cours avec gestion des erreurs et pagination
    useEffect(() => {
        async function fetchCourses() {
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
                try {
                    setCourses(data.courses || []);
                    setTotalCourses(data.total || 0);
                    setTotalPages(data.totalPages || 0);
                    setStats(data.stats || null);
                } catch (error) {
                    console.error("Erreur lors de la mise à jour de l'état local:", error);
                    showToast({ title: "Erreur lors de la mise à jour de l'état", variant: "destructive" });
                }
            } catch (error) {
                console.error("Erreur lors du chargement des cours :", error);
                showToast({ title: "Erreur de chargement", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        fetchCourses();
    }, [buildApiUrl, session?.accessToken]);

    // Supprimer un cours
    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce cours ?")) return;

        try {
            const res = await fetch(`/api/courses/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (res.ok) {
                try {
                    setCourses((prev) => prev.filter((course) => course._id !== id));
                    showToast({ title: "Cours supprimé avec succès." });
                } catch (error) {
                    console.error("Erreur lors de la mise à jour de l'état local:", error);
                    showToast({ title: "Erreur lors de la mise à jour de l'état", variant: "destructive" });
                }
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
                showToast({ title: "Erreur lors de la suppression", variant: "destructive" });
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
            showToast({ title: "Erreur réseau", variant: "destructive" });
        }
    };

    // Mettre à jour le statut d'un cours (PATCH)
    const handleStatusChange = async (courseId: string, newStatus: string) => {
        if (!session?.accessToken) return;

        try {
            const res = await fetch("/api/courses", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ courseId, newStatus }),
            });

            if (!res.ok) {
                const data = await res.json();
                console.error("Erreur lors de la mise à jour du statut :", data.error);
                showToast({ title: "Erreur de mise à jour", variant: "destructive" });
                return;
            }

            const { course: updatedCourse } = await res.json();

            try {
                setCourses((prev) =>
                    prev.map((c) => (c._id === courseId ? { ...c, status: updatedCourse.status } : c))
                );
                showToast({ title: "Statut mis à jour" });
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'état local:", error);
                showToast({ title: "Erreur lors de la mise à jour de l'état", variant: "destructive" });
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
            showToast({ title: "Erreur réseau", variant: "destructive" });
        }
    };

    // Gestion des filtres
    const handleFiltersChange = (newFilters: SearchFilters) => {
        try {
            setFilters(newFilters);
            setPage(1); // Retour à la première page lors du changement de filtres
        } catch (error) {
            console.error("Erreur lors du changement de filtres:", error);
            showToast({ title: "Erreur lors du changement de filtres", variant: "destructive" });
        }
    };

    // Gestion de la pagination
    const handlePageChange = (newPage: number) => {
        try {
            setPage(newPage);
        } catch (error) {
            console.error("Erreur lors du changement de page:", error);
            showToast({ title: "Erreur lors du changement de page", variant: "destructive" });
        }
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        try {
            setItemsPerPage(newItemsPerPage);
            setPage(1); // Retour à la première page
        } catch (error) {
            console.error("Erreur lors du changement d'éléments par page:", error);
            showToast({ title: "Erreur lors du changement d'éléments par page", variant: "destructive" });
        }
    };

    // Export des données
    const handleExport = () => {
        try {
            const csvContent = [
                ['Titre', 'Description', 'Niveau', 'Matière', 'Statut', 'Sections', 'Auteurs', 'Date de création'],
                ...courses.map(course => [
                    course.title,
                    course.description,
                    course.niveau,
                    course.matiere,
                    formatStatus(course.status),
                    course.sections.length.toString(),
                    course.authors.map(author => author.name).join(', '),
                    new Date(course.createdAt).toLocaleDateString('fr-FR')
                ])
            ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `cours_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erreur lors de l'export:", error);
            showToast({ title: "Erreur lors de l'export", variant: "destructive" });
        }
    };

    return (
        <ToastProvider>
            <div className="space-y-6">
                {/* En-tête avec statistiques */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Gestion des Cours</h1>
                        <p className="text-gray-600">Gérez les cours de la plateforme</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            try {
                                handleExport();
                            } catch (error) {
                                console.error("Erreur lors de l'export:", error);
                                showToast({ title: "Erreur lors de l'export", variant: "destructive" });
                            }
                        }} disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            Exporter
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => {
                                    try {
                                        setSelectedCourse(null);
                                    } catch (error) {
                                        console.error("Erreur lors de la réinitialisation du cours sélectionné:", error);
                                    }
                                }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter un cours
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-full">
                                <DialogHeader>
                                    <DialogTitle>
                                        {selectedCourse ? "Modifier le cours" : "Ajouter un nouveau cours"}
                                    </DialogTitle>
                                </DialogHeader>
                                <CourseForm
                                    course={selectedCourse}
                                    onSuccess={(newCourse: Course) => {
                                        try {
                                            setCourses((prev) =>
                                                selectedCourse
                                                    ? prev.map((c) => (c._id === newCourse._id ? newCourse : c))
                                                    : [...prev, newCourse]
                                            );
                                            setDialogOpen(false);
                                            showToast({ title: selectedCourse ? "Cours mis à jour" : "Cours créé" });
                                        } catch (error) {
                                            console.error("Erreur lors de la mise à jour des cours:", error);
                                            showToast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
                                            handleChildError(error, "CourseForm - onSuccess");
                                        }
                                    }}
                                    onError={(error: any) => {
                                        handleChildError(error, "CourseForm");
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Statistiques détaillées */}
                {stats && (
                    <div className="border rounded-lg p-4">
                        <CourseStats stats={stats} />
                    </div>
                )}

                {/* Barre de recherche et filtres */}
                <CourseAdvancedSearch
                    onFiltersChange={(newFilters) => {
                        try {
                            handleFiltersChange(newFilters);
                        } catch (error) {
                            console.error("Erreur lors du changement de filtres:", error);
                            showToast({ title: "Erreur lors du changement de filtres", variant: "destructive" });
                        }
                    }}
                    isLoading={loading}
                    totalResults={totalCourses}
                    stats={stats}
                />

                {/* Table des cours */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cours</TableHead>
                                <TableHead>Informations</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Sections</TableHead>
                                <TableHead>Auteurs</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                        <p className="mt-2 text-gray-500">Chargement des cours...</p>
                                    </TableCell>
                                </TableRow>
                            ) : courses.length > 0 ? (
                                courses.map((course) => (
                                    <TableRow key={course._id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">{course.title}</div>
                                                <div className="text-sm text-gray-500 line-clamp-2">
                                                    {course.description}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm">
                                                    <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                                                    {course.niveau} • {course.matiere}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    {new Date(course.createdAt).toLocaleDateString('fr-FR')}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {session?.user?.role === "Admin" ? (
                                                <Select
                                                    value={course.status}
                                                    onValueChange={(newValue) => {
                                                        try {
                                                            handleStatusChange(course._id, newValue);
                                                        } catch (error) {
                                                            console.error("Erreur lors du changement de statut:", error);
                                                            showToast({ title: "Erreur lors du changement de statut", variant: "destructive" });
                                                        }
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Choisir un statut" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="en_attente_publication">En attente publication</SelectItem>
                                                        <SelectItem value="en_attente_verification">En attente vérification</SelectItem>
                                                        <SelectItem value="publie">Publié</SelectItem>
                                                        <SelectItem value="annule">Annulé</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge className={`${getBadgeClass(course.status)} whitespace-nowrap px-2 py-1 text-sm`}>
                                                    {formatStatus(course.status)}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">
                                                    {course.sections?.length || 0} section{course.sections?.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {course.sections && course.sections.length > 0 && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="cursor-pointer text-xs text-blue-600">
                                                                Voir les sections
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs p-2 text-sm">
                                                            <ul className="list-disc pl-4">
                                                                {course.sections.slice(0, 3).map((section) => (
                                                                    <li key={section._id}>{section.title}</li>
                                                                ))}
                                                                {course.sections.length > 3 && (
                                                                    <li>... et {course.sections.length - 3} autres</li>
                                                                )}
                                                            </ul>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <div className="text-sm">
                                                    {course.authors?.map(author => author.name).join(', ') || 'Aucun auteur'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        try {
                                                            setSelectedCourse(course);
                                                            setDialogOpen(true);
                                                        } catch (error) {
                                                            console.error("Erreur lors de la sélection du cours:", error);
                                                            showToast({ title: "Erreur lors de la sélection", variant: "destructive" });
                                                        }
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => {
                                                        try {
                                                            handleDelete(course._id);
                                                        } catch (error) {
                                                            console.error("Erreur lors de la suppression:", error);
                                                            showToast({ title: "Erreur lors de la suppression", variant: "destructive" });
                                                        }
                                                    }}
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
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>Aucun cours trouvé</p>
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
                        totalItems={totalCourses}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(newPage) => {
                            try {
                                handlePageChange(newPage);
                            } catch (error) {
                                console.error("Erreur lors du changement de page:", error);
                                showToast({ title: "Erreur lors du changement de page", variant: "destructive" });
                            }
                        }}
                        onItemsPerPageChange={(newItemsPerPage) => {
                            try {
                                handleItemsPerPageChange(newItemsPerPage);
                            } catch (error) {
                                console.error("Erreur lors du changement d'éléments par page:", error);
                                showToast({ title: "Erreur lors du changement d'éléments par page", variant: "destructive" });
                            }
                        }}
                        isLoading={loading}
                    />
                )}
            </div>

            {/* Affichage du Toast */}
            <ToastViewport>
                {toastOpen && (
                    <Toast 
                        open={toastOpen} 
                        onOpenChange={(open) => {
                            try {
                                setToastOpen(open);
                            } catch (error) {
                                console.error("Erreur lors du changement d'état du toast:", error);
                            }
                        }} 
                        variant={toastVariant}
                    >
                        <ToastTitle>{toastMessage}</ToastTitle>
                        <ToastClose />
                    </Toast>
                )}
            </ToastViewport>

            {/* Affichage de l'erreur globale */}
            {error && (
                <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="inline-flex text-red-400 hover:text-red-600"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastProvider>
    );
}
