"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  Library,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2,
  AlertCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import "../styles/dashboard-theme.css";

// Types
interface Contributor {
  _id: string;
  name: string;
  email: string;
  role: "Rédacteur" | "Correcteur" | "Helpeur" | "Modérateur" | "Admin";
  username: string;
  stats: {
    courses: number;
    lessons: number;
    exercises: number;
    quizzes: number;
    fiches: number;
    forumPosts: number;
    forumResponses: number;
  };
  lastActivity: string | null;
  activityScore: number;
  activityScoreLastMonth?: number;
  scoreEvolution?: number; // % vs mois dernier
}

interface GlobalStats {
  totalRedacteurs: number;
  totalCorrecteurs: number;
  totalHelpeurs: number;
  avgActivity: number;
}

// Couleurs selon le score d'activité
const getActivityColor = (score: number) => {
  if (score >= 80) return { bg: "bg-emerald-500", text: "text-emerald-600", label: "Très actif", light: "bg-emerald-50" };
  if (score >= 60) return { bg: "bg-blue-500", text: "text-blue-600", label: "Actif", light: "bg-blue-50" };
  if (score >= 40) return { bg: "bg-amber-500", text: "text-amber-600", label: "Moyen", light: "bg-amber-50" };
  if (score >= 20) return { bg: "bg-orange-500", text: "text-orange-600", label: "Faible", light: "bg-orange-50" };
  return { bg: "bg-red-500", text: "text-red-600", label: "Inactif", light: "bg-red-50" };
};

