import { jsonLd as serializeJsonLd } from "@/lib/jsonLd";
import { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import CourseClientWrapper from "@/app/cours/_components/CourseClientWrapper";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import { extractIdFromSlug, buildIdSlug, slugify } from "@/utils/slugify";

interface PageProps {
    params: Promise<{ coursId: string }>;
}

// Filet de sécurité : régénère la page au plus toutes les 5 min même si une modification
// n'a pas déclenché de revalidation à la source (voir revalidatePath dans PUT /api/courses/[id]).
export const revalidate = 300;

/**
 * Trouve un cours par ID (composite id-slug) ou par slug pur, avec tout ce
 * dont la page a besoin (auteurs, vérificateur, sections) : même payload que
 * GET /api/cours/[id]. `cache()` partage le résultat entre generateMetadata et
 * la page — une seule requête par rendu au lieu de trois.
 */
const findCourse = cache(async (idSlug: string) => {
    await dbConnect();
    const objectId = extractIdFromSlug(idSlug);
    const filter = objectId ? { _id: objectId } : { slug: idSlug };

    let cours: any = await Course.findOne(filter)
        .populate('authors', 'username image')
        .populate('verifiedBy', 'username image')
        .populate({
            path: 'sections',
            select: 'title order',
            options: { sort: { order: 1 } },
        })
        .lean();

    // Fallback : un ID mal formé peut aussi être un slug pur
    if (!cours && objectId) {
        cours = await Course.findOne({ slug: idSlug })
            .populate('authors', 'username image')
            .populate('verifiedBy', 'username image')
            .populate({ path: 'sections', select: 'title order', options: { sort: { order: 1 } } })
            .lean();
    }
    if (!cours) return null;
    return { cours, id: cours._id.toString() };
});

// Génération des paramètres statiques pour les cours publiés
export async function generateStaticParams() {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const courses = await Course.find({ status: 'publie' })
            .select('_id title slug')
            .limit(200);

        return courses.map((course: any) => ({
            coursId: buildIdSlug(course._id.toString(), course.slug || course.title),
        }));
    } catch (error) {
        console.error('Erreur lors de la génération des paramètres statiques cours:', error);
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const { coursId: coursIdSlug } = await params;

        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const result = await findCourse(coursIdSlug);

        if (!result) {
            return {
                title: "Cours non trouvé",
                description: "Le cours que vous recherchez n'existe pas ou a été supprimé.",
            };
        }

        const { cours, id } = result;
        const slug = cours.slug || slugify(cours.title);
        const canonicalPath = buildIdSlug(id, slug);
        const canonicalUrl = `https://workyt.fr/cours/${canonicalPath}`;

        const metaDescription = cours.description
            ? cours.description.slice(0, 150) + "..."
            : "Cours Workyt";

        const imageUrl = cours.image || "https://workyt.fr/default-thumbnail.png";

        return {
            title: { absolute: `${cours.title} - Cours ${cours.matiere} ${cours.niveau} | Workyt` },
            description: metaDescription,
            keywords: [
                cours.matiere,
                cours.niveau,
                "cours gratuit",
                "apprentissage",
                cours.title,
            ].filter(Boolean).join(", "),
            authors: [{ name: "Workyt" }],
            creator: "Workyt",
            publisher: "Workyt",
            // Brouillon : la page reste accessible (aperçu auteur côté client)
            // mais ne doit pas être indexée.
            robots: cours.status !== 'publie' ? { index: false, follow: false } : {
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
                title: `${cours.title} - Cours - Workyt`,
                description: metaDescription,
                url: canonicalUrl,
                siteName: "Workyt",
                type: "article",
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: cours.title,
                    },
                ],
                locale: "fr_FR",
            },
            twitter: {
                card: "summary_large_image",
                title: `${cours.title} - Cours - Workyt`,
                description: metaDescription,
                images: [imageUrl],
                creator: "@workyt_fr",
            },
            alternates: {
                canonical: canonicalUrl,
            },
        };
    } catch (error) {
        console.error("Erreur dans generateMetadata :", error);
        return {
            title: "Erreur",
            description: "Une erreur s'est produite lors de la récupération des métadonnées.",
        };
    }
}

export default async function CoursePage({ params }: PageProps) {
    const { coursId: coursIdSlug } = await params;

    const result = await findCourse(coursIdSlug);

    if (!result) {
        notFound();
    }

    const { cours, id } = result;

    // Redirection 301 vers l'URL canonique si le format n'est pas id-slug
    const slug = cours.slug || slugify(cours.title);
    const canonicalParam = buildIdSlug(id, slug);
    if (coursIdSlug !== canonicalParam) {
        redirect(`/cours/${canonicalParam}`);
    }

    // JSON-LD structured data pour les cours
    let jsonLd: object[] = [];
    try {
        const slug = cours.slug || slugify(cours.title);
        const canonicalPath = buildIdSlug(id, slug);
        const pageUrl = `https://workyt.fr/cours/${canonicalPath}`;
        const authorNames = cours.authors?.map((a: any) => a.username) || ['Workyt'];

        // Schema Course - contenu éducatif structuré
        // Inclut hasCourseInstance + image pour éligibilité aux rich results Google
        const courseImage = cours.image || "https://workyt.fr/workytcours.png";
        jsonLd.push({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": cours.title,
            "description": cours.description,
            "image": courseImage,
            "provider": {
                "@type": "Organization",
                "name": "Workyt",
                "url": "https://workyt.fr",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://workyt.fr/apple-touch-icon.png",
                },
                "sameAs": [
                    "https://twitter.com/workyt_fr",
                    "https://www.instagram.com/workyt/",
                    "https://www.linkedin.com/company/workyt",
                    "https://dc.gg/workyt",
                ],
            },
            "author": authorNames.map((name: string) => ({
                "@type": "Person",
                "name": name,
                "memberOf": { "@type": "Organization", "name": "Workyt" },
            })),
            "educationalLevel": cours.niveau,
            "about": {
                "@type": "Thing",
                "name": cours.matiere,
            },
            "inLanguage": "fr",
            "isAccessibleForFree": true,
            "url": pageUrl,
            "identifier": id,
            "dateCreated": cours.createdAt ? new Date(cours.createdAt).toISOString() : undefined,
            "dateModified": cours.updatedAt ? new Date(cours.updatedAt).toISOString() : undefined,
            "hasCourseInstance": [{
                "@type": "CourseInstance",
                "courseMode": "online",
                "inLanguage": "fr",
                "isAccessibleForFree": true,
                "courseWorkload": "PT2H",
            }],
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "category": "Free",
            },
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
                    "name": "Cours",
                    "item": "https://workyt.fr/cours",
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": cours.title,
                    "item": pageUrl,
                },
            ],
        });
    } catch {
        // Ignorer l'erreur, on affiche la page sans JSON-LD
    }

    // Hydratation côté serveur (SEO) : seulement pour un cours publié, les
    // brouillons restent chargés par le client avec les droits de l'auteur.
    // Sérialisation JSON-safe (ObjectId, Date → string).
    const initialCours = cours.status === 'publie' ? JSON.parse(JSON.stringify(cours)) : null;

    return (
        <>
            {jsonLd.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
                />
            ))}
            <CourseClientWrapper params={{ coursId: id }} initialCours={initialCours} />
        </>
    );
}
