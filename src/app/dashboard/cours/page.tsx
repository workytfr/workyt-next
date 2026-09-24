"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  BookOpen,
  Edit2,
  Trash2,
  ExternalLink,
  Layers,
  FileText,
  Upload,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";
import { educationData } from "@/data/educationData";
import "../styles/dashboard-theme.css";

interface Course {
  _id: string;
  title: string;
  description: string;
  niveau: string;
  matiere: string;
  status: string;
  image?: string;
  sections?: Array<{ _id: string; title: string }>;
  authors?: Array<{ _id: string; name: string }>;
  verifiedBy?: { _id: string; name: string; username?: string } | null;
  verifiedAt?: string;
  createdAt: string;
}

interface SearchFilters {
  query: string;
  status: string;
  niveau: string;
  matiere: string;
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: "",
    niveau: "",
    matiere: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Charger les cours
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses?limit=100", {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          setFilteredCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des cours:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchCourses();
    }
  }, [session?.accessToken]);

  // Filtrer les cours
  useEffect(() => {
    let filtered = courses;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.niveau) {
      filtered = filtered.filter((c) => c.niveau === filters.niveau);
    }

    if (filters.matiere) {
      filtered = filtered.filter((c) => c.matiere === filters.matiere);
    }

    setFilteredCourses(filtered);
  }, [filters, courses]);

  // Changer le statut d'un cours
  const updateCourseStatus = async (courseId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/courses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ courseId, newStatus }),
      });

      if (res.ok) {
        setCourses(
          courses.map((c) =>
            c._id === courseId
              ? {
                  ...c,
                  status: newStatus,
                  // Retour "à vérifier" = vérification annulée côté serveur
                  ...(newStatus === "en_attente_verification"
                    ? { verifiedBy: null, verifiedAt: undefined }
                    : {}),
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
    }
  };

  // Vérifier un cours (Correcteur / Admin)
  const verifyCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setCourses(
          courses.map((c) =>
            c._id === courseId
              ? {
                  ...c,
                  status: "en_attente_publication",
                  verifiedBy: {
                    _id: session?.user?.id || "",
                    name: session?.user?.name || "Vous",
                  },
                  verifiedAt: new Date().toISOString(),
                }
              : c
          )
        );
        if (data.pointsAwarded > 0) {
          alert(`Cours vérifié ! +${data.pointsAwarded} points 🎉`);
        }
      } else {
        alert(data.error || "Impossible de vérifier ce cours.");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
    }
  };

  // Peut vérifier : Correcteur/Admin, cours à vérifier, et pas auteur du cours
  const canVerify = (course: Course) => {
    const role = session?.user?.role;
    if (role !== "Correcteur" && role !== "Admin") return false;
    if (course.status !== "en_attente_verification") return false;
    const userId = session?.user?.id;
    if (userId && course.authors?.some((a) => a._id === userId)) return false;
    return true;
  };

  // Supprimer un cours
  const deleteCourse = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) return;

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        setCourses(courses.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Statut en français
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      publie: "Publié",
      en_attente_publication: "En attente",
      en_attente_verification: "À vérifier",
      annule: "Annulé",
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      publie: "dash-badge-success",
      en_attente_publication: "dash-badge-warning",
      en_attente_verification: "dash-badge-info",
      annule: "dash-badge-danger",
    };
    return classes[status] || "dash-badge";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6a1a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="dash-main-title">Gestion des cours</h1>
          <p className="dash-main-subtitle">
            {filteredCourses.length} cours sur la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/cours/seo"
            className="dash-button dash-button-secondary"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Audit SEO</span>
          </Link>
          <Link
            href="/dashboard/cours/importer"
            className="dash-button dash-button-secondary"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importer un cours</span>
          </Link>
          <Link href="/dashboard/cours/nouveau" className="dash-button dash-button-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau cours</span>
          </Link>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#97938e]" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            className="dash-input pl-10"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`dash-button dash-button-secondary ${
              showFilters ? "bg-[#fff4ec] text-[#ff6a1a]" : ""
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>

          <div className="h-6 w-px bg-[#e6e0d6] mx-2" />

          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-[#fff4ec] text-[#ff6a1a]"
                : "text-[#6b625c] hover:bg-[#f5efe3]"
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-[#fff4ec] text-[#ff6a1a]"
                : "text-[#6b625c] hover:bg-[#f5efe3]"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="p-4 bg-[#f5efe3] rounded-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="dash-label text-sm">Statut</label>
              <select
                className="dash-input"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">Tous les statuts</option>
                <option value="publie">Publié</option>
                <option value="en_attente_publication">En attente</option>
                <option value="en_attente_verification">À vérifier</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div>
              <label className="dash-label text-sm">Niveau</label>
              <select
                className="dash-input"
                value={filters.niveau}
                onChange={(e) =>
                  setFilters({ ...filters, niveau: e.target.value })
                }
              >
                <option value="">Tous les niveaux</option>
                {educationData.levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="dash-label text-sm">Matière</label>
              <select
                className="dash-input"
                value={filters.matiere}
                onChange={(e) =>
                  setFilters({ ...filters, matiere: e.target.value })
                }
              >
                <option value="">Toutes les matières</option>
                {educationData.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(filters.status || filters.niveau || filters.matiere) && (
            <button
              onClick={() =>
                setFilters({ ...filters, status: "", niveau: "", matiere: "" })
              }
              className="text-sm text-[#ff6a1a] hover:text-[#c24a0a]"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Liste des cours */}
      {filteredCourses.length === 0 ? (
        <div className="dash-empty border-2 border-dashed border-[#e6e0d6] rounded-xl">
          <div className="dash-empty-icon">
            <BookOpen className="w-8 h-8" />
          </div>
          <h4 className="dash-empty-title">Aucun cours trouvé</h4>
          <p className="dash-empty-text">
            {courses.length === 0
              ? "Commencez par créer votre premier cours"
              : "Essayez de modifier vos critères de recherche"}
          </p>
          {courses.length === 0 && (
            <Link
              href="/dashboard/cours/nouveau"
              className="dash-button dash-button-primary mt-4"
            >
              <Plus className="w-4 h-4" />
              Créer un cours
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        // Vue en grille
        <div className="dash-course-grid">
          {filteredCourses.map((course) => (
            <div key={course._id} className="dash-course-card group">
              {/* Image */}
              <div className="dash-course-image">
                {course.image ? (
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    // Le proxy de prod (WAF YDev) bloque /_next/image en 403 :
                    // on sert l'URL d'origine tant que la règle n'est pas levée.
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-[#bfbfbf]" />
                  </div>
                )}
                <div className="dash-course-status">
                  <span className={`dash-badge ${getStatusBadgeClass(course.status)}`}>
                    {getStatusLabel(course.status)}
                  </span>
                </div>
              </div>

              {/* Contenu */}
              <div className="dash-course-content">
                <div className="dash-course-meta">
                  <span className="dash-badge dash-badge-primary">
                    {course.matiere}
                  </span>
                  <span className="dash-badge">{course.niveau}</span>
                </div>

                <h3 className="dash-course-title">{course.title}</h3>

                {course.description && (
                  <p className="dash-course-description">
                    {course.description.replace(/[#*_]/g, "").slice(0, 120)}...
                  </p>
                )}

                <div className="dash-course-stats">
                  <div className="dash-course-stat">
                    <Layers className="w-4 h-4" />
                    {course.sections?.length || 0} sections
                  </div>
                  <div className="dash-course-stat">
                    <FileText className="w-4 h-4" />
                    {course.sections?.reduce(
                      (acc, s) => acc + (s as any).lessons?.length || 0,
                      0
                    ) || 0}{" "}
                    leçons
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-[#e6e0d6] space-y-2">
                {/* Correcteur ayant vérifié le cours */}
                {course.verifiedBy && (
                  <div className="flex items-center gap-1.5 text-sm text-[#6b625c]">
                    <BadgeCheck className="w-4 h-4 text-emerald-500" />
                    Vérifié par {course.verifiedBy.name || course.verifiedBy.username}
                  </div>
                )}
                {/* Bouton Vérifié (correcteurs, hors auteurs du cours) */}
                {canVerify(course) && (
                  <button
                    onClick={() => verifyCourse(course._id)}
                    className="dash-button dash-button-primary dash-button-sm w-full"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Marquer comme vérifié (+13 pts)
                  </button>
                )}
                {/* Changement de statut */}
                {session?.user?.role === "Admin" && (
                  <select
                    className="dash-input text-sm w-full"
                    value={course.status}
                    onChange={(e) =>
                      updateCourseStatus(course._id, e.target.value)
                    }
                  >
                    <option value="en_attente_verification">À vérifier</option>
                    <option value="en_attente_publication">En attente</option>
                    <option value="publie">Publié</option>
                    <option value="annule">Annulé</option>
                  </select>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/cours/${course._id}/gestion`}
                    className="flex-1 dash-button dash-button-primary dash-button-sm text-center"
                  >
                    <Edit2 className="w-4 h-4" />
                    Gérer
                  </Link>
                  <Link
                    href={`/cours/${course._id}`}
                    target="_blank"
                    title={course.status === "publie" ? "Voir le cours" : "Prévisualiser (non publié)"}
                    className="dash-button dash-button-secondary dash-button-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="ml-1.5 hidden sm:inline">
                      {course.status === "publie" ? "Voir" : "Preview"}
                    </span>
                  </Link>
                  {session?.user?.role === "Admin" && (
                    <button
                      onClick={() => deleteCourse(course._id)}
                      className="dash-button dash-button-ghost dash-button-sm text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue en liste
        <div className="dash-table-container">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Cours</th>
                <th>Informations</th>
                <th>Contenu</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#f5efe3] rounded-lg flex items-center justify-center flex-shrink-0">
                        {course.image ? (
                          <Image
                            src={course.image}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <BookOpen className="w-6 h-6 text-[#bfbfbf]" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#1a1512]">
                          {course.title}
                        </p>
                        <p className="text-sm text-[#97938e]">
                          {course.authors?.[0]?.name || "Workyt"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <span className="dash-badge dash-badge-primary">
                        {course.matiere}
                      </span>
                      <span className="dash-badge ml-2">{course.niveau}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-[#6b625c]">
                      <div className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {course.sections?.length || 0} sections
                      </div>
                    </div>
                  </td>
                  <td>
                    {session?.user?.role === "Admin" ? (
                      <select
                        className="dash-input text-sm py-1"
                        value={course.status}
                        onChange={(e) =>
                          updateCourseStatus(course._id, e.target.value)
                        }
                      >
                        <option value="en_attente_verification">À vérifier</option>
                        <option value="en_attente_publication">En attente</option>
                        <option value="publie">Publié</option>
                        <option value="annule">Annulé</option>
                      </select>
                    ) : (
                      <span className={`dash-badge ${getStatusBadgeClass(course.status)}`}>
                        {getStatusLabel(course.status)}
                      </span>
                    )}
                    {course.verifiedBy && (
                      <div className="flex items-center gap-1 text-xs text-[#6b625c] mt-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {course.verifiedBy.name || course.verifiedBy.username}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {canVerify(course) && (
                        <button
                          onClick={() => verifyCourse(course._id)}
                          className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Marquer comme vérifié (+13 pts)"
                        >
                          <BadgeCheck className="w-4 h-4 text-emerald-500" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/cours/${course._id}/gestion`}
                        className="p-2 hover:bg-[#f5efe3] rounded-lg transition-colors"
                        title="Gérer"
                      >
                        <Edit2 className="w-4 h-4 text-[#6b625c]" />
                      </Link>
                      <Link
                        href={`/cours/${course._id}`}
                        target="_blank"
                        className="p-2 hover:bg-[#f5efe3] rounded-lg transition-colors"
                        title={course.status === "publie" ? "Voir le cours" : "Prévisualiser (non publié)"}
                      >
                        <ExternalLink className="w-4 h-4 text-[#6b625c]" />
                      </Link>
                      {session?.user?.role === "Admin" && (
                        <button
                          onClick={() => deleteCourse(course._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
