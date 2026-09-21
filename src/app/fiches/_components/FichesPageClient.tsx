"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, FileText, Sparkles, Bookmark, ArrowUpDown } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import { educationData, getSubjectIconComponent } from "@/data/educationData";
import { PAGE_CONTAINER } from "@/components/wk/primitives";
import { subjectToSlug } from "@/utils/subjectSlug";
import InfoDrawer from "@/app/fiches/_components/InfoDrawer";
import { FicheTile } from "./ficheUi";

interface Fiche {
    id: string;
    title: string;
    authors: { username: string; points: number; _id: string; role?: string };
    content: string;
    likes: number;
    comments: number;
    status: string;
    level: string;
    subject: string;
    createdAt: string;
}

const today = () => new Date().toISOString().split("T")[0];

/** Périodes proposées dans le filtre de date */
const PERIODS = [
    { label: "Toutes", range: () => ({ startDate: "", endDate: "" }) },
    { label: "Aujourd'hui", range: () => ({ startDate: today(), endDate: today() }) },
    { label: "Cette semaine", range: () => ({ startDate: new Date(Date.now() - new Date().getDay() * 86400000).toISOString().split("T")[0], endDate: today() }) },
    { label: "Ce mois", range: () => ({ startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], endDate: today() }) },
    { label: "Cette année", range: () => ({ startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], endDate: today() }) },
];

const SORTS = [
    { value: "recent", label: "Récentes" },
    { value: "popular", label: "Populaires" },
    { value: "comments", label: "Commentées" },
    { value: "oldest", label: "Anciennes" },
];

/**
 * Le catalogue des fiches : recherche, filtres (niveau, matière, période),
 * tri, pagination. Même mise en page que le forum et les cours.
 */
