"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, BookOpen, Sparkles, HeartHandshake } from "lucide-react";
import { educationData, getSubjectIconComponent } from "@/data/educationData";
import { PAGE_CONTAINER } from "@/components/wk/primitives";
import { subjectToSlug } from "@/utils/subjectSlug";
import CourseCard from "./CourseCard";
import { CourseListing } from "./types";

const PAGE_SIZE = 12;

/**
 * Le catalogue des cours : recherche, filtres matière / niveau, pagination.
 * Même mise en page que le forum : filtres en colonne à gauche, grille qui
 * occupe toute la largeur utile.
 */
export default function CoursesPageClient() {
    const [courses, setCourses] = useState<CourseListing[]>([]);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [subject, setSubject] = useState("");
    const [level, setLevel] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        let alive = true;
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (query) params.set("search", query);
        if (subject) params.set("matiere", subject);
        if (level) params.set("niveau", level);

        fetch(`/api/cours?${params}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                if (!alive) return;
                setCourses(Array.isArray(data.courses) ? data.courses : []);
                setTotal(typeof data.total === "number" ? data.total : 0);
            })
            .catch((error) => console.error("Erreur lors de la récupération des cours :", error))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [page, query, subject, level]);

    const totalPages = total ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

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

    const activeCount = [subject, level].filter(Boolean).length;
    const hasFilters = activeCount > 0 || !!query;
    const clearAll = () =>
        change(() => {
            setSearch("");
            setQuery("");
            setSubject("");
            setLevel("");
        });

    const filters = <Filters subject={subject} level={level} onSubject={(v) => change(() => setSubject(v))} onLevel={(v) => change(() => setLevel(v))} />;

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
                        placeholder="Rechercher un cours… (ex. fonctions, Révolution française, cellule)"
                        aria-label="Rechercher un cours"
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
                    <div className="sticky top-24 space-y-6">
                        {filters}
                        <Link
                            href="/suivi"
                            className="group flex items-start gap-3 rounded-3xl bg-[var(--wk-paper-2)] p-4 text-sm transition hover:bg-[#efe5d4]"
                        >
                            <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[var(--wk-accent)]" />
                            <span>
                                <strong className="block">Perdu dans un chapitre ?</strong>
                                <span className="text-[rgba(26,21,18,0.65)]">Un bénévole peut t&apos;accompagner et choisir les cours pour toi.</span>
                            </span>
                        </Link>
                    </div>
                </aside>

                <section aria-label="Cours" className="min-w-0">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <span className="mr-2 text-sm text-[rgba(26,21,18,0.6)]">
                            {loading ? "Chargement…" : `${(total ?? 0).toLocaleString("fr-FR")} cours`}
                        </span>
                        {query && <ActiveChip label={`« ${query} »`} onClear={() => onSearch("")} />}
                        {subject && <ActiveChip label={subject} onClear={() => change(() => setSubject(""))} />}
                        {level && <ActiveChip label={level} onClear={() => change(() => setLevel(""))} />}
                        {hasFilters && (
                            <button type="button" onClick={clearAll} className="text-xs font-semibold text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-accent)]">
                                Tout effacer
                            </button>
                        )}
                        {subject && (
                            <Link href={`/cours/matiere/${subjectToSlug(subject)}`} className="ml-auto text-xs font-semibold text-[var(--wk-accent)] hover:underline">
                                Page {subject} →
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[420px] animate-pulse rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70" />
                            ))}
                        </div>
                    ) : courses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                            {courses.map((c) => (
                                <CourseCard key={c._id} course={c} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-16 text-center">
                            <BookOpen className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                            <h3 className="font-serif-display mt-4 text-2xl">Aucun cours ne correspond</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[rgba(26,21,18,0.6)]">
                                Essaie d&apos;autres mots ou d&apos;autres filtres. Et si tu cherches de l&apos;aide sur un point précis, le forum est là.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {hasFilters && (
                                    <button type="button" onClick={clearAll} className="wk-btn-ghost !py-2.5 text-sm">Effacer les filtres</button>
                                )}
                                <Link href="/forum" className="wk-btn-orange !py-2.5 text-sm">Poser une question</Link>
                            </div>
                        </div>
                    )}

                    {!loading && courses.length > 0 && totalPages > 1 && (
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

function Filters({ subject, level, onSubject, onLevel }: { subject: string; level: string; onSubject: (v: string) => void; onLevel: (v: string) => void }) {
    const title = "font-mono-ui mb-2.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]";
    return (
        <div className="space-y-6">
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
                <ul className="max-h-[380px] space-y-0.5 overflow-y-auto pr-1">
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
