import { Metadata } from 'next'
import ForumHub from '@/app/forum/_components/ForumHub'
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
            .select('_id title slug subject classLevel status description createdAt updatedAt')
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
            <ForumHub kind="niveau" label={level} questions={questions} />
        </>
    )
}
