import { Metadata } from 'next'
import CourseHub from '@/app/cours/_components/CourseHub'
import { plainExcerpt } from '@/app/forum/_components/forumUi'
import { type CourseItem } from '@/app/cours/matiere/[matiere]/niveau-filter'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Course from '@/models/Course'
import { buildIdSlug } from '@/utils/slugify'
import { getAllLevelSlugs, slugToLevel, levelToSlug } from '@/utils/subjectSlug'

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
            .select('_id title slug description matiere niveau image updatedAt')
            .sort({ updatedAt: -1 })
            .limit(60)
            .lean()
    } catch (err) {
        console.error('Hub cours/niveau DB error:', err)
    }

    const courseItems: CourseItem[] = courses.map((c: any) => ({
        id: c._id.toString(),
        href: `/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`,
        title: c.title,
        description: plainExcerpt(c.description ?? '', 180),
        niveau: c.niveau ?? level,
        niveauSlug: levelToSlug(c.niveau ?? level),
        matiere: c.matiere,
        image: c.image || undefined,
    }))

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
            <CourseHub kind="niveau" label={level} courses={courseItems} />
        </>
    )
}
