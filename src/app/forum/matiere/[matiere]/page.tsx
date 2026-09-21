import { Metadata } from 'next'
import ForumHub from '@/app/forum/_components/ForumHub'
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
            .select('_id title slug subject classLevel status description createdAt updatedAt')
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
            <ForumHub kind="matiere" label={subject} questions={questions} />
        </>
    )
}
