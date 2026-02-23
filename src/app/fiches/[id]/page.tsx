import { Metadata } from "next";
import FicheView from "@/app/fiches/_components/FicheView";
import React from "react";
import dbConnect from "@/lib/mongodb";
import Revision from "@/models/Revision";

interface PageProps {
    params: Promise<{ id: string }>;
}

// Génération des paramètres statiques pour l'indexation SEO
export async function generateStaticParams() {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const fiches = await Revision.find({})
            .select('_id')
            .lean()
            .limit(200);

        return fiches.map((fiche: any) => ({
            id: fiche._id.toString(),
        }));
    } catch (error) {
        console.error('Erreur lors de la génération des paramètres statiques fiches:', error);
        return [];
    }
}

// Nettoyage du HTML pour obtenir du texte brut pour les descriptions meta
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
        const { id } = await params;

        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const fiche: any = await Revision.findById(id).populate('author', 'username').lean();

        if (!fiche) {
            return {
                title: "Fiche non trouvée - Workyt",
                description: "La fiche que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const plainContent = stripHtml(fiche.content || '');
        const metaDescription = plainContent
            ? plainContent.slice(0, 155) + (plainContent.length > 155 ? '...' : '')
            : `Fiche de révision en ${fiche.subject} niveau ${fiche.level} sur Workyt.`;

        const title = `${fiche.title} - ${fiche.subject} ${fiche.level} | Workyt`;
        const authorName = fiche.author?.username || 'Workyt';
        const canonicalUrl = `https://workyt.fr/fiches/${id}`;
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
    const { id } = await params;

    // JSON-LD structured data pour les moteurs de recherche
    let jsonLd = null;
    try {
        await dbConnect();
        const fiche: any = await Revision.findById(id).populate('author', 'username').lean();

        if (fiche) {
            const plainContent = stripHtml(fiche.content || '');
            jsonLd = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": fiche.title,
                "description": plainContent.slice(0, 200),
                "author": {
                    "@type": "Person",
                    "name": fiche.author?.username || "Workyt",
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "Workyt",
                    "url": "https://workyt.fr",
                },
                "datePublished": fiche.createdAt?.toISOString(),
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": `https://workyt.fr/fiches/${id}`,
                },
                "about": {
                    "@type": "Thing",
                    "name": fiche.subject,
                },
                "educationalLevel": fiche.level,
                "inLanguage": "fr",
                "interactionStatistic": {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/LikeAction",
                    "userInteractionCount": fiche.likes || 0,
                },
            };
        }
    } catch {
        // Ignorer l'erreur, on affiche la page sans JSON-LD
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <FicheView id={id} />
        </>
    );
}
