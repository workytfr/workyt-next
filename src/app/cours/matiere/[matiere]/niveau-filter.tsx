"use client"

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { SubjectLabel, LevelChip } from '@/components/wk/primitives'

export interface CourseItem {
    id: string
    href: string
    title: string
    description: string
    niveau: string
    niveauSlug: string
    /** Renseigné sur les pages par niveau (on y affiche la matière) */
    matiere?: string
    image?: string
}

/**
 * Grille de cours des pages « hub » (matière / niveau). Rendue aussi côté
 * serveur (fallback de Suspense) : le HTML servi à Google contient tous les cours.
 */
export function CourseGrid({ courses }: { courses: CourseItem[] }) {
    return (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {courses.map((c) => (
                <li key={c.id} className="h-full">
                    <Link
                        href={c.href}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)]"
                    >
                        <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[var(--wk-paper-2)]">
                            {c.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                            ) : (
                                <div className="wk-dotgrid flex h-full w-full items-center justify-center">
                                    <BookOpen className="h-10 w-10 text-[rgba(26,21,18,0.25)]" />
                                </div>
                            )}
                            {c.niveau && <LevelChip level={c.niveau} className="absolute left-4 top-4 !bg-white/95 shadow-sm" />}
                        </div>
                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                            {c.matiere && <SubjectLabel subject={c.matiere} className="mb-2.5" />}
                            <h2 className="font-serif-display text-[1.35rem] leading-[1.12] line-clamp-2 group-hover:text-[#c24a0a]">{c.title}</h2>
                            {c.description && (
                                <p className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3">{c.description}</p>
                            )}
                            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[var(--wk-ink)]">
                                Ouvrir le cours
                                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    )
}

/**
 * Filtre de niveau piloté par `?niveau=`.
 *
 * Volontairement côté client : lire searchParams dans la page basculerait
 * tout le hub en rendu dynamique et ferait sauter le `generateStaticParams`
 * + ISR, alors que cette page est une cible SEO. Ici le HTML servi reste
 * complet (tous les cours), et le filtre s'applique après hydratation.
 */
export default function NiveauFilter({ courses }: { courses: CourseItem[] }) {
    const params = useSearchParams()
    const niveauSlug = params.get('niveau')

    if (!niveauSlug) return <CourseGrid courses={courses} />

    const filtered = courses.filter((c) => c.niveauSlug === niveauSlug)

    if (filtered.length === 0) {
        return (
            <div>
                <p className="mb-6 rounded-3xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm text-[#8a3a0c]">
                    Aucun cours pour ce niveau dans cette matière — voici tous les cours disponibles.
                </p>
                <CourseGrid courses={courses} />
            </div>
        )
    }

    const label = filtered[0].niveau

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--wk-ink)] px-3.5 py-1 text-sm font-semibold text-[var(--wk-paper)]">
                    Niveau&nbsp;: {label}
                </span>
                <Link href="?" scroll={false} className="text-sm font-semibold text-[rgba(26,21,18,0.55)] underline underline-offset-4 hover:text-[var(--wk-accent)]">
                    Retirer le filtre ({courses.length} cours)
                </Link>
            </div>
            <CourseGrid courses={filtered} />
        </div>
    )
}
