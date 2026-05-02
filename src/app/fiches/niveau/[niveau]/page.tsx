import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Revision from '@/models/Revision'
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
    const url = `https://workyt.fr/fiches/niveau/${slug}`
    const title = `Fiches de révision ${level} gratuites | Workyt`
    const description = `Toutes les fiches de révision niveau ${level} créées par la communauté Workyt. Brevet, bac, examens — révise gratuitement, sans pub.`
    return {
        title,
        description,
        keywords: `fiches révision ${level}, ${level} brevet, ${level} bac, fiches gratuites ${level}, programme ${level}`,
        alternates: { canonical: url },
        openGraph: {
            title, description, url, siteName: 'Workyt', type: 'website', locale: 'fr_FR',
            images: [{ url: 'https://workyt.fr/workytfiche.png', width: 1200, height: 630, alt: `Fiches ${level} - Workyt` }],
        },
        twitter: { card: 'summary_large_image', site: '@workyt_fr', title, description },
        robots: { index: true, follow: true },
    }
}

export const revalidate = 3600

function stripHtml(html: string): string {
    return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default async function NiveauFichesPage({ params }: PageProps) {
    const { niveau: slug } = await params
    const level = slugToLevel(slug)
    if (!level) notFound()

    let fiches: any[] = []
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000)),
        ])
        fiches = await Revision.find({ level })
            .select('_id title slug subject content files createdAt updatedAt')
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(60)
            .lean()
    } catch (err) {
        console.error('Hub fiches/niveau DB error:', err)
    }

    const url = `https://workyt.fr/fiches/niveau/${slug}`
    const collectionLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Fiches de révision ${level}`,
        url,
        description: `Catalogue des fiches de révision gratuites niveau ${level} sur Workyt.`,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Workyt', url: 'https://workyt.fr' },
        publisher: { '@type': 'Organization', name: 'Workyt', url: 'https://workyt.fr' },
        hasPart: fiches.map((f: any) => ({
            '@type': 'LearningResource',
            name: f.title,
            url: `https://workyt.fr/fiches/${buildIdSlug(f._id.toString(), f.slug || f.title)}`,
            inLanguage: 'fr',
            educationalLevel: level,
            about: { '@type': 'Thing', name: f.subject },
            isAccessibleForFree: true,
        })),
    }
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://workyt.fr' },
            { '@type': 'ListItem', position: 2, name: 'Fiches', item: 'https://workyt.fr/fiches' },
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
                    <Link href="/fiches" className="hover:text-orange-500">Fiches</Link>
                    {' › '}
                    <span className="text-gray-900">{level}</span>
                </nav>
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        Fiches de révision {level}
                    </h1>
                    <p className="mt-3 text-gray-600 max-w-2xl">
                        Révise au niveau <strong>{level}</strong> avec les fiches gratuites de la
                        communauté Workyt. Synthèses, méthodes, formules — tout ce qu'il faut
                        pour réussir le Brevet, le Bac et tes examens.
                    </p>
                </header>
                {fiches.length === 0 ? (
                    <p className="text-gray-500">
                        Aucune fiche {level} pour le moment.{' '}
                        <Link href="/fiches" className="text-orange-500 underline">Voir toutes les fiches</Link>.
                    </p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {fiches.map((f: any) => {
                            const href = `/fiches/${buildIdSlug(f._id.toString(), f.slug || f.title)}`
                            const excerpt = stripHtml(f.content).slice(0, 140)
                            return (
                                <li key={f._id.toString()} className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-orange-200 hover:shadow-sm transition">
                                    <Link href={href} className="block">
                                        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{f.subject}</div>
                                        <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{f.title}</h2>
                                        {excerpt && <p className="text-sm text-gray-500 line-clamp-3">{excerpt}…</p>}
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
