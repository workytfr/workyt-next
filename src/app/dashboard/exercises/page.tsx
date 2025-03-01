"use client";

import { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Pencil, Trash2, Plus, Eye, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import ExerciseForm from "./../_components/ExerciceForm";
import ExerciseDetail from "./../_components/ExerciseDetail";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

interface IExercise {
    _id: string;
    sectionId: string;
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
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [exercises, setExercises] = useState<IExercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<IExercise | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [viewExercise, setViewExercise] = useState<IExercise | null>(null);
    const [courseId, setCourseId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    // L'état de saisie est séparé de celui de la recherche effective
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    // Par défaut, aucun filtre n'est appliqué
    const [difficultyFilter, setDifficultyFilter] = useState<string>("");
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingExercises, setLoadingExercises] = useState(false);

    // Charger les cours avec recherche (déclenché uniquement lorsque searchQuery change)
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch(`/api/courses?page=1&limit=10&search=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
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
    }, [searchQuery, session?.accessToken]);

    // Charger les exercices de la section sélectionnée
    useEffect(() => {
        if (!sectionId) return;
        setLoadingExercises(true);
        async function fetchExercises() {
            if (!session?.accessToken) return;
            try {
                const difficultyParam = difficultyFilter ? `&difficulty=${difficultyFilter}` : "";
                const res = await fetch(`/api/exercises?sectionId=${sectionId}${difficultyParam}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setExercises(data);
                } else {
                    console.error("Erreur lors du chargement des exercices :", await res.text());
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
            } finally {
                setLoadingExercises(false);
            }
        }
        fetchExercises();
    }, [sectionId, difficultyFilter, session?.accessToken]);

    // Fonction déclenchée lors du clic sur le bouton "Rechercher"
    const handleSearch = () => {
        setSearchQuery(searchInput);
    };

    // Supprimer un exercice
    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet exercice ?")) return;
        try {
            const res = await fetch(`/api/exercises/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
            });
            if (res.ok) {
                setExercises(prev => prev.filter(ex => ex._id !== id));
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">Gestion des Exercices</h1>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedExercise(null);
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2" /> Ajouter un exercice
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
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Barre de recherche des cours */}
            <label className="block text-sm font-medium text-gray-700">Rechercher un cours</label>
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Tapez le nom d'un cours..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <Button onClick={handleSearch}>Rechercher</Button>
            </div>

            {/* Sélection du cours */}
            <label className="block text-sm font-medium text-gray-700 mt-4">Sélectionner un cours</label>
            <Select onValueChange={setCourseId} disabled={loadingCourses}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisissez un cours" />
                </SelectTrigger>
                <SelectContent>
                    {loadingCourses ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="animate-spin w-5 h-5" />
                        </div>
                    ) : courses.length > 0 ? (
                        courses.map(course => (
                            <SelectItem key={course._id} value={course._id}>
                                {course.title}
                            </SelectItem>
                        ))
                    ) : (
                        <div className="p-4 text-gray-500">Aucun cours trouvé</div>
                    )}
                </SelectContent>
            </Select>

            {/* Sélection de la section */}
            {courseId && (
                <>
                    <label className="block text-sm font-medium text-gray-700 mt-4">Sélectionner une section</label>
                    <Select onValueChange={setSectionId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisissez une section" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses
                                .find(course => course._id === courseId)
                                ?.sections.map(section => (
                                    <SelectItem key={section._id} value={section._id}>
                                        {section.title}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </>
            )}

            {/* Filtre par difficulté (sans option "Tous") */}
            {sectionId && (
                <>
                    <label className="block text-sm font-medium text-gray-700 mt-4">Filtrer par difficulté</label>
                    <Select onValueChange={setDifficultyFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une difficulté" />
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
                </>
            )}

            {/* Tableau des exercices */}
            {sectionId && (
                <Table className="mt-4">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Difficulté</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingExercises ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : exercises.length > 0 ? (
                            exercises.map(exercise => (
                                <Fragment key={exercise._id}>
                                    <TableRow>
                                        <TableCell>{exercise.title}</TableCell>
                                        <TableCell>{exercise.difficulty}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" onClick={() => setViewExercise(exercise)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedExercise(exercise);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" className="text-red-500" onClick={() => handleDelete(exercise._id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-gray-500">
                                    Aucun exercice trouvé
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            {/* Popup pour afficher les détails de l'exercice */}
            {viewExercise && (
                <Dialog open onOpenChange={() => setViewExercise(null)}>
                    <DialogContent className="max-w-4xl w-full h-screen overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Détails de l'exercice</DialogTitle>
                        </DialogHeader>
                        <ExerciseDetail exercise={viewExercise} onClose={() => setViewExercise(null)} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
