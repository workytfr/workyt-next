"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Search,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    X,
    HelpCircle,
    BookOpen,
    Dumbbell,
    Sparkles,
    Coins,
    CheckCircle2,
    Lightbulb,
    HeartHandshake,
    MessageCircleQuestion,
} from "lucide-react";
import { educationData, getSubjectIconComponent } from "@/data/educationData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForumListRealtime } from "@/hooks/useForumListRealtime";
import { subjectToSlug } from "@/utils/subjectSlug";
import QuestionCard, { type ForumQuestion } from "./QuestionCard";
import { FORUM_CONTAINER, Eyebrow, EntryChoice, SuiviPromoCard, STATUS_META } from "./forumUi";

interface QuestionsResponse {
    success: boolean;
    data: ForumQuestion[];
    pagination: { totalPages: number; currentPage: number; totalQuestions: number };
}

const STATUS_OPTIONS = [
    { value: "", label: "Toutes" },
    { value: "Non validée", label: STATUS_META["Non validée"].label, dot: STATUS_META["Non validée"].dot },
    { value: "Validée", label: STATUS_META["Validée"].label, dot: STATUS_META["Validée"].dot },
    { value: "Résolue", label: STATUS_META["Résolue"].label, dot: STATUS_META["Résolue"].dot },
];

const CONTEXT_OPTIONS = [
    { value: "", label: "Tout" },
    { value: "lesson", label: "Leçons" },
    { value: "exercise", label: "Exercices" },
];

const PAGE_SIZE = 12;

const openAuth = () => window.dispatchEvent(new Event("workyt:open-auth"));

