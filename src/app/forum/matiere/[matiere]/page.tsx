import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Question from '@/models/Question'
import { buildIdSlug } from '@/utils/slugify'
import { getAllSubjectSlugs, slugToSubject } from '@/utils/subjectSlug'

interface PageProps {
    params: Promise<{ matiere: string }>
}

export async function generateStaticParams() {
    return getAllSubjectSlugs().map((matiere) => ({ matiere }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { matiere: slug } = await params
    const subject = slugToSubject(slug)
    if (!subject) {
        return { title: 'Matière introuvable | Workyt', robots: { index: false, follow: false } }
    }
    const url = `https://workyt.fr/forum/matiere/${slug}`
    const title = `Forum ${subject} : aide aux devoirs gratuite | Workyt`
    const description = `Pose ta question de ${subject} et obtiens de l'aide gratuitement sur Workyt. Toutes les questions de ${subject} résolues par la communauté.`
    return {
        title,
        description,
        keywords: `forum ${subject}, aide devoirs ${subject}, questions ${subject}, ${subject} gratuit, entraide scolaire`,
        alternates: { canonical: url },
        openGraph: {
            title, description, url, siteName: 'Workyt', type: 'website', locale: 'fr_FR',
            images: [{ url: 'https://workyt.fr/workytforum.png', width: 1200, height: 630, alt: `Forum ${subject} - Workyt` }],
        },
        twitter: { card: 'summary_large_image', site: '@workyt_fr', title, description },
        robots: { index: true, follow: true },
    }
}

export const revalidate = 1800

export default async function MatiereForumPage({ params }: PageProps) {
    const { matiere: slug } = await params
    const subject = slugToSubject(slug)
    if (!subject) notFound()

    let questions: any[] = []
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000)),
        ])
        questions = await Question.find({ subject })
            .select('_id title slug classLevel description createdAt updatedAt')
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(80)
            .lean()
    } catch (err) {
        console.error('Hub forum/matiere DB error:', err)
    }

    const url = `https://workyt.fr/forum/matiere/${slug}`
    const collectionLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Forum ${subject}`,
        url,
        description: `Toutes les questions de ${subject} posées sur le forum d'entraide scolaire Workyt.`,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Workyt', url: 'https://workyt.fr' },
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
            { '@type': 'ListItem', position: 3, name: subject, item: url },
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
                    <span className="text-gray-900">{subject}</span>
                </nav>
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        Questions de {subject}
                    </h1>
                    <p className="mt-3 text-gray-600 max-w-2xl">
                        Bloqué sur un exercice de <strong>{subject}</strong> ? La communauté
                        Workyt répond gratuitement, du collège au supérieur. Parcours les
                        questions résolues ou pose la tienne.
                    </p>
                    <Link href="/forum/creer" className="inline-block mt-4 rounded-full bg-orange-500 text-white px-5 py-2 text-sm font-semibold hover:bg-orange-600 transition">
                        Poser une question
                    </Link>
                </header>
                {questions.length === 0 ? (
                    <p className="text-gray-500">
                        Aucune question de {subject} pour le moment. Sois le premier à en poser une !
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
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{q.classLevel}</span>
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
