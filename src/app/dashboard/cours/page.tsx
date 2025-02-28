"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { Toast } from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import CourseForm from "./../_components/CourseForm";

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
}

export default function CoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [niveauFilter, setNiveauFilter] = useState("all");
    const [matiereFilter, setMatiereFilter] = useState("all");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);
    const limit = 10; // Nombre d'éléments par page

    // 🔥 Charger les cours avec gestion des erreurs et pagination
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/courses?page=${page}&limit=${limit}&search=${search}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!res.ok) {
                    throw new Error(await res.text());
                }

                const data = await res.json();
                setCourses(data.courses || []);
                setTotalCourses(data.total || 0);
            } catch (error) {
                console.error("Erreur lors du chargement des cours :", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCourses();
    }, [page, search, session?.accessToken]);

    // 🔥 Supprimer un cours
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
                setCourses(courses.filter(course => course._id !== id));
                Toast({ title: "Cours supprimé avec succès." });
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
                <h1 className="text-2xl font-bold">Gestion des Cours</h1>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2" /> Ajouter un cours
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full">
                        <DialogHeader>
                            <DialogTitle>{selectedCourse ? "Modifier le cours" : "Ajouter un nouveau cours"}</DialogTitle>
                        </DialogHeader>
                        <CourseForm
                            course={selectedCourse}
                            onSuccess={(newCourse: Course) => {
                                setCourses(prev =>
                                    selectedCourse
                                        ? prev.map(c => (c._id === newCourse._id ? newCourse : c))
                                        : [...prev, newCourse]
                                );
                                setDialogOpen(false);
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtres et Recherche */}
            <div className="flex gap-4 mb-4">
                <Input
                    placeholder="Rechercher un cours..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table des cours */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Sections</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                            </TableCell>
                        </TableRow>
                    ) : courses.length > 0 ? (
                        courses.map((course) => (
                            <TableRow key={course._id}>
                                <TableCell>{course.title}</TableCell>
                                <TableCell>{course.niveau}</TableCell>
                                <TableCell>{course.matiere}</TableCell>
                                <TableCell>{course.status}</TableCell>
                                <TableCell>
                                    {course.sections.length > 0 ? (
                                        <ul className="list-disc pl-4">
                                            {course.sections.map((section) => (
                                                <li key={section._id}>{section.title}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        "Aucune section"
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setSelectedCourse(course); setDialogOpen(true); }}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-red-500"
                                        onClick={() => handleDelete(course._id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500">
                                Aucun cours trouvé
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-center mt-4 gap-4">
                <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
                    Précédent
                </Button>
                <span>Page {page}</span>
                <Button onClick={() => setPage((prev) => prev + 1)} disabled={page * limit >= totalCourses}>
                    Suivant
                </Button>
            </div>
        </div>
    );
}