export default function FichesPageClient() {
    const [fiches, setFiches] = useState<Fiche[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [subject, setSubject] = useState("");
    const [level, setLevel] = useState("");
    const [period, setPeriod] = useState("Toutes");
    const [sortBy, setSortBy] = useState("recent");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        let alive = true;
        const { startDate, endDate } = (PERIODS.find((p) => p.label === period) || PERIODS[0]).range();
        const params = new URLSearchParams({ query, level, subject, startDate, endDate, page: String(page) });

        fetch(`/api/fiches/search?${params}`)
            .then((r) => r.json())
            .then((data) => {
                if (!alive) return;
                if (!data.success) {
                    setError("Erreur lors de la récupération des fiches.");
                    return;
                }
                setError(null);
                setFiches(data.data);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(typeof data.pagination?.total === "number" ? data.pagination.total : null);
            })
            .catch(() => alive && setError("Erreur lors de la récupération des données."))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [query, level, subject, period, page]);

    // Le tri porte sur la page affichée (l'API renvoie les plus récentes d'abord)
    const sorted = [...fiches].sort((a, b) => {
        switch (sortBy) {
            case "popular": return b.likes - a.likes;
            case "comments": return b.comments - a.comments;
            case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const change = (fn: () => void) => {
        setLoading(true);
        fn();
        setPage(1);
    };

    // Recherche en direct, avec un léger délai pour ne pas interroger l'API à chaque touche
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onSearch = (value: string) => {
        setSearch(value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => change(() => setQuery(value.trim())), 350);
    };
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const goTo = (p: number) => {
        setLoading(true);
        setPage(p);
        document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const activeCount = [subject, level, period !== "Toutes" ? period : ""].filter(Boolean).length;
    const hasFilters = activeCount > 0 || !!query;
    const clearAll = () =>
        change(() => {
            setSearch("");
            setQuery("");
            setSubject("");
            setLevel("");
            setPeriod("Toutes");
        });

    const filters = (
        <Filters
            subject={subject}
            level={level}
            period={period}
            sortBy={sortBy}
            onSubject={(v) => change(() => setSubject(v))}
            onLevel={(v) => change(() => setLevel(v))}
            onPeriod={(v) => change(() => setPeriod(v))}
            onSort={setSortBy}
        />
    );

    return (
        <div id="catalogue" className={`${PAGE_CONTAINER} scroll-mt-20 py-8 md:py-10`}>
            {/* Recherche */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(26,21,18,0.4)]" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (timer.current) clearTimeout(timer.current);
                                change(() => setQuery(search.trim()));
                            }
                        }}
                        placeholder="Rechercher une fiche… (ex. Pythagore, guerre froide, subjonctif)"
                        aria-label="Rechercher une fiche"
                        className="w-full rounded-full border border-[rgba(26,21,18,0.12)] bg-white py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-[var(--wk-accent)] focus:ring-4 focus:ring-[rgba(255,106,26,0.12)]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearch("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(26,21,18,0.4)] hover:text-[var(--wk-ink)]"
                            aria-label="Effacer la recherche"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    aria-expanded={showFilters}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition lg:hidden ${
                        showFilters || activeCount > 0
                            ? "border-[var(--wk-accent)] bg-[rgba(255,106,26,0.08)] text-[#c24a0a]"
                            : "border-[rgba(26,21,18,0.12)] bg-white"
                    }`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtres
                    {activeCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wk-accent)] text-xs text-white">{activeCount}</span>
                    )}
                </button>
            </div>

            {showFilters && <div className="mt-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 lg:hidden">{filters}</div>}

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
                <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-6">{filters}</div>
                </aside>

                <section aria-label="Fiches de révision" className="min-w-0">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <span className="mr-2 text-sm text-[rgba(26,21,18,0.6)]">
                            {loading ? "Chargement…" : total !== null ? `${total.toLocaleString("fr-FR")} fiche${total > 1 ? "s" : ""}` : ""}
                        </span>
                        {query && <ActiveChip label={`« ${query} »`} onClear={() => onSearch("")} />}
                        {subject && <ActiveChip label={subject} onClear={() => change(() => setSubject(""))} />}
                        {level && <ActiveChip label={level} onClear={() => change(() => setLevel(""))} />}
                        {period !== "Toutes" && <ActiveChip label={period} onClear={() => change(() => setPeriod("Toutes"))} />}
                        {hasFilters && (
                            <button type="button" onClick={clearAll} className="text-xs font-semibold text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-accent)]">
                                Tout effacer
                            </button>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                            {subject && (
                                <Link href={`/fiches/matiere/${subjectToSlug(subject)}`} className="mr-2 text-xs font-semibold text-[var(--wk-accent)] hover:underline">
                                    Page {subject} →
                                </Link>
                            )}
                            <Link href="/fiches/favoris" className="wk-chip !py-1.5 transition hover:border-[var(--wk-accent)]">
                                <Bookmark className="h-3.5 w-3.5" /> Mes favoris
                            </Link>
                            <InfoDrawer />
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[240px] animate-pulse rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">{error}</div>
                    ) : sorted.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                            {sorted.map((f) => (
                                <FicheTile
                                    key={f.id}
                                    f={{ id: f.id, title: f.title, subject: f.subject, level: f.level, status: f.status, content: f.content, likes: f.likes, comments: f.comments }}
                                    author={
                                        <>
                                            <ProfileAvatar username={f.authors?.username || "Inconnu"} points={f.authors?.points || 0} userId={f.authors?._id} size="small" />
                                            <span className="truncate text-xs font-semibold text-[rgba(26,21,18,0.7)]">{f.authors?.username || "Inconnu"}</span>
                                        </>
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-16 text-center">
                            <FileText className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                            <h3 className="font-serif-display mt-4 text-2xl">Aucune fiche ne correspond</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[rgba(26,21,18,0.6)]">
                                Essaie d&apos;autres mots ou d&apos;autres filtres — ou dépose la première fiche sur le sujet.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {hasFilters && (
                                    <button type="button" onClick={clearAll} className="wk-btn-ghost !py-2.5 text-sm">Effacer les filtres</button>
                                )}
                                <Link href="/fiches/creer" className="wk-btn-orange !py-2.5 text-sm">Déposer une fiche</Link>
                            </div>
                        </div>
                    )}

                    {!loading && sorted.length > 0 && totalPages > 1 && (
                        <nav className="mt-10 flex items-center justify-center gap-1 border-t border-[rgba(26,21,18,0.08)] pt-8" aria-label="Pagination">
                            <button
                                type="button"
                                onClick={() => goTo(Math.max(page - 1, 1))}
                                disabled={page <= 1}
                                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Précédent</span>
                            </button>
                            <div className="flex items-center gap-1 px-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1.5 text-[rgba(26,21,18,0.3)]">…</span>}
                                            <button
                                                type="button"
                                                onClick={() => goTo(p)}
                                                aria-current={page === p ? "page" : undefined}
                                                className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                                                    page === p ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]" : "hover:bg-white"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => goTo(Math.min(page + 1, totalPages))}
                                disabled={page >= totalPages}
                                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span className="hidden sm:inline">Suivant</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </nav>
                    )}
                </section>
            </div>
        </div>
    );
}

function Filters({
    subject,
    level,
    period,
    sortBy,
    onSubject,
    onLevel,
    onPeriod,
    onSort,
}: {
    subject: string;
    level: string;
    period: string;
    sortBy: string;
    onSubject: (v: string) => void;
    onLevel: (v: string) => void;
    onPeriod: (v: string) => void;
    onSort: (v: string) => void;
}) {
    const title = "font-mono-ui mb-2.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]";
    return (
        <div className="space-y-6">
            <div>
                <div className={title}><ArrowUpDown className="h-3 w-3" /> Trier par</div>
                <div className="flex flex-wrap gap-1.5">
                    {SORTS.map((s) => (
                        <Pill key={s.value} active={sortBy === s.value} onClick={() => onSort(s.value)}>{s.label}</Pill>
                    ))}
                </div>
            </div>
            <div>
                <div className={title}>Période</div>
                <div className="flex flex-wrap gap-1.5">
                    {PERIODS.map((p) => (
                        <Pill key={p.label} active={period === p.label} onClick={() => onPeriod(p.label)}>{p.label}</Pill>
                    ))}
                </div>
            </div>
            <div>
                <div className={title}>Niveau</div>
                <div className="flex flex-wrap gap-1.5">
                    <Pill active={!level} onClick={() => onLevel("")}>Tous</Pill>
                    {educationData.levels.map((l) => (
                        <Pill key={l} active={level === l} onClick={() => onLevel(l)}>{l}</Pill>
                    ))}
                </div>
            </div>
            <div>
                <div className={title}>Matière</div>
                <ul className="max-h-[340px] space-y-0.5 overflow-y-auto pr-1">
                    <li>
                        <SubjectRow active={!subject} onClick={() => onSubject("")} label="Toutes les matières" />
                    </li>
                    {educationData.subjects.map((s) => (
                        <li key={s}>
                            <SubjectRow active={subject === s} onClick={() => onSubject(s)} label={s} subject={s} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                    ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                    : "border-[rgba(26,21,18,0.12)] bg-white text-[rgba(26,21,18,0.75)] hover:border-[rgba(26,21,18,0.3)]"
            }`}
        >
            {children}
        </button>
    );
}

function SubjectRow({ active, onClick, label, subject }: { active: boolean; onClick: () => void; label: string; subject?: string }) {
    const icon = subject ? getSubjectIconComponent(subject) : Sparkles;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                active ? "bg-white font-semibold text-[var(--wk-ink)] shadow-[0_2px_10px_rgba(26,21,18,0.06)]" : "text-[rgba(26,21,18,0.7)] hover:bg-white/70"
            }`}
        >
            {React.createElement(icon, { className: `h-4 w-4 shrink-0 ${active ? "text-[var(--wk-accent)]" : "text-[rgba(26,21,18,0.4)]"}` })}
            <span className="truncate">{label}</span>
        </button>
    );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span className="wk-chip">
            {label}
            <button type="button" onClick={onClear} className="text-[rgba(26,21,18,0.5)] hover:text-[var(--wk-ink)]" aria-label={`Retirer ${label}`}>
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}