// Skeleton de la page
function StatisticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="dash-main-header">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="dash-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="dash-card p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="flex flex-wrap gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="dash-card overflow-hidden">
                  <Skeleton className="h-1 w-full" />
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="grid grid-cols-2 gap-2">
                      {[...Array(4)].map((_, k) => (
                        <Skeleton key={k} className="h-14 rounded-lg" />
                      ))}
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Formater la date relative
const formatRelativeTime = (dateString: string | null) => {
  if (!dateString) return "Jamais";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 60) return `Il y a ${diffInMins} min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays === 1) return "Hier";
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
  return `Il y a ${Math.floor(diffInDays / 30)} mois`;
};

export default function StatisticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"activity" | "name" | "role">("activity");

  const user = session?.user;

  // Rediriger si pas admin
  useEffect(() => {
    if (user && user.role !== "Admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Charger les vraies données
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/admin/contributors");
      
      if (!res.ok) {
        if (res.status === 403) {
          setError("Accès non autorisé. Vous devez être Admin.");
          return;
        }
        throw new Error("Erreur lors du chargement des données");
      }
      
      const data = await res.json();
      setContributors(data.contributors || []);
      setGlobalStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchData();
    }
  }, [user]);

  // Filtrer et trier
  const filteredContributors = contributors
    .filter((c) => filterRole === "all" || c.role === filterRole)
    .sort((a, b) => {
      if (sortBy === "activity") return b.activityScore - a.activityScore;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return 0;
    });

  // Grouper par rôle pour l'affichage
  const groupedByRole = {
    Rédacteur: filteredContributors.filter((c) => c.role === "Rédacteur"),
    Correcteur: filteredContributors.filter((c) => c.role === "Correcteur"),
    Helpeur: filteredContributors.filter((c) => c.role === "Helpeur"),
    Modérateur: filteredContributors.filter((c) => c.role === "Modérateur"),
  };

  if (loading) {
    return <StatisticsPageSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-[#37352f]">{error}</h2>
        <button 
          onClick={fetchData}
          className="dash-button dash-button-primary mt-4"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="dash-main-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="dash-main-title">Statistiques des bénévoles</h1>
            <p className="dash-main-subtitle">
              Organigramme et activité des bénévoles Workyt
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="dash-button dash-button-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats globales */}
      {globalStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dash-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#37352f]">{globalStats.totalRedacteurs}</p>
                <p className="text-sm text-[#6b6b6b]">Rédacteurs</p>
              </div>
            </div>
          </div>
          <div className="dash-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#37352f]">{globalStats.totalCorrecteurs}</p>
                <p className="text-sm text-[#6b6b6b]">Correcteurs</p>
              </div>
            </div>
          </div>
          <div className="dash-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#37352f]">{globalStats.totalHelpeurs}</p>
                <p className="text-sm text-[#6b6b6b]">Helpeurs</p>
              </div>
            </div>
          </div>
          <div className="dash-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#37352f]">{globalStats.avgActivity}%</p>
                <p className="text-sm text-[#6b6b6b]">Activité moyenne</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6b6b6b]" />
          <span className="text-sm text-[#6b6b6b]">Filtrer par rôle:</span>
          <select
            className="dash-input py-1 px-2 text-sm w-40"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Tous les rôles</option>
            <option value="Rédacteur">Rédacteurs</option>
            <option value="Correcteur">Correcteurs</option>
            <option value="Helpeur">Helpeurs</option>
            <option value="Modérateur">Modérateurs</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6b6b6b]">Trier par:</span>
          <select
            className="dash-input py-1 px-2 text-sm w-40"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="activity">Score d'activité</option>
            <option value="name">Nom</option>
            <option value="role">Rôle</option>
          </select>
        </div>
      </div>

      {/* Légende des couleurs */}
      <div className="dash-card p-4">
        <h3 className="text-sm font-semibold text-[#37352f] mb-3">Légende d&apos;activité</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { min: 80, label: "Très actif (80-100%)", color: "bg-emerald-500" },
            { min: 60, label: "Actif (60-79%)", color: "bg-blue-500" },
            { min: 40, label: "Moyen (40-59%)", color: "bg-amber-500" },
            { min: 20, label: "Faible (20-39%)", color: "bg-orange-500" },
            { min: 0, label: "Inactif (0-19%)", color: "bg-red-500" },
          ].map((item) => (
            <div key={item.min} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm text-[#6b6b6b]">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <p className="text-xs text-[#9ca3af]">
            Les <span className="text-emerald-600 font-medium">+X%</span> / <span className="text-red-600 font-medium">-X%</span> indiquent l&apos;évolution du score ce mois vs le mois dernier.
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-[#f1f1ef] transition-colors text-[#9ca3af] hover:text-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30"
                aria-label="Comment est calculé le pourcentage ?"
              >
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs p-4 text-left">
              <p className="font-semibold text-[#37352f] mb-2">Calcul du pourcentage d&apos;évolution</p>
              <p className="text-sm text-[#6b6b6b] mb-2">
                Le pourcentage compare le score de ce mois au score du mois dernier.
              </p>
              <p className="text-xs text-[#9ca3af] mb-3">
                Formule : ((score ce mois − score mois dernier) ÷ score mois dernier) × 100
              </p>
              <p className="text-xs font-medium text-[#37352f] mb-1">Points par contribution :</p>
              <ul className="text-xs text-[#6b6b6b] space-y-1">
                <li>• <strong>Rédacteur</strong> : cours 20 pts, leçons 1 pt, exercices 2 pts, fiches 3 pts</li>
                <li>• <strong>Correcteur</strong> : exercices 3 pts, cours 5 pts, leçons 2 pts, fiches 2 pts</li>
                <li>• <strong>Helpeur</strong> : fiches 5 pts, réponses forum 3 pts, exercices 2 pts</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Organigramme par rôle */}
      <div className="space-y-8">
        {/* Rédacteurs */}
        {groupedByRole.Rédacteur.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#37352f] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              Rédacteurs
              <span className="text-sm font-normal text-[#9ca3af]">
                ({groupedByRole.Rédacteur.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByRole.Rédacteur.map((contributor) => (
                <ContributorCard key={contributor._id} contributor={contributor} />
              ))}
            </div>
          </div>
        )}

        {/* Correcteurs */}
        {groupedByRole.Correcteur.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#37352f] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              Correcteurs
              <span className="text-sm font-normal text-[#9ca3af]">
                ({groupedByRole.Correcteur.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByRole.Correcteur.map((contributor) => (
                <ContributorCard key={contributor._id} contributor={contributor} />
              ))}
            </div>
          </div>
        )}

        {/* Helpeurs */}
        {groupedByRole.Helpeur.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#37352f] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              Helpeurs
              <span className="text-sm font-normal text-[#9ca3af]">
                ({groupedByRole.Helpeur.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByRole.Helpeur.map((contributor) => (
                <ContributorCard key={contributor._id} contributor={contributor} />
              ))}
            </div>
          </div>
        )}

        {/* Modérateurs */}
        {groupedByRole.Modérateur.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#37352f] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-red-600" />
              </div>
              Modérateurs
              <span className="text-sm font-normal text-[#9ca3af]">
                ({groupedByRole.Modérateur.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByRole.Modérateur.map((contributor) => (
                <ContributorCard key={contributor._id} contributor={contributor} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Carte d'un bénévole
function ContributorCard({ contributor }: { contributor: Contributor }) {
  const colors = getActivityColor(contributor.activityScore);
  
  // Déterminer les stats pertinentes selon le rôle
  const getRelevantStats = () => {
    switch (contributor.role) {
      case "Rédacteur":
        return [
          { icon: BookOpen, label: "Cours", value: contributor.stats.courses },
          { icon: FileText, label: "Leçons", value: contributor.stats.lessons },
          { icon: Library, label: "Exercices", value: contributor.stats.exercises },
          { icon: CircleDot, label: "Quiz", value: contributor.stats.quizzes },
        ];
      case "Correcteur":
        return [
          { icon: FileText, label: "Corrections", value: contributor.stats.exercises + contributor.stats.quizzes },
          { icon: BookOpen, label: "Cours revus", value: contributor.stats.courses },
          { icon: Library, label: "Leçons", value: contributor.stats.lessons },
        ];
      case "Helpeur":
        return [
          { icon: Library, label: "Fiches", value: contributor.stats.fiches },
          { icon: MessageSquare, label: "Réponses forum", value: contributor.stats.forumResponses },
          { icon: BookOpen, label: "Exercices", value: contributor.stats.exercises },
        ];
      case "Modérateur":
        return [
          { icon: BookOpen, label: "Cours", value: contributor.stats.courses },
          { icon: FileText, label: "Leçons", value: contributor.stats.lessons },
          { icon: Library, label: "Exercices", value: contributor.stats.exercises },
        ];
      default:
        return [];
    }
  };

  const stats = getRelevantStats();

  return (
    <div className="dash-card overflow-hidden hover:shadow-lg transition-shadow">
      {/* Barre de couleur selon l'activité */}
      <div className={`h-1 ${colors.bg}`} />
      
      <div className="p-4">
        {/* Header avec avatar */}
        <div className="flex items-start gap-3 mb-4">
          <ProfileAvatar
            username={contributor.name}
            userId={contributor._id}
            role={contributor.role}
            size="small"
            showPoints={false}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#37352f] truncate">
              {contributor.name}
            </h3>
            <p className="text-sm text-[#9ca3af] truncate">@{contributor.username}</p>
          </div>
        </div>

        {/* Badge d'activité + évolution */}
        <div className="flex items-center justify-between mb-4">
          <span className={`dash-badge ${colors.light} ${colors.text} border-0`}>
            {colors.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#37352f]">
              {contributor.activityScore}%
            </span>
            {contributor.scoreEvolution !== undefined && contributor.scoreEvolution !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  contributor.scoreEvolution > 0
                    ? "text-emerald-600"
                    : contributor.scoreEvolution < 0
                    ? "text-red-600"
                    : "text-[#9ca3af]"
                }`}
              >
                {contributor.scoreEvolution > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {contributor.scoreEvolution > 0 ? "+" : ""}
                {contributor.scoreEvolution}%
              </span>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full h-2 bg-[#f1f1ef] rounded-full overflow-hidden mb-4">
          <div
            className={`h-full ${colors.bg} transition-all duration-500`}
            style={{ width: `${contributor.activityScore}%` }}
          />
        </div>

        {/* Stats spécifiques au rôle */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-[#f7f6f3] rounded-lg">
              <stat.icon className="w-4 h-4 text-[#9ca3af]" />
              <div>
                <p className="text-sm font-semibold text-[#37352f]">{stat.value}</p>
                <p className="text-xs text-[#9ca3af]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dernière activité */}
        <p className="text-xs text-[#9ca3af] text-center">
          Dernière activité: {formatRelativeTime(contributor.lastActivity)}
        </p>
      </div>
    </div>
  );
}
