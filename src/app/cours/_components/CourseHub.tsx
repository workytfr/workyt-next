import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";
import { educationData } from "@/data/educationData";
import { subjectToSlug, levelToSlug } from "@/utils/subjectSlug";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";
import { EntryChoice } from "@/app/forum/_components/forumUi";
import NiveauFilter, { CourseGrid, type CourseItem } from "../matiere/[matiere]/niveau-filter";

/**
 * Page « hub » des cours, par matière ou par niveau (composant serveur, ISR).
 * Même construction que les hubs du forum ; maillage vers les autres
 * matières / niveaux pour le SEO.
 *
 * Sur une page matière, le filtre par niveau reste piloté par `?niveau=`
 * côté client (voir NiveauFilter) pour ne pas casser le rendu statique.
 */
export default function CourseHub({ kind, label, courses }: { kind: "matiere" | "niveau"; label: string; courses: CourseItem[] }) {
    const isSubject = kind === "matiere";

    // Sur une page matière : les niveaux réellement couverts, en liens ?niveau=
    const levelsHere = isSubject
        ? educationData.levels.filter((l) => courses.some((c) => c.niveau === l))
        : [];

    const others = isSubject
        ? educationData.subjects.filter((s) => s !== label).map((s) => ({ label: s, href: `/cours/matiere/${subjectToSlug(s)}` }))
        : educationData.levels.filter((l) => l !== label).map((l) => ({ label: l, href: `/cours/niveau/${levelToSlug(l)}` }));

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${PAGE_CONTAINER} relative pb-12 pt-8 md:pb-16`}>
                    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)]">
                        <Link href="/" className="hover:text-[var(--wk-accent)]">Accueil</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href="/cours" className="hover:text-[var(--wk-accent)]">Cours</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-[var(--wk-ink)]">{label}</span>
                    </nav>

                    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <Eyebrow>{isSubject ? "Cours par matière" : "Cours par niveau"}</Eyebrow>
                            <h1 className="font-serif-display mt-5 text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[0.95]">
                                {isSubject ? "Cours de " : "Cours "}
                                <span className="italic text-[rgba(26,21,18,0.45)]">{isSubject ? label : `niveau ${label}`}</span>
                                <span className="text-[var(--wk-accent)]">.</span>
                            </h1>
                            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                                {isSubject ? (
                                    <>Tous les cours gratuits de <strong>{label}</strong> publiés par les bénévoles de Workyt, du collège au supérieur : chapitres, exercices, quiz et fiches associées.</>
                                ) : (
                                    <>Tous les cours gratuits du niveau <strong>{label}</strong>, toutes matières confondues, structurés en chapitres avec exercices et quiz.</>
                                )}
                            </p>
                            {levelsHere.length > 1 && (
                                <nav aria-label="Filtrer par niveau" className="mt-6 flex flex-wrap gap-2">
                                    {levelsHere.map((l) => (
                                        <Link key={l} href={`?niveau=${levelToSlug(l)}`} scroll={false} className="wk-chip !py-1.5 transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]">
                                            {l}
                                        </Link>
                                    ))}
                                </nav>
                            )}
                        </div>
                        <div className="lg:col-span-5">
                            <EntryChoice
                                askHref={`/forum/creer?${new URLSearchParams(isSubject ? { subject: label } : { classLevel: label })}`}
                                subject={isSubject ? label : undefined}
                                level={isSubject ? undefined : label}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className={`${PAGE_CONTAINER} py-10`}>
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <section aria-label={`Cours ${label}`} className="min-w-0">
                        <p className="mb-5 text-sm text-[rgba(26,21,18,0.6)]">
                            {courses.length} cours publié{courses.length > 1 ? "s" : ""}
                        </p>
                        {courses.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-16 text-center">
                                <BookOpen className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                                <p className="font-serif-display mt-4 text-2xl">Aucun cours {isSubject ? `de ${label}` : label} pour le moment</p>
                                <Link href="/cours" className="mt-4 inline-block text-sm font-semibold text-[var(--wk-accent)] hover:underline">Voir tous les cours</Link>
                            </div>
                        ) : isSubject ? (
                            <Suspense fallback={<CourseGrid courses={courses} />}>
                                <NiveauFilter courses={courses} />
                            </Suspense>
                        ) : (
                            <CourseGrid courses={courses} />
                        )}
                    </section>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="font-mono-ui mb-3 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                            {isSubject ? "Autres matières" : "Autres niveaux"}
                        </div>
                        <ul className="flex flex-wrap gap-1.5 lg:max-h-[70vh] lg:overflow-y-auto">
                            {others.map((o) => (
                                <li key={o.href}>
                                    <Link href={o.href} className="wk-chip transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]">{o.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </div>
        </div>
    );
}
