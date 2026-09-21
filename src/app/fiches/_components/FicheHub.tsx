import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { educationData } from "@/data/educationData";
import { subjectToSlug, levelToSlug } from "@/utils/subjectSlug";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";
import { FicheActions, FicheTile, type FicheTileData } from "./ficheUi";

/**
 * Page « hub » des fiches, par matière ou par niveau (composant serveur, ISR).
 * Même construction que les hubs du forum et des cours.
 */
export default function FicheHub({ kind, label, fiches }: { kind: "matiere" | "niveau"; label: string; fiches: FicheTileData[] }) {
    const isSubject = kind === "matiere";
    const others = isSubject
        ? educationData.subjects.filter((s) => s !== label).map((s) => ({ label: s, href: `/fiches/matiere/${subjectToSlug(s)}` }))
        : educationData.levels.filter((l) => l !== label).map((l) => ({ label: l, href: `/fiches/niveau/${levelToSlug(l)}` }));

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${PAGE_CONTAINER} relative pb-12 pt-8 md:pb-16`}>
                    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)]">
                        <Link href="/" className="hover:text-[var(--wk-accent)]">Accueil</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href="/fiches" className="hover:text-[var(--wk-accent)]">Fiches</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-[var(--wk-ink)]">{label}</span>
                    </nav>

                    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7">
                            <Eyebrow>{isSubject ? "Fiches par matière" : "Fiches par niveau"}</Eyebrow>
                            <h1 className="font-serif-display mt-5 text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[0.95]">
                                Fiches de révision{" "}
                                <span className="italic text-[rgba(26,21,18,0.45)]">{isSubject ? label : `niveau ${label}`}</span>
                                <span className="text-[var(--wk-accent)]">.</span>
                            </h1>
                            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                                {isSubject ? (
                                    <>Révise <strong>{label}</strong> avec les fiches gratuites de la communauté Workyt : synthèses, méthodes et formules pour le brevet, le bac et tes examens.</>
                                ) : (
                                    <>Toutes les fiches de révision du niveau <strong>{label}</strong>, toutes matières confondues, rédigées par la communauté Workyt.</>
                                )}
                            </p>
                        </div>
                        <div className="lg:col-span-5">
                            <FicheActions subject={isSubject ? label : undefined} level={isSubject ? undefined : label} />
                        </div>
                    </div>
                </div>
            </header>

            <div className={`${PAGE_CONTAINER} py-10`}>
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <section aria-label={`Fiches ${label}`} className="min-w-0">
                        <p className="mb-5 text-sm text-[rgba(26,21,18,0.6)]">
                            {fiches.length} fiche{fiches.length > 1 ? "s" : ""} récente{fiches.length > 1 ? "s" : ""}
                        </p>
                        {fiches.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-16 text-center">
                                <FileText className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                                <p className="font-serif-display mt-4 text-2xl">Aucune fiche {isSubject ? `de ${label}` : label} pour le moment</p>
                                <Link href="/fiches/creer" className="mt-4 inline-block text-sm font-semibold text-[var(--wk-accent)] hover:underline">
                                    Déposer la première
                                </Link>
                            </div>
                        ) : (
                            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                {fiches.map((f) => (
                                    <li key={f.id} className="h-full">
                                        <FicheTile f={f} showSubject={!isSubject} />
                                    </li>
                                ))}
                            </ul>
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
