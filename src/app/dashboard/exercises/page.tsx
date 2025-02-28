"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Pencil, Trash2, Plus, Eye, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import ExerciseForm from "./../_components/ExerciceForm";

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
    correction: string;
    difficulty: string;
    image?: string;
}

export default function ExercisePage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [exercises, setExercises] = useState<IExercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<IExercise | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [courseId, setCourseId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [isCorrectionVisible, setCorrectionVisible] = useState<Record<string, boolean>>({});
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingExercises, setLoadingExercises] = useState(false);

    // 🔥 Charger les cours avec recherche
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

    // 🔥 Charger les exercices de la section sélectionnée
    useEffect(() => {
        if (!sectionId) return;
        setLoadingExercises(true);
        async function fetchExercises() {
            if (!session?.accessToken) return;
            try {
                const res = await fetch(`/api/exercises?sectionId=${sectionId}&difficulty=${difficultyFilter}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setExercises(data.exercises || []);
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

    // 🔥 Supprimer un exercice
    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet exercice ?")) return;
        try {
            const res = await fetch(`/api/exercises/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
            });
            if (res.ok) {
                setExercises(exercises.filter(ex => ex._id !== id));
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
        }
    };

    // 🔥 Toggle correction visibility
    const toggleCorrection = (id: string) => {
        setCorrectionVisible(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">Gestion des Exercices</h1>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2" /> Ajouter un exercice
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedExercise ? "Modifier l'exercice" : "Ajouter un nouvel exercice"}</DialogTitle>
                        </DialogHeader>
                        <ExerciseForm
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

            {/* 📌 Recherche de cours */}
            <Input
                placeholder="Rechercher un cours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* 📌 Sélection du cours */}
            <Select onValueChange={setCourseId} disabled={loadingCourses}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cours" />
                </SelectTrigger>
                <SelectContent>
                    {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                            {course.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 📌 Sélection de la section */}
            {courseId && (
                <Select onValueChange={setSectionId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une section" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses.find((course) => course._id === courseId)?.sections.map((section) => (
                            <SelectItem key={section._id} value={section._id}>
                                {section.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* 📌 Filtre par difficulté */}
            <Select onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filtrer par difficulté" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Tous</SelectItem>
                    <SelectItem value="Facile 1">Facile 1</SelectItem>
                    <SelectItem value="Facile 2">Facile 2</SelectItem>
                    <SelectItem value="Moyen 1">Moyen 1</SelectItem>
                    <SelectItem value="Moyen 2">Moyen 2</SelectItem>
                    <SelectItem value="Difficile 1">Difficile 1</SelectItem>
                    <SelectItem value="Difficile 2">Difficile 2</SelectItem>
                    <SelectItem value="Élite">Élite</SelectItem>
                </SelectContent>
            </Select>

            {/* 📌 Tableau des exercices */}
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
                        {exercises.length > 0 ? (
                            exercises.map((exercise) => (
                                <TableRow key={exercise._id}>
                                    <TableCell>{exercise.title}</TableCell>
                                    <TableCell>{exercise.difficulty}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" onClick={() => toggleCorrection(exercise._id)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" onClick={() => { setSelectedExercise(exercise); setDialogOpen(true); }}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="text-red-500" onClick={() => handleDelete(exercise._id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
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
        </div>
    );
}
