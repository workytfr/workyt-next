"use client";

import { hasRole } from "@/lib/userRoles";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Minus,
  Info,
  AlertCircle,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Flag,
  CalendarDays,
  Activity,
  BellRing,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import { Skeleton } from "@/components/ui/skeleton";
import "../styles/dashboard-theme.css";

// ─── Types ────────────────────────────────────────────────

type Role = "Rédacteur" | "Correcteur" | "Helpeur" | "Modérateur";
type Status = "tres_actif" | "actif" | "occasionnel" | "inactif" | "jamais";
type Key =
  | "courses"
  | "lessons"
  | "exercises"
  | "quizzes"
  | "fiches"
  | "coursesVerified"
  | "lessonsValidated"
  | "answers"
  | "answersValidated"
  | "mentorMessages"
  | "reportsHandled";
type Counts = Partial<Record<Key, number>>;

interface Contributor {
  _id: string;
  name: string;
  username: string;
  role: Role;
  joinedAt: string | null;
  status: Status;
  activeDays: number;
  previousActiveDays: number;
  contributions: number;
  previousContributions: number;
  period: Counts;
  lifetime: Counts;
  lifetimeContributions: number;
  activeMentorships: number;
  weekly: number[];
  lastActivity: string | null;
  lastActivityKind: Key | null;
}

interface Data {
  period: { days: number; from: string; to: string };
  contributors: Contributor[];
  summary: {
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    contributions: number;
    previousContributions: number;
    activeMentorships: number;
  };
}

type SortKey = "activity" | "contributions" | "recent" | "name";

// ─── Libellés ─────────────────────────────────────────────

const ROLES: Role[] = ["Helpeur", "Rédacteur", "Correcteur", "Modérateur"];

const ROLE_ICON: Record<Role, LucideIcon> = {
  Rédacteur: BookOpen,
  Correcteur: FileText,
  Helpeur: MessageSquare,
  Modérateur: ShieldCheck,
};

const STATUS: Record<Status, { label: string; hint: string; color: string; badge: string }> = {
  tres_actif: { label: "Très actif", hint: "8 jours actifs ou plus par mois", color: "var(--dash-success)", badge: "dash-badge-success" },
  actif: { label: "Actif", hint: "3 à 7 jours actifs par mois", color: "var(--dash-info)", badge: "dash-badge-info" },
  occasionnel: { label: "Occasionnel", hint: "1 ou 2 jours actifs par mois", color: "var(--dash-warning)", badge: "dash-badge-warning" },
  inactif: { label: "Inactif", hint: "A déjà contribué, rien sur la période", color: "var(--dash-danger)", badge: "dash-badge-danger" },
  jamais: { label: "Jamais contribué", hint: "Aucune contribution depuis son arrivée", color: "var(--dash-text-muted)", badge: "" },
};
const STATUS_ORDER: Status[] = ["tres_actif", "actif", "occasionnel", "inactif", "jamais"];

const KINDS: Record<Key, { label: string; icon: LucideIcon; verb: string }> = {
  courses: { label: "Cours", icon: BookOpen, verb: "a créé un cours" },
  lessons: { label: "Leçons", icon: FileText, verb: "a écrit une leçon" },
  exercises: { label: "Exercices", icon: Library, verb: "a ajouté un exercice" },
  quizzes: { label: "Quiz", icon: CircleDot, verb: "a créé un quiz" },
  fiches: { label: "Fiches", icon: Library, verb: "a publié une fiche" },
  coursesVerified: { label: "Cours vérifiés", icon: CheckCircle2, verb: "a vérifié un cours" },
  lessonsValidated: { label: "Leçons validées", icon: CheckCircle2, verb: "a validé une leçon" },
  answers: { label: "Réponses forum", icon: MessageSquare, verb: "a répondu sur le forum" },
  answersValidated: { label: "Réponses validées", icon: CheckCircle2, verb: "" },
  mentorMessages: { label: "Messages de suivi", icon: HeartHandshake, verb: "a écrit dans un suivi" },
  reportsHandled: { label: "Signalements traités", icon: Flag, verb: "a traité un signalement" },
};

