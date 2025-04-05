"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import LessonForm from "./../_components/LessonForm";
import { ILesson } from "@/models/Lesson";

interface ICourse {
    _id: string;
    title: string;
    sections: { _id: string; title: string }[];
}

export default function LessonsPage() {
    const { data: session, update } = useSession();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [lessons, setLessons] = useState<ILesson[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<ILesson | undefined>(
        undefined
    );
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [courseId, setCourseId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingLessons, setLoadingLessons] = useState(false);

    // Chargement des cours avec recherche
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;
            setLoadingCourses(true);
            try {
                const res = await fetch(
                    `/api/courses?page=1&limit=10&search=${encodeURIComponent(
                        searchQuery
                    )}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );
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
    }, [searchQuery, session?.accessToken, update]);

    // Chargement des leçons pour la section sélectionnée
    useEffect(() => {
        if (!sectionId || !session?.accessToken) return;
        async function fetchLessons() {
            setLoadingLessons(true);
            try {
                const res = await fetch(`/api/lessons?sectionId=${sectionId}`, {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken ?? ""}`,                    },
                });
                if (res.status === 401) {
                    console.error("JWT expiré, rafraîchissement de la session...");
                    await update();
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setLessons(data);
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
    }, [sectionId, session?.accessToken, update]);

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

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">Gestion des Leçons</h1>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setSelectedLesson(undefined);
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2" /> Ajouter une leçon
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

            {/* Barre de recherche */}
            <label className="block text-sm font-medium text-gray-700">
                Rechercher un cours
            </label>
            <Input
                placeholder="Tapez le nom d'un cours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Sélection du cours */}
            <label className="block text-sm font-medium text-gray-700">
                Sélectionner un cours
            </label>
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
                        courses.map((course) => (
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
                <Select onValueChange={setSectionId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une section" />
                    </SelectTrigger>
                    <SelectContent>
                        {courses
                            .find((course) => course._id === courseId)
                            ?.sections.map((section) => (
                                <SelectItem key={section._id} value={section._id}>
                                    {section.title}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            )}

            {/* Table des leçons */}
            {sectionId && (
                <Table className="mt-4">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ordre</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingLessons ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : lessons.length > 0 ? (
                            lessons.map((lesson) => (
                                <TableRow key={lesson._id as string}>                                    <TableCell>{lesson.order}</TableCell>
                                    <TableCell>{lesson.title}</TableCell>
                                    <TableCell>{lesson.status}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedLesson(lesson);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="text-red-500"
                                            onClick={() => handleDelete(lesson._id as string)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500">
                                    Aucune leçon trouvée
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
