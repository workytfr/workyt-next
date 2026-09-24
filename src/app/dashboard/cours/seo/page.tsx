"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Loader2,
  Edit2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import "../../styles/dashboard-theme.css";

interface SeoIssue {
  id: string;
  label: string;
  status: "warning" | "error";
  advice: string;
}

interface CourseAudit {
  _id: string;
  title: string;
  matiere: string;
  niveau: string;
  status: string;
  score: number;
  errorsCount: number;
  warningsCount: number;
  issues: SeoIssue[];
}

interface AuditStats {
  total: number;
  published: number;
  avgScore: number;
  avgScorePublished: number;
  withErrors: number;
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "dash-badge-success";
  if (score >= 50) return "dash-badge-warning";
  return "dash-badge-danger";
}

const STATUS_LABELS: Record<string, string> = {
  publie: "Publié",
  en_attente_publication: "En attente",
  en_attente_verification: "À vérifier",
  annule: "Annulé",
};

export default function CoursesSeoAuditPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<CourseAudit[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "publie" | "problems">("all");

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch("/api/courses/seo-audit", {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          setStats(data.stats || null);
        }
      } catch (error) {
        console.error("Erreur chargement audit SEO:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) fetchAudit();
  }, [session?.accessToken]);

  const filteredCourses = courses.filter((c) => {
    if (filter === "publie") return c.status === "publie";
    if (filter === "problems") return c.errorsCount > 0 || c.warningsCount > 0;
    return true;
  });

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
          <Link
            href="/dashboard/cours"
            className="inline-flex items-center gap-1 text-sm text-[#6b625c] hover:text-[#ff6a1a] mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour aux cours
          </Link>
          <h1 className="dash-main-title">Audit SEO des cours</h1>
          <p className="dash-main-subtitle">
            Les cours les plus urgents à corriger apparaissent en premier
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="dash-card p-4">
            <p className="text-2xl font-bold text-[#1a1512]">{stats.avgScorePublished}/100</p>
            <p className="text-xs text-[#97938e]">Score moyen (publiés)</p>
          </div>
          <div className="dash-card p-4">
            <p className="text-2xl font-bold text-[#1a1512]">{stats.published}</p>
            <p className="text-xs text-[#97938e]">Cours publiés</p>
          </div>
          <div className="dash-card p-4">
            <p className="text-2xl font-bold text-red-500">{stats.withErrors}</p>
            <p className="text-xs text-[#97938e]">Cours avec erreurs</p>
          </div>
          <div className="dash-card p-4">
            <p className="text-2xl font-bold text-[#1a1512]">{stats.total}</p>
            <p className="text-xs text-[#97938e]">Cours audités</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-2">
        {(
          [
            { id: "all", label: "Tous" },
            { id: "publie", label: "Publiés" },
            { id: "problems", label: "Avec problèmes" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`dash-button dash-button-sm ${
              filter === f.id ? "dash-button-primary" : "dash-button-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste des cours */}
      {filteredCourses.length === 0 ? (
        <div className="dash-card p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-[#1a1512] font-medium">Aucun cours dans cette catégorie 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <div key={course._id} className="dash-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Score */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`dash-badge ${scoreBadgeClass(course.score)} text-sm font-bold`}>
                    {course.score}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1a1512] truncate">{course.title}</p>
                    <p className="text-xs text-[#97938e]">
                      {course.matiere} · {course.niveau} · {STATUS_LABELS[course.status] || course.status}
                    </p>
                  </div>
                </div>

                {/* Compteurs + action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {course.errorsCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <XCircle className="w-3.5 h-3.5" />
                      {course.errorsCount} erreur{course.errorsCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {course.warningsCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {course.warningsCount} alerte{course.warningsCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {course.errorsCount === 0 && course.warningsCount === 0 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Parfait
                    </span>
                  )}
                  <Link
                    href={`/dashboard/cours/${course._id}/gestion`}
                    className="dash-button dash-button-secondary dash-button-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Corriger
                  </Link>
                </div>
              </div>

              {/* Détail des problèmes */}
              {course.issues.length > 0 && (
                <ul className="mt-3 pt-3 border-t border-[#e6e0d6] space-y-1.5">
                  {course.issues.slice(0, 3).map((issue) => (
                    <li key={issue.id} className="flex items-start gap-2 text-xs text-[#6b625c]">
                      {issue.status === "error" ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span>
                        <b className="text-[#1a1512]">{issue.label}</b> — {issue.advice}
                      </span>
                    </li>
                  ))}
                  {course.issues.length > 3 && (
                    <li className="text-xs text-[#97938e] pl-5">
                      + {course.issues.length - 3} autre{course.issues.length - 3 > 1 ? "s" : ""} problème
                      {course.issues.length - 3 > 1 ? "s" : ""} (voir l'onglet SEO du cours)
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
