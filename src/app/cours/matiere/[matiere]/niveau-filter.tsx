"use client"

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export interface CourseItem {
    id: string
    href: string
    title: string
    description: string
    niveau: string
    niveauSlug: string
}

export function CourseGrid({ courses }: { courses: CourseItem[] }) {
    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
                <li
                    key={c.id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm"
                >
                    <Link href={c.href} className="block">
                        <div className="mb-2 text-xs uppercase tracking-wider text-gray-400">
                            {c.niveau}
                        </div>
                        <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
                            {c.title}
                        </h2>
                        <p className="line-clamp-3 text-sm text-gray-500">{c.description}</p>
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
                <p className="mb-6 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                    Aucun cours pour ce niveau dans cette matière — voici tous les
                    cours disponibles.
                </p>
                <CourseGrid courses={courses} />
            </div>
        )
    }

    const label = filtered[0].niveau

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
                    Niveau&nbsp;: {label}
                </span>
                <Link
                    href="?"
                    scroll={false}
                    className="text-sm text-gray-500 underline underline-offset-4 hover:text-orange-500"
                >
                    Retirer le filtre ({courses.length} cours)
                </Link>
            </div>
            <CourseGrid courses={filtered} />
        </div>
    )
}
