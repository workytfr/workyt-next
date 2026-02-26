"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Layers,
  Users,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trophy,
  PenTool,
  Video,
  TrendingUp,
} from "lucide-react";
import "./styles/dashboard-theme.css";

interface DashboardStats {
  courses: {
    total: number;
    published: number;
    pending: number;
    cancelled: number;
    byLevel: Record<string, number>;
    bySubject: Record<string, number>;
  };
  sections: { total: number };
  lessons: {
    total: number;
    validated: number;
    pending: number;
    draft: number;
    withMedia: number;
    recent: number;
    byStatus: Record<string, number>;
  };
  exercises: { total: number };
  quizzes: { total: number };
  users: { total: number };
  my: {
    courses: number;
    lessons: number;
    exercises: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.accessToken) return;
      try {
        const res = await fetch("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.ok) {
          setStats(await res.json());
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  const quickActions = [
    {
      title: "Créer un cours",
      description: "Ajouter un nouveau cours à la plateforme",
      icon: Plus,
      href: "/dashboard/cours/nouveau",
      color: "primary",
    },
    {
      title: "Générer avec MaitreRenardAI",
      description: "Créer un cours automatiquement avec un script Workyt",
      icon: Sparkles,
      href: "/cours/generer",
      color: "accent",
      external: true,
    },
    {
      title: "Gérer les leçons",
      description: "Modifier ou créer des leçons",
      icon: FileText,
      href: "/dashboard/lessons",
      color: "secondary",
    },
  ];

  // Top subjects sorted by count
  const topSubjects = stats
    ? Object.entries(stats.courses.bySubject)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  // Lesson status breakdown for progress bars
  const lessonStatuses = stats
    ? [
        { label: "Validées", count: stats.lessons.validated, color: "bg-emerald-500" },
        { label: "En attente", count: stats.lessons.pending, color: "bg-amber-500" },
        { label: "Brouillons", count: stats.lessons.draft, color: "bg-gray-400" },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <div className="dash-main-header">
        <h1 className="dash-main-title">
          Bonjour, {session?.user?.username || "Rédacteur"} !
        </h1>
        <p className="dash-main-subtitle">
          Voici un aperçu de l&apos;activité sur la plateforme et de vos contributions.
        </p>
      </div>

      {error && !stats && (
        <div className="dash-card p-6 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-400 mb-2" />
          <p className="text-[#6b6b6b]">Impossible de charger les statistiques.</p>
        </div>
      )}

      {/* Stats globales - grille principale */}
      {stats && (
        <div className="dash-stat-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-icon primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{stats.courses.total}</div>
              <div className="dash-stat-label">Cours</div>
              <div className="dash-stat-change positive">
                {stats.courses.published} publiés
              </div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon info">
              <Layers className="w-6 h-6" />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{stats.sections.total}</div>
              <div className="dash-stat-label">Sections</div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon success">
              <FileText className="w-6 h-6" />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{stats.lessons.total}</div>
              <div className="dash-stat-label">Leçons</div>
              <div className="dash-stat-change positive">
                +{stats.lessons.recent} ce mois
              </div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon warning">
              <PenTool className="w-6 h-6" />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{stats.exercises.total}</div>
              <div className="dash-stat-label">Exercices</div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon primary">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{stats.quizzes.total}</div>
              <div className="dash-stat-label">Quiz</div>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon info">
              <Users className="w-6 h-6" />
            </div>
            <div className="dash-stat-content">
              <div className="dash-stat-value">{stats.users.total}</div>
              <div className="dash-stat-label">Utilisateurs</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div>
        <h2 className="text-lg font-semibold text-[#37352f] mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              target={action.external ? "_blank" : undefined}
              className="dash-card dash-card-interactive p-6 group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    action.color === "primary"
                      ? "bg-[#fff7ed] text-[#f97316]"
                      : action.color === "accent"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-[#f7f6f3] text-[#6b6b6b]"
                  }`}
                >
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#37352f] group-hover:text-[#f97316] transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-[#6b6b6b] mt-1">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#bfbfbf] group-hover:text-[#f97316] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Grille détails */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statut des leçons */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Statut des leçons</h3>
              <Link
                href="/dashboard/lessons"
                className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
              >
                Voir tout
              </Link>
            </div>
            <div className="dash-card-body space-y-4">
              {lessonStatuses.map((s) => {
                const pct = stats.lessons.total > 0
                  ? Math.round((s.count / stats.lessons.total) * 100)
                  : 0;
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#37352f]">{s.label}</span>
                      <span className="text-sm text-[#6b6b6b]">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#f1f1ef] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.lessons.withMedia > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#f1f1ef]">
                  <Video className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-[#6b6b6b]">
                    {stats.lessons.withMedia} leçons avec média
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cours par matière */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Cours par matière</h3>
              <Link
                href="/dashboard/cours"
                className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
              >
                Voir tout
              </Link>
            </div>
            <div className="dash-card-body space-y-3">
              {topSubjects.length > 0 ? (
                topSubjects.map(([subject, count]) => {
                  const pct = stats.courses.total > 0
                    ? Math.round((count / stats.courses.total) * 100)
                    : 0;
                  return (
                    <div key={subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#37352f]">{subject}</span>
                        <span className="text-sm text-[#6b6b6b]">{count} cours</span>
                      </div>
                      <div className="w-full h-2 bg-[#f1f1ef] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#f97316] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[#9ca3af] text-center py-4">Aucune donnée</p>
              )}
            </div>
          </div>

          {/* Mes contributions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Mes contributions</h3>
              <Link
                href="/dashboard/cours"
                className="text-sm text-[#f97316] hover:text-[#ea580c] font-medium"
              >
                Voir mes cours
              </Link>
            </div>
            <div className="dash-card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#f7f6f3] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fff7ed] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#f97316]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#37352f]">Mes cours</p>
                      <p className="text-sm text-[#6b6b6b]">
                        {stats.my.courses} cours créés
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/cours"
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 text-[#6b6b6b]" />
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#f7f6f3] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ecfdf5] rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#10b981]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#37352f]">Mes leçons</p>
                      <p className="text-sm text-[#6b6b6b]">
                        {stats.my.lessons} leçons rédigées
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/lessons"
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 text-[#6b6b6b]" />
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#f7f6f3] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fef3c7] rounded-lg flex items-center justify-center">
                      <PenTool className="w-5 h-5 text-[#f59e0b]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#37352f]">Mes exercices</p>
                      <p className="text-sm text-[#6b6b6b]">
                        {stats.my.exercises} exercices créés
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/exercises"
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 text-[#6b6b6b]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Cours en attente */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">État des cours</h3>
            </div>
            <div className="dash-card-body">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ecfdf5]">
                  <CheckCircle className="w-5 h-5 text-[#10b981]" />
                  <span className="text-sm font-medium text-[#37352f]">
                    {stats.courses.published} cours publiés
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#fffbeb]">
                  <Clock className="w-5 h-5 text-[#f59e0b]" />
                  <span className="text-sm font-medium text-[#37352f]">
                    {stats.courses.pending} cours en attente de validation
                  </span>
                </div>
                {stats.courses.cancelled > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#fef2f2]">
                    <AlertCircle className="w-5 h-5 text-[#ef4444]" />
                    <span className="text-sm font-medium text-[#37352f]">
                      {stats.courses.cancelled} cours annulés
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
