"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
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

// Retourne des classes CSS personnalisées en fonction du statut
const getBadgeClass = (status: string) => {
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
};

// Formate le statut : supprime les underscores et capitalise chaque mot
const formatStatus = (status: string) => {
    return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export default function CoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<Course[]>([]);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);
    const limit = 10; // Nombre d'éléments par page

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

    // Charger les cours avec gestion des erreurs et pagination
    useEffect(() => {
        async function fetchCourses() {
            if (!session?.accessToken) return;

            setLoading(true);
            try {
                const res = await fetch(
                    `/api/courses?page=${page}&limit=${limit}&search=${search}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );

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
                setCourses((prev) => prev.filter((course) => course._id !== id));
                showToast({ title: "Cours supprimé avec succès." });
            } else {
                console.error("Erreur lors de la suppression :", await res.text());
            }
        } catch (error) {
            console.error("Erreur réseau lors de la suppression :", error);
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
                showToast({ title: "Erreur" });
                return;
            }

            const { course: updatedCourse } = await res.json();

            setCourses((prev) =>
                prev.map((c) => (c._id === courseId ? { ...c, status: updatedCourse.status } : c))
            );

            showToast({ title: "Statut mis à jour" });
        } catch (err) {
            console.error("Erreur réseau :", err);
            showToast({ title: "Erreur réseau" });
        }
    };

    return (
        <ToastProvider>
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
                                <DialogTitle>
                                    {selectedCourse ? "Modifier le cours" : "Ajouter un nouveau cours"}
                                </DialogTitle>
                            </DialogHeader>
                            <CourseForm
                                course={selectedCourse}
                                onSuccess={(newCourse: Course) => {
                                    setCourses((prev) =>
                                        selectedCourse
                                            ? prev.map((c) => (c._id === newCourse._id ? newCourse : c))
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
                                    <TableCell>
                                        {session?.user?.role === "Admin" ? (
                                            <Select
                                                value={course.status}
                                                onValueChange={(newValue) => handleStatusChange(course._id, newValue)}
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
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                setDialogOpen(true);
                                            }}
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
