import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Course from '@/models/Course'
import { buildIdSlug } from '@/utils/slugify'
import { getAllLevelSlugs, slugToLevel } from '@/utils/subjectSlug'

interface PageProps {
    params: Promise<{ niveau: string }>
}

export async function generateStaticParams() {
    return getAllLevelSlugs().map((niveau) => ({ niveau }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { niveau: slug } = await params
    const level = slugToLevel(slug)
    if (!level) {
        return { title: 'Niveau introuvable | Workyt', robots: { index: false, follow: false } }
    }
    const url = `https://workyt.fr/cours/niveau/${slug}`
    const title = `Cours ${level} gratuits | Workyt`
    const description = `Tous les cours gratuits niveau ${level} sur Workyt : mathématiques, français, sciences, langues. Bibliothèque pédagogique de l'asso d'entraide scolaire 100 % bénévole.`
    return {
        title,
        description,
        keywords: `cours ${level}, ${level} gratuit, cours en ligne ${level}, programme ${level}, brevet, bac`,
        alternates: { canonical: url },
        openGraph: {
            title, description, url, siteName: 'Workyt', type: 'website', locale: 'fr_FR',
            images: [{ url: 'https://workyt.fr/workytcours.png', width: 1200, height: 630, alt: `Cours ${level} - Workyt` }],
        },
        twitter: { card: 'summary_large_image', site: '@workyt_fr', title, description },
        robots: { index: true, follow: true },
    }
}

export const revalidate = 3600

export default async function NiveauCoursPage({ params }: PageProps) {
    const { niveau: slug } = await params
    const level = slugToLevel(slug)
    if (!level) notFound()

    let courses: any[] = []
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000)),
        ])
        courses = await Course.find({ status: 'publie', niveau: level })
            .select('_id title slug description matiere image updatedAt')
            .sort({ updatedAt: -1 })
            .limit(60)
            .lean()
    } catch (err) {
        console.error('Hub cours/niveau DB error:', err)
    }

    const url = `https://workyt.fr/cours/niveau/${slug}`
    const collectionLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Cours ${level}`,
        url,
        description: `Catalogue des cours gratuits niveau ${level} sur Workyt.`,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Workyt', url: 'https://workyt.fr' },
        publisher: { '@type': 'Organization', name: 'Workyt', url: 'https://workyt.fr' },
        hasPart: courses.map((c: any) => ({
            '@type': 'Course',
            name: c.title,
            url: `https://workyt.fr/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`,
            educationalLevel: level,
            about: { '@type': 'Thing', name: c.matiere },
            isAccessibleForFree: true,
            inLanguage: 'fr',
            provider: { '@type': 'Organization', name: 'Workyt', url: 'https://workyt.fr' },
        })),
    }
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://workyt.fr' },
            { '@type': 'ListItem', position: 2, name: 'Cours', item: 'https://workyt.fr/cours' },
            { '@type': 'ListItem', position: 3, name: level, item: url },
        ],
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <main className="mx-auto max-w-[1200px] px-6 py-10">
                <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-gray-500">
                    <Link href="/" className="hover:text-orange-500">Accueil</Link>
                    {' › '}
                    <Link href="/cours" className="hover:text-orange-500">Cours</Link>
                    {' › '}
                    <span className="text-gray-900">{level}</span>
                </nav>
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        Cours niveau {level}
                    </h1>
                    <p className="mt-3 text-gray-600 max-w-2xl">
                        Retrouve tous les cours gratuits du niveau <strong>{level}</strong> publiés
                        par les bénévoles de Workyt. Toutes matières confondues, structurés en
                        chapitres avec exercices et quiz.
                    </p>
                </header>
                {courses.length === 0 ? (
                    <p className="text-gray-500">
                        Aucun cours {level} publié pour le moment.{' '}
                        <Link href="/cours" className="text-orange-500 underline">Voir tous les cours</Link>.
                    </p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((c: any) => {
                            const href = `/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`
                            return (
                                <li key={c._id.toString()} className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-orange-200 hover:shadow-sm transition">
                                    <Link href={href} className="block">
                                        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{c.matiere}</div>
                                        <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{c.title}</h2>
                                        <p className="text-sm text-gray-500 line-clamp-3">{c.description}</p>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </main>
        </>
    )
}
