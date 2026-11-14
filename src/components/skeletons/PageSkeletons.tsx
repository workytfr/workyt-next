/**
 * Squelettes affichés par les loading.tsx pendant qu'une page se prépare.
 * Ils reprennent la mise en page réelle (en-tête, colonne de filtres, grille,
 * sommaire du cours…) : la page arrive à sa place, sans saut, au lieu d'un
 * rond qui tourne au milieu d'un écran vide.
 *
 * Composants serveur, sans JavaScript. Le reflet `.wk-skel` (globals.css)
 * s'arrête si l'utilisateur a demandé moins d'animations.
 */

import { PAGE_CONTAINER } from "@/components/wk/primitives";

function Bone({ className = "" }: { className?: string }) {
    return <div className={`wk-skel ${className}`} aria-hidden="true" />;
}

/** Racine commune : annoncée une seule fois aux lecteurs d'écran. */
function SkeletonRoot({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div role="status" aria-live="polite" aria-busy="true" className="min-h-screen bg-[var(--wk-paper)]">
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}

/* ───────────────────────── Listes : cours, fiches, forum ───────────────────────── */

const CARD_HEIGHT = { cours: "h-[420px]", fiches: "h-[240px]", forum: "h-[260px]" } as const;

function ListCard({ variant }: { variant: keyof typeof CARD_HEIGHT }) {
    return (
        <div className={`${CARD_HEIGHT[variant]} flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70`}>
            {variant === "cours" && <Bone className="h-44 w-full rounded-none" />}
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex gap-2">
                    <Bone className="h-5 w-20 rounded-full" />
                    <Bone className="h-5 w-14 rounded-full" />
                </div>
                <Bone className="h-6 w-4/5 rounded-lg" />
                <Bone className="h-4 w-full rounded-md" />
                <Bone className="h-4 w-2/3 rounded-md" />
                <div className="mt-auto flex items-center gap-2 pt-2">
                    <Bone className="h-7 w-7 rounded-full" />
                    <Bone className="h-3.5 w-24 rounded-md" />
                </div>
            </div>
        </div>
    );
}

export function ListingSkeleton({ variant, label }: { variant: keyof typeof CARD_HEIGHT; label: string }) {
    const grid = variant === "cours" ? "sm:grid-cols-2 2xl:grid-cols-3" : "md:grid-cols-2 2xl:grid-cols-3";
    return (
        <SkeletonRoot label={label}>
            {/* En-tête : sur-titre, grand titre sur deux lignes, chapeau, matières */}
            <header className="border-b border-[rgba(26,21,18,0.08)]">
                <div className={`${PAGE_CONTAINER} grid grid-cols-1 gap-10 pb-12 pt-12 md:pb-16 md:pt-16 lg:grid-cols-12 lg:items-end`}>
                    <div className="lg:col-span-7">
                        <Bone className="h-3 w-40 rounded-full" />
                        <Bone className="mt-6 h-12 w-[85%] rounded-2xl md:h-16" />
                        <Bone className="mt-3 h-12 w-[60%] rounded-2xl md:h-16" />
                        <Bone className="mt-7 h-4 w-full max-w-[58ch] rounded-md" />
                        <Bone className="mt-2.5 h-4 w-3/4 max-w-[44ch] rounded-md" />
                        <div className="mt-6 flex flex-wrap gap-2">
                            {["w-24", "w-20", "w-28", "w-16", "w-24"].map((w, i) => (
                                <Bone key={i} className={`h-8 rounded-full ${w}`} />
                            ))}
                        </div>
                    </div>
                    <div className="hidden lg:col-span-5 lg:block">
                        <Bone className="h-48 w-full rounded-3xl" />
                    </div>
                </div>
            </header>

            <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                <Bone className="h-12 w-full rounded-full" />
                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
                    {/* Colonne de filtres (grand écran) */}
                    <aside className="hidden space-y-6 lg:block" aria-hidden="true">
                        <div>
                            <Bone className="h-2.5 w-16 rounded-full" />
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <Bone key={i} className="h-7 w-14 rounded-full" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Bone className="h-2.5 w-16 rounded-full" />
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Bone key={i} className="h-8 w-full rounded-xl" />
                            ))}
                        </div>
                    </aside>
                    <section className="min-w-0">
                        <Bone className="mb-5 h-4 w-28 rounded-md" />
                        <div className={`grid grid-cols-1 gap-5 ${grid}`}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ListCard key={i} variant={variant} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </SkeletonRoot>
    );
}

/* ───────────────────────── Lecteur de cours ───────────────────────── */