/** Ce qu'on met en avant pour chaque rôle — le reste reste visible dans le détail */
const ROLE_KEYS: Record<Role, Key[]> = {
  Rédacteur: ["courses", "lessons", "exercises", "quizzes"],
  Correcteur: ["lessonsValidated", "coursesVerified", "exercises", "fiches"],
  Helpeur: ["answers", "mentorMessages", "fiches", "exercises"],
  Modérateur: ["reportsHandled", "answers", "lessonsValidated", "mentorMessages"],
};

const SORTS: Record<SortKey, string> = {
  activity: "Régularité",
  contributions: "Contributions",
  recent: "Dernière activité",
  name: "Nom",
};

// ─── Utilitaires ──────────────────────────────────────────

function relative(iso: string | null) {
  if (!iso) return "Jamais";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  const y = Math.floor(days / 365);
  return `Il y a ${y} an${y > 1 ? "s" : ""}`;
}

/** Évolution en % ; null si rien à comparer */
function trend(now: number, before: number): number | null {
  if (!now && !before) return null;
  if (!before) return 100;
  return Math.round(((now - before) / before) * 100);
}

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

// ─── Page ─────────────────────────────────────────────────

export default function StatisticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;

  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("activity");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (user && !hasRole(user, "Admin")) router.push("/dashboard");
  }, [user, router]);

  const fetchData = useCallback(async (period: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contributors?days=${period}`, { cache: "no-store" });
      if (res.status === 403) throw new Error("Accès non autorisé. Vous devez être Admin.");
      if (!res.ok) throw new Error("Erreur lors du chargement des données");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasRole(user, "Admin")) void fetchData(days);
  }, [user, days, fetchData]);

  const list = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.contributors
      .filter((c) => role === "all" || c.role === role)
      .filter((c) => status === "all" || c.status === status)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "contributions") return b.contributions - a.contributions;
        const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        if (sort === "recent") return tb - ta;
        return b.activeDays - a.activeDays || b.contributions - a.contributions || tb - ta;
      });
  }, [data, role, status, query, sort]);

  if (loading && !data) return <StatisticsPageSkeleton />;

  if (error && !data) {
    return (
      <div className="dash-card mx-auto max-w-md p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-[var(--dash-danger)]" />
        <h2 className="text-lg font-semibold text-[var(--dash-text)]">{error}</h2>
        <button onClick={() => fetchData(days)} className="dash-button dash-button-primary mt-4">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;
  const { summary } = data;
  const active = (summary.byStatus.tres_actif || 0) + (summary.byStatus.actif || 0) + (summary.byStatus.occasionnel || 0);
  const toFollow = data.contributors.filter((c) => c.status === "inactif");
  const globalTrend = trend(summary.contributions, summary.previousContributions);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="dash-main-header">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="dash-main-title">Statistiques des bénévoles</h1>
            <p className="dash-main-subtitle">
              Qui fait vivre Workyt, et à quel rythme : les {data.period.days} derniers jours comparés aux {data.period.days} précédents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-[var(--dash-radius-md)] border border-[var(--dash-border)] bg-[var(--dash-bg)] p-1" role="group" aria-label="Période">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  aria-pressed={days === d}
                  className={`rounded-[var(--dash-radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors ${
                    days === d ? "bg-[var(--dash-ink)] text-[var(--dash-on-ink)]" : "text-[var(--dash-text-secondary)] hover:bg-[var(--dash-bg-hover)]"
                  }`}
                >
                  {d} j
                </button>
              ))}
            </div>
            <button onClick={() => fetchData(days)} className="dash-button dash-button-secondary" disabled={loading} aria-label="Actualiser">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KeyFigure
          icon={Users}
          value={summary.total}
          label="bénévoles"
          hint={ROLES.filter((r) => summary.byRole[r]).map((r) => `${summary.byRole[r]} ${r.toLowerCase()}${summary.byRole[r] > 1 ? "s" : ""}`).join(" · ")}
        />
        <KeyFigure
          icon={Activity}
          value={`${summary.total ? Math.round((active / summary.total) * 100) : 0} %`}
          label="ont contribué sur la période"
          hint={`${active} sur ${summary.total}`}
        />
        <KeyFigure
          icon={TrendingUp}
          value={summary.contributions}
          label="contributions"
          hint={`${summary.previousContributions} sur la période précédente`}
          trendValue={globalTrend}
        />
        <KeyFigure
          icon={BellRing}
          value={toFollow.length}
          label="à relancer"
          hint="Ont déjà contribué, plus rien depuis"
          alert={toFollow.length > 0}
          onClick={toFollow.length ? () => setStatus("inactif") : undefined}
        />
      </div>

      {/* Répartition par niveau d'activité */}
      <section className="dash-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--dash-text)]">Répartition de l&apos;activité</h2>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
            aria-expanded={showHelp}
          >
            <Info className="h-3.5 w-3.5" />
            Comment c&apos;est calculé
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showHelp ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-[var(--dash-bg-secondary)]">
          {STATUS_ORDER.map((s) =>
            summary.byStatus[s] ? (
              <div key={s} style={{ width: `${(summary.byStatus[s] / summary.total) * 100}%`, background: STATUS[s].color }} title={`${STATUS[s].label} : ${summary.byStatus[s]}`} />
            ) : null
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(status === s ? "all" : s)}
              aria-pressed={status === s}
              title={STATUS[s].hint}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === s
                  ? "border-[var(--dash-ink)] bg-[var(--dash-ink)] text-[var(--dash-on-ink)]"
                  : "border-[var(--dash-border)] text-[var(--dash-text-secondary)] hover:border-[var(--dash-border-hover)]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS[s].color }} />
              {STATUS[s].label}
              <span className="opacity-70">{summary.byStatus[s] || 0}</span>
            </button>
          ))}
        </div>
        {showHelp && (
          <div className="mt-4 grid gap-3 rounded-[var(--dash-radius-md)] bg-[var(--dash-bg-secondary)] p-4 text-xs leading-relaxed text-[var(--dash-text-secondary)] md:grid-cols-2">
            <p>
              <strong className="text-[var(--dash-text)]">Le niveau mesure la régularité, pas le volume.</strong> On compte les jours où la personne a
              contribué pendant la période, ramenés à un mois : 8 jours ou plus, très actif ; 3 à 7, actif ; 1 ou 2, occasionnel. Dix leçons publiées le
              même soir comptent pour un jour.
            </p>
            <p>
              <strong className="text-[var(--dash-text)]">Tout compte, quel que soit le rôle :</strong> cours, leçons, exercices, quiz, fiches, relecture
              (leçons validées, cours vérifiés), réponses sur le forum, messages dans les suivis et signalements traités. La tendance compare le nombre de
              contributions à celui de la période précédente de même durée.
            </p>
          </div>
        )}
      </section>

      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <RoleChip label="Tous" count={summary.total} active={role === "all"} onClick={() => setRole("all")} />
          {ROLES.map((r) => (
            <RoleChip key={r} label={`${r}s`} icon={ROLE_ICON[r]} count={summary.byRole[r] || 0} active={role === r} onClick={() => setRole(role === r ? "all" : r)} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-text-tertiary)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un bénévole"
              className="dash-input w-56 py-1.5 pl-9 text-sm"
              aria-label="Rechercher un bénévole"
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="dash-input w-auto py-1.5 text-sm" aria-label="Trier par">
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                Trier : {SORTS[k]}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <button type="button" onClick={() => setView("cards")} aria-label="Vue en cartes" aria-pressed={view === "cards"} className={`dash-button ${view === "cards" ? "dash-button-primary" : "dash-button-secondary"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView("table")} aria-label="Vue en tableau" aria-pressed={view === "table"} className={`dash-button ${view === "table" ? "dash-button-primary" : "dash-button-secondary"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste */}
      {list.length === 0 ? (
        <div className="dash-card">
          <div className="dash-empty">
            <Users className="mx-auto mb-3 h-8 w-8 text-[var(--dash-text-tertiary)]" />
            <p className="dash-empty-title">Aucun bénévole ne correspond</p>
            <button
              type="button"
              className="dash-button dash-button-secondary mt-4"
              onClick={() => {
                setRole("all");
                setStatus("all");
                setQuery("");
              }}
            >
              Effacer les filtres
            </button>
          </div>
        </div>
      ) : view === "table" ? (
        <ContributorTable list={list} days={data.period.days} />
      ) : (
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {list.map((c) => (
            <ContributorCard key={c._id} c={c} days={data.period.days} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composants ───────────────────────────────────────────

function KeyFigure({
  icon: Icon,
  value,
  label,
  hint,
  trendValue,
  alert,
  onClick,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  hint?: string;
  trendValue?: number | null;
  alert?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[var(--dash-radius-md)] ${
            alert ? "bg-[var(--dash-warning-light)] text-[var(--dash-warning)]" : "bg-[var(--dash-accent-light)] text-[var(--dash-accent-hover)]"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {trendValue !== undefined && <Trend value={trendValue} />}
      </div>
      <p className="mt-3 font-[family-name:var(--dash-font-display)] text-3xl font-bold text-[var(--dash-text)]">{value}</p>
      <p className="text-sm font-medium text-[var(--dash-text-secondary)]">{label}</p>
      {hint && <p className="mt-1 text-xs text-[var(--dash-text-tertiary)]">{hint}</p>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="dash-card dash-card-interactive p-4 text-left">
      {body}
    </button>
  ) : (
    <div className="dash-card p-4">{body}</div>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-[var(--dash-text-tertiary)]">—</span>;
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const color = value > 0 ? "text-[var(--dash-success)]" : value < 0 ? "text-[var(--dash-danger)]" : "text-[var(--dash-text-tertiary)]";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${color}`} title="Par rapport à la période précédente">
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}
      {value} %
    </span>
  );
}

function RoleChip({ label, count, active, icon: Icon, onClick }: { label: string; count: number; active: boolean; icon?: LucideIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--dash-accent)] bg-[var(--dash-accent-light)] text-[var(--dash-accent-hover)]"
          : "border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text-secondary)] hover:border-[var(--dash-border-hover)]"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}

