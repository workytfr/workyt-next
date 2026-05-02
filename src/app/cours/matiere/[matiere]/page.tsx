import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Course from '@/models/Course'
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
    const url = `https://workyt.fr/cours/matiere/${slug}`
    const title = `Cours de ${subject} gratuits | Workyt`
    const description = `Tous les cours gratuits de ${subject} sur Workyt : collège, lycée et supérieur. Bibliothèque pédagogique de l'asso d'entraide scolaire.`
    return {
        title,
        description,
        keywords: `${subject}, cours ${subject}, ${subject} gratuit, cours en ligne ${subject}, collège, lycée, bac, brevet`,
        alternates: { canonical: url },
        openGraph: {
            title, description, url, siteName: 'Workyt', type: 'website', locale: 'fr_FR',
            images: [{ url: 'https://workyt.fr/workytcours.png', width: 1200, height: 630, alt: `Cours de ${subject} - Workyt` }],
        },
        twitter: { card: 'summary_large_image', site: '@workyt_fr', title, description },
        robots: { index: true, follow: true },
    }
}

export const revalidate = 3600

export default async function MatiereCoursPage({ params }: PageProps) {
    const { matiere: slug } = await params
    const subject = slugToSubject(slug)
    if (!subject) notFound()

    let courses: any[] = []
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000)),
        ])
        courses = await Course.find({ status: 'publie', matiere: subject })
            .select('_id title slug description niveau image updatedAt')
            .sort({ updatedAt: -1 })
            .limit(60)
            .lean()
    } catch (err) {
        console.error('Hub cours/matiere DB error:', err)
    }

    const url = `https://workyt.fr/cours/matiere/${slug}`
    const collectionLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Cours de ${subject}`,
        url,
        description: `Catalogue des cours gratuits de ${subject} sur Workyt.`,
        inLanguage: 'fr',
        isPartOf: { '@type': 'WebSite', name: 'Workyt', url: 'https://workyt.fr' },
        hasPart: courses.map((c: any) => ({
            '@type': 'Course',
            name: c.title,
            url: `https://workyt.fr/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`,
            provider: { '@type': 'Organization', name: 'Workyt', url: 'https://workyt.fr' },
        })),
    }
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://workyt.fr' },
            { '@type': 'ListItem', position: 2, name: 'Cours', item: 'https://workyt.fr/cours' },
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
                    <Link href="/cours" className="hover:text-orange-500">Cours</Link>
                    {' › '}
                    <span className="text-gray-900">{subject}</span>
                </nav>
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        Cours de {subject}
                    </h1>
                    <p className="mt-3 text-gray-600 max-w-2xl">
                        Retrouve tous les cours gratuits de <strong>{subject}</strong> publiés
                        par les bénévoles de Workyt. Du collège au supérieur, structurés en
                        chapitres avec exercices, quiz et fiches associées.
                    </p>
                </header>
                {courses.length === 0 ? (
                    <p className="text-gray-500">
                        Aucun cours de {subject} publié pour le moment.{' '}
                        <Link href="/cours" className="text-orange-500 underline">Voir tous les cours</Link>.
                    </p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((c: any) => {
                            const href = `/cours/${buildIdSlug(c._id.toString(), c.slug || c.title)}`
                            return (
                                <li key={c._id.toString()} className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-orange-200 hover:shadow-sm transition">
                                    <Link href={href} className="block">
                                        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{c.niveau}</div>
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