/** Contenu d'une leçon, d'un quiz ou d'exercices (le sommaire reste affiché). */
export function LessonContentSkeleton() {
    return (
        <div role="status" aria-live="polite" aria-busy="true" className="mx-auto w-full max-w-3xl">
            <span className="sr-only">Chargement de la leçon…</span>
            <Bone className="h-3.5 w-48 rounded-full" />
            <Bone className="mt-5 h-10 w-4/5 rounded-2xl md:h-12" />
            <Bone className="mt-3 h-10 w-1/2 rounded-2xl md:h-12" />
            <div className="mt-8 space-y-3">
                <Bone className="h-4 w-full rounded-md" />
                <Bone className="h-4 w-[96%] rounded-md" />
                <Bone className="h-4 w-[90%] rounded-md" />
                <Bone className="h-4 w-3/4 rounded-md" />
            </div>
            {/* Bloc type définition / propriété */}
            <div className="mt-8 rounded-2xl border border-[rgba(26,21,18,0.06)] bg-white/60 p-5">
                <Bone className="h-5 w-40 rounded-md" />
                <Bone className="mt-4 h-4 w-full rounded-md" />
                <Bone className="mt-2.5 h-4 w-5/6 rounded-md" />
            </div>
            <div className="mt-8 space-y-3">
                <Bone className="h-4 w-full rounded-md" />
                <Bone className="h-4 w-[92%] rounded-md" />
                <Bone className="h-4 w-2/3 rounded-md" />
            </div>
        </div>
    );
}

/** Premier affichage d'un cours : sommaire + contenu (même grille que CourseShell). */
export function CourseReaderSkeleton() {
    return (
        <div role="status" aria-live="polite" aria-busy="true" className="min-h-[calc(100dvh-80px)] bg-[var(--wk-paper)]">
            <span className="sr-only">Chargement du cours…</span>
            <div className="mx-auto flex max-w-[1440px] gap-6 px-3 sm:px-5 lg:gap-10 lg:px-8">
                <aside className="hidden w-72 shrink-0 pt-6 md:block md:pt-8" aria-hidden="true">
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/60 p-4">
                        <Bone className="h-5 w-3/4 rounded-md" />
                        <Bone className="mt-2 h-3 w-1/2 rounded-full" />
                        <Bone className="mt-4 h-2 w-full rounded-full" />
                        <div className="mt-5 space-y-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Bone key={i} className={`h-9 rounded-xl ${i % 3 === 0 ? "w-full" : "ml-4 w-[calc(100%-1rem)]"}`} />
                            ))}
                        </div>
                    </div>
                </aside>
                <div className="min-w-0 flex-1 pb-28 pt-6 md:pb-16 md:pt-8">
                    <LessonContentSkeleton />
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── Fiche ───────────────────────── */

export function FicheSkeleton() {
    return (
        <SkeletonRoot label="Chargement de la fiche…">
            <header className="border-b border-[rgba(26,21,18,0.08)]">
                <div className={`${PAGE_CONTAINER} pb-8 pt-8 md:pb-10 md:pt-10`}>
                    <Bone className="h-4 w-48 rounded-full" />
                    <Bone className="mt-6 h-12 w-2/3 rounded-2xl" />
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Bone className="h-7 w-24 rounded-full" />
                        <Bone className="h-7 w-20 rounded-full" />
                        <Bone className="h-7 w-28 rounded-full" />
                    </div>
                </div>
            </header>
            <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <Bone className="h-[420px] rounded-3xl md:h-[560px]" />
                    <div className="space-y-4">
                        <Bone className="h-[260px] rounded-3xl" />
                        <Bone className="h-32 rounded-3xl" />
                    </div>
                </div>
            </div>
        </SkeletonRoot>
    );
}

/* ───────────────────────── Question du forum ───────────────────────── */

function AnswerBone() {
    return (
        <div className="rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70 p-5">
            <div className="flex items-center gap-3">
                <Bone className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                    <Bone className="h-3.5 w-28 rounded-md" />
                    <Bone className="h-3 w-16 rounded-md" />
                </div>
            </div>
            <Bone className="mt-4 h-4 w-full rounded-md" />
            <Bone className="mt-2.5 h-4 w-[88%] rounded-md" />
            <Bone className="mt-2.5 h-4 w-1/2 rounded-md" />
        </div>
    );
}

export function QuestionSkeleton() {
    return (
        <SkeletonRoot label="Chargement de la question…">
            <header className="border-b border-[rgba(26,21,18,0.08)]">
                <div className={`${PAGE_CONTAINER} pb-8 pt-8 md:pb-10 md:pt-10`}>
                    <Bone className="h-4 w-40 rounded-full" />
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Bone className="h-7 w-24 rounded-full" />
                        <Bone className="h-7 w-20 rounded-full" />
                    </div>
                    <Bone className="mt-4 h-10 w-[80%] max-w-5xl rounded-2xl md:h-12" />
                    <Bone className="mt-3 h-10 w-1/2 max-w-3xl rounded-2xl md:h-12" />
                </div>
            </header>
            <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
                    <div className="space-y-5">
                        <div className="rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70 p-6">
                            <Bone className="h-4 w-full rounded-md" />
                            <Bone className="mt-2.5 h-4 w-[94%] rounded-md" />
                            <Bone className="mt-2.5 h-4 w-3/5 rounded-md" />
                        </div>
                        <Bone className="h-5 w-32 rounded-md" />
                        <AnswerBone />
                        <AnswerBone />
                    </div>
                    <aside className="space-y-4" aria-hidden="true">
                        <Bone className="h-40 rounded-3xl" />
                        <Bone className="h-28 rounded-3xl" />
                    </aside>
                </div>
            </div>
        </SkeletonRoot>
    );
}