export default function ForumPageClient() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [questions, setQuestions] = useState<ForumQuestion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number | null>(null);
    const [search, setSearch] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [classLevel, setClassLevel] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
    const [contextFilter, setContextFilter] = useState<string>(searchParams.get("contextType") || "");
    const [contextIdFilter, setContextIdFilter] = useState<string>(searchParams.get("contextId") || "");
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Temps réel : nombre de nouvelles questions postées pendant la consultation
    const { newCount, reset } = useForumListRealtime();

    useEffect(() => {
        let alive = true;
        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
            title: query,
            subject,
            classLevel,
            status,
        });
        if (contextFilter) params.set("contextType", contextFilter);
        if (contextIdFilter) params.set("contextId", contextIdFilter);

        fetch(`/api/forum/questions?${params}`)
            .then((r) => r.json())
            .then((data: QuestionsResponse) => {
                if (!alive || !data.success) return;
                setQuestions(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(typeof data.pagination.totalQuestions === "number" ? data.pagination.totalQuestions : null);
            })
            .catch((error) => console.error("Erreur de récupération des questions", error))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [page, query, subject, classLevel, status, contextFilter, contextIdFilter, refreshKey]);

    const change = (fn: () => void) => {
        setLoading(true);
        fn();
        setPage(1);
    };

    // Recherche en direct, avec un léger délai pour ne pas interroger l'API à chaque touche
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onSearchInput = (value: string) => {
        setSearch(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            if (value.trim() !== query) change(() => setQuery(value.trim()));
        }, 350);
    };
    useEffect(() => () => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
    }, []);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (search.trim() !== query) change(() => setQuery(search.trim()));
    };

    const activeFilterCount = [subject, classLevel, status, contextFilter].filter(Boolean).length;
    const hasActiveFilters = activeFilterCount > 0 || !!query;

    const clearAll = () =>
        change(() => {
            setSearch("");
            setQuery("");
            setSubject("");
            setClassLevel("");
            setStatus("");
            setContextFilter("");
            setContextIdFilter("");
        });

    const goToPage = (p: number) => {
        setLoading(true);
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const filters = (
        <FiltersPanel
            subject={subject}
            classLevel={classLevel}
            status={status}
            contextFilter={contextFilter}
            onSubject={(v) => change(() => setSubject(v))}
            onLevel={(v) => change(() => setClassLevel(v))}
            onStatus={(v) => change(() => setStatus(v))}
            onContext={(v) =>
                change(() => {
                    setContextFilter(v);
                    setContextIdFilter("");
                })
            }
        />
    );

    // Bandeau « suivi » glissé après 6 questions (2 rangées de 3, 3 rangées de 2), en page 1
    const withPromo = page === 1 && questions.length > 6;

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            {/* ─── En-tête ─── */}
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${FORUM_CONTAINER} relative grid grid-cols-1 gap-10 pb-12 pt-12 md:pb-16 md:pt-16 lg:grid-cols-12 lg:items-end`}>
                    <div className="lg:col-span-7">
                        <Eyebrow>Forum d&apos;entraide</Eyebrow>
                        <h1 className="font-serif-display mt-5 text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.92]">
                            Une question ?
                            <br />
                            <span className="italic text-[rgba(26,21,18,0.45)]">La communauté répond</span>
                            <span className="text-[var(--wk-accent)]">.</span>
                        </h1>
                        <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                            Pose ta question, aide les autres et gagne des points. Et si tu bloques souvent, un
                            bénévole de l&apos;association peut t&apos;accompagner personnellement.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowInfoModal(true)}
                            className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(26,21,18,0.7)] hover:text-[var(--wk-accent)]"
                        >
                            <HelpCircle className="h-4 w-4" />
                            <span className="border-b border-[rgba(26,21,18,0.2)] pb-0.5 group-hover:border-[var(--wk-accent)]">
                                Comment marche le forum ?
                            </span>
                        </button>
                    </div>
                    <div className="lg:col-span-5">
                        <EntryChoice askHref={session ? "/forum/creer" : undefined} onAsk={openAuth} subject={subject} level={classLevel} />
                    </div>
                </div>
            </header>

            <div className={`${FORUM_CONTAINER} py-8 md:py-10`}>
                {/* ─── Recherche ─── */}
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(26,21,18,0.4)]" />
                        <input
                            type="search"
                            placeholder="Rechercher une question… (ex. dérivée, Vichy, present perfect)"
                            value={search}
                            onChange={(e) => onSearchInput(e.target.value)}
                            className="w-full rounded-full border border-[rgba(26,21,18,0.12)] bg-white py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-[var(--wk-accent)] focus:ring-4 focus:ring-[rgba(255,106,26,0.12)]"
                            aria-label="Rechercher une question"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    if (query) change(() => setQuery(""));
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(26,21,18,0.4)] hover:text-[var(--wk-ink)]"
                                aria-label="Effacer la recherche"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="wk-btn-ink hidden !py-3 sm:inline-flex">
                        Rechercher
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition lg:hidden ${
                            showFilters || activeFilterCount > 0
                                ? "border-[var(--wk-accent)] bg-[rgba(255,106,26,0.08)] text-[#c24a0a]"
                                : "border-[rgba(26,21,18,0.12)] bg-white"
                        }`}
                        aria-expanded={showFilters}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtres
                        {activeFilterCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wk-accent)] text-xs text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </form>

                {/* Filtres repliables (mobile / tablette) */}
                {showFilters && <div className="mt-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 lg:hidden">{filters}</div>}

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
                    {/* ─── Barre latérale (bureau) ─── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            {filters}
                            <Link
                                href="/suivi"
                                className="group flex items-start gap-3 rounded-3xl bg-[var(--wk-paper-2)] p-4 text-sm transition hover:bg-[#efe5d4]"
                            >
                                <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[var(--wk-accent)]" />
                                <span>
                                    <strong className="block">Besoin d&apos;un suivi ?</strong>
                                    <span className="text-[rgba(26,21,18,0.65)]">Un bénévole t&apos;accompagne pendant quelques semaines.</span>
                                </span>
                            </Link>
                        </div>
                    </aside>

                    {/* ─── Questions ─── */}
                    <section aria-label="Questions du forum" className="min-w-0">
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            <span className="mr-2 text-sm text-[rgba(26,21,18,0.6)]">
                                {loading ? "Chargement…" : typeof totalItems === "number" ? `${totalItems.toLocaleString("fr-FR")} question${totalItems > 1 ? "s" : ""}` : ""}
                            </span>
                            {query && <ActiveChip label={`« ${query} »`} onClear={() => change(() => { setSearch(""); setQuery(""); })} />}
                            {subject && <ActiveChip label={subject} onClear={() => change(() => setSubject(""))} />}
                            {classLevel && <ActiveChip label={classLevel} onClear={() => change(() => setClassLevel(""))} />}
                            {status && <ActiveChip label={STATUS_META[status]?.label || status} onClear={() => change(() => setStatus(""))} />}
                            {contextFilter && (
                                <ActiveChip
                                    label={contextFilter === "lesson" ? "Leçons" : "Exercices"}
                                    onClear={() => change(() => { setContextFilter(""); setContextIdFilter(""); })}
                                />
                            )}
                            {hasActiveFilters && (
                                <button type="button" onClick={clearAll} className="text-xs font-semibold text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-accent)]">
                                    Tout effacer
                                </button>
                            )}
                            {subject && (
                                <Link
                                    href={`/forum/matiere/${subjectToSlug(subject)}`}
                                    className="ml-auto text-xs font-semibold text-[var(--wk-accent)] hover:underline"
                                >
                                    Page {subject} →
                                </Link>
                            )}
                        </div>

                        {/* Bandeau temps réel : nouvelles questions postées en direct */}
                        {newCount > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setLoading(true);
                                    setPage(1);
                                    setRefreshKey((k) => k + 1);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="mb-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--wk-ink)] px-4 py-3 text-sm font-semibold text-[var(--wk-paper)] transition hover:bg-black"
                            >
                                <Sparkles className="h-4 w-4 text-[var(--wk-accent-2)]" />
                                {newCount === 1 ? "1 nouvelle question" : `${newCount} nouvelles questions`} — Afficher
                            </button>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-[260px] animate-pulse rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70" />
                                ))}
                            </div>
                        ) : questions.length > 0 ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                {questions.map((q, i) => (
                                    <React.Fragment key={q._id}>
                                        {withPromo && i === 6 && <SuiviPromoCard subject={subject} level={classLevel} wide />}
                                        <QuestionCard q={q} />
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-16 text-center">
                                <MessageCircleQuestion className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                                <h3 className="font-serif-display mt-4 text-2xl">Aucune question ici… pour l&apos;instant</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-[rgba(26,21,18,0.6)]">
                                    Essaie d&apos;autres mots ou d&apos;autres filtres — ou sois le premier à poser la question.
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-3">
                                    {hasActiveFilters && (
                                        <button type="button" onClick={clearAll} className="wk-btn-ghost !py-2.5 text-sm">
                                            Effacer les filtres
                                        </button>
                                    )}
                                    {session ? (
                                        <Link href="/forum/creer" className="wk-btn-orange !py-2.5 text-sm">Poser ma question</Link>
                                    ) : (
                                        <button type="button" onClick={openAuth} className="wk-btn-orange !py-2.5 text-sm">Poser ma question</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && questions.length > 0 && totalPages > 1 && (
                            <nav className="mt-10 flex items-center justify-center gap-1 border-t border-[rgba(26,21,18,0.08)] pt-8" aria-label="Pagination">
                                <button
                                    type="button"
                                    onClick={() => goToPage(Math.max(page - 1, 1))}
                                    disabled={page === 1}
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
                                                    onClick={() => goToPage(p)}
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
                                    onClick={() => goToPage(Math.min(page + 1, totalPages))}
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

            <ForumGuide open={showInfoModal} onClose={() => setShowInfoModal(false)} />
        </div>
    );
}

/* ───────────────────────── Filtres ───────────────────────── */

function FiltersPanel({
    subject,
    classLevel,
    status,
    contextFilter,
    onSubject,
    onLevel,
    onStatus,
    onContext,
}: {
    subject: string;
    classLevel: string;
    status: string;
    contextFilter: string;
    onSubject: (v: string) => void;
    onLevel: (v: string) => void;
    onStatus: (v: string) => void;
    onContext: (v: string) => void;
}) {
    const title = "font-mono-ui mb-2.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]";
    return (
        <div className="space-y-6">
            <div>
                <div className={title}>Statut</div>
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((o) => (
                        <Pill key={o.value} active={status === o.value} onClick={() => onStatus(o.value)}>
                            {o.dot && <span className={`h-1.5 w-1.5 rounded-full ${o.dot}`} />}
                            {o.label}
                        </Pill>
                    ))}
                </div>
            </div>

            <div>
                <div className={title}>Type</div>
                <div className="flex flex-wrap gap-1.5">
                    {CONTEXT_OPTIONS.map((o) => (
                        <Pill key={o.value} active={contextFilter === o.value} onClick={() => onContext(o.value)}>
                            {o.value === "lesson" && <BookOpen className="h-3 w-3" />}
                            {o.value === "exercise" && <Dumbbell className="h-3 w-3" />}
                            {o.label}
                        </Pill>
                    ))}
                </div>
            </div>

            <div>
                <div className={title}>Niveau</div>
                <div className="flex flex-wrap gap-1.5">
                    <Pill active={!classLevel} onClick={() => onLevel("")}>Tous</Pill>
                    {educationData.levels.map((l) => (
                        <Pill key={l} active={classLevel === l} onClick={() => onLevel(l)}>{l}</Pill>
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

/* ───────────────────────── Guide ───────────────────────── */

function ForumGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
    const block = "rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white p-5";
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-3xl bg-[var(--wk-paper)]">
                <DialogHeader>
                    <DialogTitle className="font-serif-display text-3xl font-normal">Le guide du forum</DialogTitle>
                    <DialogDescription>Tout ce qu&apos;il faut savoir pour demander et donner de l&apos;aide.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <section className={block}>
                        <h3 className="flex items-center gap-2 font-semibold"><Coins className="h-4 w-4 text-amber-600" /> Les points</h3>
                        <ul className="mt-3 space-y-1.5 text-sm text-[rgba(26,21,18,0.7)]">
                            <li><strong>+2 pts</strong> pour chaque réponse</li>
                            <li><strong>+1 pt</strong> par like reçu</li>
                            <li><strong>+X pts</strong> si ta réponse est validée (X = la mise)</li>
                            <li>Tu <strong>mises 1 à 15 pts</strong> pour poser une question</li>
                        </ul>
                    </section>
                    <section className={block}>
                        <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-[var(--wk-accent)]" /> Une bonne question</h3>
                        <ul className="mt-3 space-y-1.5 text-sm text-[rgba(26,21,18,0.7)]">
                            <li>Un titre précis, pas « Aide maths »</li>
                            <li>Ce que tu as déjà essayé</li>
                            <li>Exactement là où tu bloques</li>
                            <li>Une photo de l&apos;énoncé si besoin</li>
                        </ul>
                    </section>
                    <section className={`${block} sm:col-span-2`}>
                        <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Les statuts</h3>
                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            <p><strong className="text-amber-700">En attente</strong> — attend les réponses de la communauté.</p>
                            <p><strong className="text-[#2f86b3]">Validée</strong> — une réponse a été validée par l&apos;équipe.</p>
                            <p><strong className="text-emerald-700">Résolue</strong> — l&apos;auteur a choisi la meilleure réponse.</p>
                        </div>
                    </section>
                    <section className="rounded-2xl bg-[var(--wk-ink)] p-5 text-[var(--wk-paper)] sm:col-span-2">
                        <h3 className="flex items-center gap-2 font-semibold"><HeartHandshake className="h-4 w-4 text-[var(--wk-accent-2)]" /> Et si le forum ne suffit pas ?</h3>
                        <p className="mt-2 text-sm text-white/75">
                            Quand c&apos;est tout un chapitre qui coince, demande un <strong className="text-white">suivi personnalisé</strong> : un
                            bénévole de l&apos;association t&apos;accompagne plusieurs semaines, avec un plan et des exercices choisis pour toi.
                        </p>
                        <Link href="/suivi" onClick={onClose} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--wk-ink)]">
                            Découvrir le suivi
                        </Link>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
