import { Metadata } from "next";
import FicheView from "@/app/fiches/_components/FicheView";
import React from "react";
import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Revision from "@/models/Revision";
import { extractIdFromSlug, buildIdSlug, slugify } from "@/utils/slugify";

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Trouve une fiche par ID (composite id-slug) ou par slug pur.
 */
async function findFiche(idSlug: string) {
    const objectId = extractIdFromSlug(idSlug);

    if (objectId) {
        const fiche: any = await Revision.findById(objectId).populate('author', 'username').lean();
        if (fiche) return { fiche, id: objectId };
    }

    // Fallback : chercher par slug
    const fiche: any = await Revision.findOne({ slug: idSlug }).populate('author', 'username').lean();
    if (fiche) return { fiche, id: fiche._id.toString() };

    return null;
}

// Génération des paramètres statiques pour l'indexation SEO (avec slug)
export async function generateStaticParams() {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const fiches = await Revision.find({})
            .select('_id title slug')
            .lean()
            .limit(200);

        return fiches.map((fiche: any) => ({
            id: buildIdSlug(fiche._id.toString(), fiche.slug || fiche.title),
        }));
    } catch (error) {
        console.error('Erreur lors de la génération des paramètres statiques fiches:', error);
        return [];
    }
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
    try {
        const { id: idSlug } = await params;

        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const result = await findFiche(idSlug);

        if (!result) {
            return {
                title: "Fiche non trouvée - Workyt",
                description: "La fiche que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const { fiche, id } = result;
        const slug = fiche.slug || slugify(fiche.title);
        const canonicalPath = buildIdSlug(id, slug);
        const canonicalUrl = `https://workyt.fr/fiches/${canonicalPath}`;

        const plainContent = stripHtml(fiche.content || '');
        const metaDescription = plainContent
            ? plainContent.slice(0, 155) + (plainContent.length > 155 ? '...' : '')
            : `Fiche de révision en ${fiche.subject} niveau ${fiche.level} sur Workyt.`;

        const title = `${fiche.title} - ${fiche.subject} ${fiche.level} | Workyt`;
        const authorName = fiche.author?.username || 'Workyt';
        const imageUrl = fiche.files?.[0] || 'https://workyt.fr/default-thumbnail.png';

        return {
            title,
            description: metaDescription,
            keywords: [
                fiche.subject,
                fiche.level,
                "fiche de révision",
                "révision",
                "aide scolaire",
                "cours",
                fiche.title,
            ].filter(Boolean).join(", "),
            authors: [{ name: authorName }],
            creator: "Workyt",
            publisher: "Workyt",
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    "max-video-preview": -1,
                    "max-image-preview": "large",
                    "max-snippet": -1,
                },
            },
            openGraph: {
                title: fiche.title,
                description: metaDescription,
                url: canonicalUrl,
                siteName: "Workyt",
                type: "article",
                publishedTime: fiche.createdAt?.toISOString(),
                authors: [authorName],
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: fiche.title,
                    },
                ],
                locale: "fr_FR",
            },
            twitter: {
                card: "summary_large_image",
                title: fiche.title,
                description: metaDescription,
                images: [imageUrl],
                creator: "@workyt_fr",
            },
            alternates: {
                canonical: canonicalUrl,
            },
        };
    } catch (error) {
        console.error("Erreur dans generateMetadata fiches:", error);
        return {
            title: "Fiche de révision - Workyt",
            description: "Consultez les fiches de révision de la communauté Workyt.",
        };
    }
};

export default async function FichePage({ params }: PageProps) {
    const { id: idSlug } = await params;

    await dbConnect();
    const result = await findFiche(idSlug);

    if (!result) {
        notFound();
    }

    const { fiche, id } = result;

    // Redirection 301 vers l'URL canonique si le format n'est pas id-slug
    const slug = fiche.slug || slugify(fiche.title);
    const canonicalParam = buildIdSlug(id, slug);
    if (idSlug !== canonicalParam) {
        redirect(`/fiches/${canonicalParam}`);
    }

    // JSON-LD structured data pour les moteurs de recherche
    let jsonLd: object[] = [];
    try {
        const slug = fiche.slug || slugify(fiche.title);
        const canonicalPath = buildIdSlug(id, slug);
        const pageUrl = `https://workyt.fr/fiches/${canonicalPath}`;
        const plainContent = stripHtml(fiche.content || '');

        // Schema LearningResource (plus spécifique qu'Article pour du contenu éducatif)
        jsonLd.push({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            "headline": fiche.title,
            "name": fiche.title,
            "description": plainContent.slice(0, 200),
            "learningResourceType": "Fiche de révision",
            "educationalLevel": fiche.level,
            "about": {
                "@type": "Thing",
                "name": fiche.subject,
            },
            "author": {
                "@type": "Person",
                "name": fiche.author?.username || "Workyt",
            },
            "publisher": {
                "@type": "Organization",
                "name": "Workyt",
                "url": "https://workyt.fr",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://workyt.fr/default-thumbnail.png",
                },
            },
            "datePublished": fiche.createdAt ? new Date(fiche.createdAt).toISOString() : undefined,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": pageUrl,
            },
            "inLanguage": "fr",
            "interactionStatistic": {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/LikeAction",
                "userInteractionCount": fiche.likes || 0,
            },
            "isAccessibleForFree": true,
        });

        // Schema BreadcrumbList
        jsonLd.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Accueil",
                    "item": "https://workyt.fr",
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Fiches de révision",
                    "item": "https://workyt.fr/fiches",
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": fiche.title,
                    "item": pageUrl,
                },
            ],
        });
    } catch {
        // Ignorer l'erreur, on affiche la page sans JSON-LD
    }

    return (
        <>
            {jsonLd.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <FicheView id={id} />
        </>
    );
}
