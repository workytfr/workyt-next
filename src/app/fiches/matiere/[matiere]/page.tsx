import { Metadata } from 'next'
import FicheHub from '@/app/fiches/_components/FicheHub'
import type { FicheTileData } from '@/app/fiches/_components/ficheUi'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Revision from '@/models/Revision'
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
    const url = `https://workyt.fr/fiches/matiere/${slug}`
    const title = `Fiches de révision ${subject} gratuites | Workyt`
    const description = `Toutes les fiches de révision de ${subject} créées par la communauté Workyt. Brevet, bac, examens — révise gratuitement.`
    return {
        title,
        description,
        keywords: `fiches révision ${subject}, ${subject} brevet, ${subject} bac, fiches gratuites ${subject}, révision ${subject}`,
        alternates: { canonical: url },
        openGraph: {
            title, description, url, siteName: 'Workyt', type: 'website', locale: 'fr_FR',
            images: [{ url: 'https://workyt.fr/workytfiche.png', width: 1200, height: 630, alt: `Fiches ${subject} - Workyt` }],
        },
        twitter: { card: 'summary_large_image', site: '@workyt_fr', title, description },
        robots: { index: true, follow: true },
    }
}

export const revalidate = 3600

export default async function MatiereFichesPage({ params }: PageProps) {
    const { matiere: slug } = await params
    const subject = slugToSubject(slug)
    if (!subject) notFound()

    let fiches: any[] = []
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000)),
        ])
        fiches = await Revision.find({ subject })
            .select('_id title slug content subject level status likes files createdAt updatedAt')
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(60)
            .lean()
    } catch (err) {
        console.error('Hub fiches/matiere DB error:', err)
    }

    const items: FicheTileData[] = fiches.map((f: any) => ({
        id: f._id.toString(),
        title: f.title,
        slug: f.slug,
        subject: f.subject,
        level: f.level,
        status: f.status,
        content: typeof f.content === 'string' ? f.content.slice(0, 1200) : '',
        likes: typeof f.likes === 'number' ? f.likes : undefined,
        date: f.createdAt,
    }))

    const url = `https://workyt.fr/fiches/matiere/${slug}`
    const collectionLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Fiches de révision ${subject}`,
        url,
        description: `Catalogue des fiches de révision gratuites de ${subject} sur Workyt.`,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Workyt', url: 'https://workyt.fr' },
        hasPart: fiches.map((f: any) => ({
            '@type': 'LearningResource',
            name: f.title,
            url: `https://workyt.fr/fiches/${buildIdSlug(f._id.toString(), f.slug || f.title)}`,
            inLanguage: 'fr',
            educationalLevel: f.level,
            about: subject,
        })),
    }
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://workyt.fr' },
            { '@type': 'ListItem', position: 2, name: 'Fiches', item: 'https://workyt.fr/fiches' },
            { '@type': 'ListItem', position: 3, name: subject, item: url },
        ],
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <FicheHub kind="matiere" label={subject} fiches={items} />
        </>
    )
}
