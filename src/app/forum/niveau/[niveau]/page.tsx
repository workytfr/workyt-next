import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Question from '@/models/Question'
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
    const url = `https://workyt.fr/forum/niveau/${slug}`
    const title = `Forum ${level} : aide aux devoirs gratuite | Workyt`
    const description = `Pose ta question niveau ${level} et obtiens de l'aide gratuitement. Toutes les questions ${level} résolues par la communauté Workyt.`
    return {
        title,
        description,
        keywords: `forum ${level}, aide devoirs ${level}, questions ${level}, exercices ${level}, ${level} corrigé`,
        alternates: { canonical: url },
        openGraph: {
            title, description, url, siteName: 'Workyt', type: 'website', locale: 'fr_FR',
            images: [{ url: 'https://workyt.fr/workytforum.png', width: 1200, height: 630, alt: `Forum ${level} - Workyt` }],
        },
        twitter: { card: 'summary_large_image', site: '@workyt_fr', title, description },
        robots: { index: true, follow: true },
    }
}

export const revalidate = 1800

export default async function NiveauForumPage({ params }: PageProps) {
    const { niveau: slug } = await params
    const level = slugToLevel(slug)
    if (!level) notFound()

    let questions: any[] = []
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000)),
        ])
        questions = await Question.find({ classLevel: level })
            .select('_id title slug subject description createdAt updatedAt')
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(80)
            .lean()
    } catch (err) {
        console.error('Hub forum/niveau DB error:', err)
    }

    const url = `https://workyt.fr/forum/niveau/${slug}`
    const collectionLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Forum ${level}`,
        url,
        description: `Questions de niveau ${level} sur le forum d'entraide scolaire Workyt.`,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Workyt', url: 'https://workyt.fr' },
        publisher: { '@type': 'Organization', name: 'Workyt', url: 'https://workyt.fr' },
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: questions.slice(0, 20).map((q: any, i: number) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `https://workyt.fr/forum/${buildIdSlug(q._id.toString(), q.slug || q.title)}`,
                name: q.title,
            })),
        },
    }
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://workyt.fr' },
            { '@type': 'ListItem', position: 2, name: 'Forum', item: 'https://workyt.fr/forum' },
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
                    <Link href="/forum" className="hover:text-orange-500">Forum</Link>
                    {' › '}
                    <span className="text-gray-900">{level}</span>
                </nav>
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        Questions niveau {level}
                    </h1>
                    <p className="mt-3 text-gray-600 max-w-2xl">
                        Bloqué sur un exercice de <strong>{level}</strong> ? La communauté
                        Workyt répond gratuitement, toutes matières confondues. Parcours les
                        questions résolues ou pose la tienne.
                    </p>
                    <Link href="/forum/creer" className="inline-block mt-4 rounded-full bg-orange-500 text-white px-5 py-2 text-sm font-semibold hover:bg-orange-600 transition">
                        Poser une question
                    </Link>
                </header>
                {questions.length === 0 ? (
                    <p className="text-gray-500">
                        Aucune question niveau {level} pour le moment. Sois le premier à en poser une !
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                        {questions.map((q: any) => {
                            const href = `/forum/${buildIdSlug(q._id.toString(), q.slug || q.title)}`
                            const excerpt = q.description?.whatINeed || q.description?.whatIDid || ''
                            return (
                                <li key={q._id.toString()} className="p-4 sm:p-5 hover:bg-orange-50/30 transition">
                                    <Link href={href} className="block">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{q.subject}</span>
                                        </div>
                                        <h2 className="text-base font-semibold text-gray-900 line-clamp-2">{q.title}</h2>
                                        {excerpt && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{excerpt}</p>}
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
