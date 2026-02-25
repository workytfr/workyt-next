"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Pencil, Trash2, Plus, Eye, Loader2, FileText } from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import ExerciseForm from "./../_components/ExerciceForm";
import ExerciseDetail from "./../_components/ExerciseDetail";
import AdvancedPagination from "@/components/ui/AdvancedPagination";
import CourseHierarchyNav from "../_components/CourseHierarchyNav";

interface IExercise {
    _id: string;
    sectionId: {
        _id: string;
        title: string;
        courseId?: {
            _id: string;
            title: string;
        };
    } | string;
    author?: {
        _id: string;
        name: string;
    };
    title: string;
    content: string;
    correction: {
        text: string;
        image?: string | null;
    };
    difficulty: string;
    image?: string;
}

export default function ExercisePage() {
    const { data: session } = useSession();
    const [exercises, setExercises] = useState<IExercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<IExercise | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [viewExercise, setViewExercise] = useState<IExercise | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalExercises, setTotalExercises] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const isAdmin = session?.user?.role === "Admin";

    // Hierarchy nav state
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");

    // Secondary filters
    const [query, setQuery] = useState("");
    const [difficulty, setDifficulty] = useState("all");
    const [myExercises, setMyExercises] = useState(!isAdmin);

    // Update myExercises default when session loads
    useEffect(() => {
        if (session?.user?.role && session.user.role !== "Admin") {
            setMyExercises(true);
        }
    }, [session?.user?.role]);

    // Toast
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
            search: query,
            courseId: selectedCourseId,
            sectionId: selectedSectionId,
            difficulty: difficulty === "all" ? "" : difficulty,
            authorId: myExercises && session?.user?.id ? session.user.id : "",
        });
        return `/api/exercises?${params.toString()}`;
    }, [page, itemsPerPage, query, selectedCourseId, selectedSectionId, difficulty, myExercises, session?.user?.id]);

    // Charger les exercices
    useEffect(() => {
        async function fetchExercises() {
            if (!session?.accessToken) return;
            setLoading(true);
            try {
                const res = await fetch(buildApiUrl(), {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setExercises(data.exercises || []);
                    setTotalExercises(data.total || 0);
                    setTotalPages(data.totalPages || 0);
                } else {
                    console.error("Erreur lors du chargement des exercices :", await res.text());
                    showToast({ title: "Erreur de chargement", variant: "destructive" });
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
                showToast({ title: "Erreur réseau", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        fetchExercises();
    }, [buildApiUrl, session?.accessToken]);

    const handleCourseChange = (courseId: string) => {
        setSelectedCourseId(courseId);
        setPage(1);
    };

    const handleSectionChange = (sectionId: string) => {
        setSelectedSectionId(sectionId);
        setPage(1);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet exercice ?")) return;
        try {
            const res = await fetch(`/api/exercises/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
            });
            if (res.ok) {
                setExercises(prev => prev.filter(ex => ex._id !== id));
                showToast({ title: "Exercice supprimé avec succès" });
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
                showToast({ title: "Erreur lors de la suppression", variant: "destructive" });
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
            showToast({ title: "Erreur réseau", variant: "destructive" });
        }
    };

    return (
        <ToastProvider>
            <div className="space-y-6">
                {/* En-tête */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Gestion des Exercices</h1>
                        <p className="text-gray-600">Gérez les exercices et leurs contenus</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setSelectedExercise(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter un exercice
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedExercise ? "Modifier l'exercice" : "Ajouter un nouvel exercice"}
                                </DialogTitle>
                            </DialogHeader>
                            <ExerciseForm
                                exercise={selectedExercise}
                                onSuccess={(newExercise: IExercise) => {
                                    setExercises(prev =>
                                        selectedExercise
                                            ? prev.map(e => (e._id === newExercise._id ? newExercise : e))
                                            : [...prev, newExercise]
                                    );
                                    setDialogOpen(false);
                                    setSelectedExercise(null);
                                    showToast({ title: selectedExercise ? "Exercice mis à jour" : "Exercice créé" });
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Navigation hiérarchique */}
                <CourseHierarchyNav
                    selectedCourseId={selectedCourseId}
                    selectedSectionId={selectedSectionId}
                    onCourseChange={handleCourseChange}
                    onSectionChange={handleSectionChange}
                />

                {/* Filtres secondaires */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rechercher
                            </label>
                            <input
                                type="text"
                                placeholder="Rechercher un exercice..."
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Difficulté
                            </label>
                            <Select
                                value={difficulty}
                                onValueChange={(value) => { setDifficulty(value); setPage(1); }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Toutes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    <SelectItem value="Facile 1">Facile 1</SelectItem>
                                    <SelectItem value="Facile 2">Facile 2</SelectItem>
                                    <SelectItem value="Moyen 1">Moyen 1</SelectItem>
                                    <SelectItem value="Moyen 2">Moyen 2</SelectItem>
                                    <SelectItem value="Difficile 1">Difficile 1</SelectItem>
                                    <SelectItem value="Difficile 2">Difficile 2</SelectItem>
                                    <SelectItem value="Élite">Élite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="myExercises"
                                    checked={myExercises}
                                    onChange={(e) => { setMyExercises(e.target.checked); setPage(1); }}
                                    className="rounded"
                                />
                                <label htmlFor="myExercises" className="text-sm font-medium text-gray-700">
                                    Mes exercices uniquement
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tableau des exercices */}
                <div className="bg-white rounded-lg shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Cours / Section</TableHead>
                                <TableHead>Difficulté</TableHead>
                                <TableHead>Auteur</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                        <p className="mt-2 text-gray-500">Chargement des exercices...</p>
                                    </TableCell>
                                </TableRow>
                            ) : exercises.length > 0 ? (
                                exercises.map((exercise) => (
                                    <TableRow key={exercise._id}>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{exercise.title}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-900">
                                                    {typeof exercise.sectionId === "object"
                                                        ? exercise.sectionId?.courseId?.title || "Cours inconnu"
                                                        : "Cours inconnu"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {typeof exercise.sectionId === "object"
                                                        ? exercise.sectionId?.title || "Section inconnue"
                                                        : "Section inconnue"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                exercise.difficulty.startsWith("Facile") ? "bg-green-100 text-green-800" :
                                                exercise.difficulty.startsWith("Moyen") ? "bg-yellow-100 text-yellow-800" :
                                                exercise.difficulty.startsWith("Difficile") ? "bg-red-100 text-red-800" :
                                                "bg-purple-100 text-purple-800"
                                            }`}>
                                                {exercise.difficulty}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-700">
                                                {exercise.author && typeof exercise.author === "object"
                                                    ? exercise.author.name
                                                    : "Inconnu"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setViewExercise(exercise)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedExercise(exercise);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(exercise._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>Aucun exercice trouvé</p>
                                            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <AdvancedPagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalExercises}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(newPage) => setPage(newPage)}
                        onItemsPerPageChange={(newItems) => { setItemsPerPage(newItems); setPage(1); }}
                        isLoading={loading}
                    />
                )}

                {/* Détail exercice */}
                {viewExercise && (
                    <Dialog open onOpenChange={() => setViewExercise(null)}>
                        <DialogContent className="max-w-4xl w-full h-screen overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>D&eacute;tails de l&apos;exercice</DialogTitle>
                            </DialogHeader>
                            <ExerciseDetail exercise={{
                                ...viewExercise,
                                sectionId: typeof viewExercise.sectionId === "object" ? viewExercise.sectionId._id : viewExercise.sectionId,
                            }} onClose={() => setViewExercise(null)} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

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