/** Contributions par semaine sur 12 semaines — la dernière barre est la semaine en cours */
function Sparkline({ weeks }: { weeks: number[] }) {
  const max = Math.max(1, ...weeks);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-label="Contributions par semaine, 12 dernières semaines">
      {weeks.map((n, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          title={`${i === weeks.length - 1 ? "7 derniers jours" : `Il y a ${weeks.length - 1 - i} sem.`} : ${plural(n, "contribution")}`}
          style={{
            height: n ? `${Math.max(12, (n / max) * 100)}%` : "3px",
            background: n ? (i === weeks.length - 1 ? "var(--dash-accent)" : "var(--dash-accent-hover)") : "var(--dash-border)",
            opacity: n ? 0.55 + 0.45 * (n / max) : 1,
          }}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`dash-badge ${STATUS[status].badge}`} title={STATUS[status].hint}>
      <span className="mr-1.5 h-2 w-2 rounded-full" style={{ background: STATUS[status].color }} />
      {STATUS[status].label}
    </span>
  );
}

function ContributorCard({ c, days }: { c: Contributor; days: number }) {
  const RoleIcon = ROLE_ICON[c.role] || Users;
  const keys = ROLE_KEYS[c.role] || [];
  const extra = (Object.keys(c.period) as Key[]).filter((k) => !keys.includes(k) && k !== "answersValidated" && c.period[k]);

  return (
    <article className="dash-card flex flex-col p-5 transition-shadow hover:shadow-[var(--dash-shadow-lg)]">
      <header className="flex items-start gap-3">
        <ProfileAvatar username={c.name} userId={c._id} role={c.role} size="small" showPoints={false} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--dash-text)]">{c.name}</h3>
          <p className="flex items-center gap-1 truncate text-xs text-[var(--dash-text-tertiary)]">
            <RoleIcon className="h-3 w-3" />
            {c.role} · @{c.username}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Figure value={`${c.activeDays}/${days}`} label="jours actifs" />
        <Figure value={c.contributions} label="contributions" trendValue={trend(c.contributions, c.previousContributions)} />
        <Figure value={c.lifetimeContributions} label="au total" />
      </div>

      <div className="mt-4">
        <Sparkline weeks={c.weekly} />
        <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--dash-text-tertiary)]">12 dernières semaines</p>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {keys.map((k) => {
          const K = KINDS[k];
          const sub = k === "answers" && c.lifetime.answersValidated ? ` · ${c.lifetime.answersValidated} validées` : "";
          return (
            <li key={k} className="flex items-center gap-2 rounded-[var(--dash-radius-md)] bg-[var(--dash-bg-secondary)] p-2">
              <K.icon className="h-4 w-4 shrink-0 text-[var(--dash-text-tertiary)]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--dash-text)]">
                  {c.period[k] || 0}
                  <span className="ml-1 text-xs font-normal text-[var(--dash-text-tertiary)]">/ {c.lifetime[k] || 0}</span>
                </p>
                <p className="truncate text-[11px] text-[var(--dash-text-secondary)]" title={`${K.label} : sur la période / au total${sub}`}>
                  {K.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {(extra.length > 0 || c.activeMentorships > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.activeMentorships > 0 && (
            <span className="dash-badge dash-badge-primary">
              <HeartHandshake className="mr-1 h-3 w-3" />
              {plural(c.activeMentorships, "suivi")} en cours
            </span>
          )}
          {extra.map((k) => (
            <span key={k} className="dash-badge">
              {c.period[k]} {KINDS[k].label.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      <footer className="mt-auto flex items-center gap-1.5 border-t border-[var(--dash-border-light)] pt-3 text-xs text-[var(--dash-text-tertiary)]" style={{ marginTop: "1rem" }}>
        <CalendarDays className="h-3.5 w-3.5" />
        {c.lastActivity ? (
          <span>
            {relative(c.lastActivity)}
            {c.lastActivityKind && KINDS[c.lastActivityKind].verb ? `, ${KINDS[c.lastActivityKind].verb}` : ""}
          </span>
        ) : (
          <span>Aucune contribution{c.joinedAt ? ` · arrivé ${relative(c.joinedAt).toLowerCase()}` : ""}</span>
        )}
      </footer>
    </article>
  );
}

function Figure({ value, label, trendValue }: { value: number | string; label: string; trendValue?: number | null }) {
  return (
    <div className="rounded-[var(--dash-radius-md)] border border-[var(--dash-border-light)] px-2 py-2">
      <p className="font-[family-name:var(--dash-font-display)] text-lg font-bold leading-tight text-[var(--dash-text)]">{value}</p>
      <p className="text-[11px] text-[var(--dash-text-tertiary)]">{label}</p>
      {trendValue !== undefined && trendValue !== null && (
        <div className="mt-0.5 flex justify-center">
          <Trend value={trendValue} />
        </div>
      )}
    </div>
  );
}

function ContributorTable({ list, days }: { list: Contributor[]; days: number }) {
  return (
    <div className="dash-table-container">
      <table className="dash-table">
        <thead>
          <tr>
            <th>Bénévole</th>
            <th>Rôle</th>
            <th>Niveau</th>
            <th>Jours actifs</th>
            <th>Contributions</th>
            <th>Tendance</th>
            <th>Suivis</th>
            <th>12 semaines</th>
            <th>Dernière activité</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c._id}>
              <td>
                <div className="font-medium text-[var(--dash-text)]">{c.name}</div>
                <div className="text-xs text-[var(--dash-text-tertiary)]">@{c.username}</div>
              </td>
              <td>{c.role}</td>
              <td>
                <StatusBadge status={c.status} />
              </td>
              <td>
                {c.activeDays}/{days}
              </td>
              <td>
                {c.contributions} <span className="text-xs text-[var(--dash-text-tertiary)]">/ {c.lifetimeContributions}</span>
              </td>
              <td>
                <Trend value={trend(c.contributions, c.previousContributions)} />
              </td>
              <td>{c.activeMentorships || "—"}</td>
              <td className="w-32">
                <Sparkline weeks={c.weekly} />
              </td>
              <td className="whitespace-nowrap">{relative(c.lastActivity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatisticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="dash-main-header">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="dash-card space-y-3 p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="dash-card space-y-3 p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="dash-card space-y-4 p-5">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-14 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
