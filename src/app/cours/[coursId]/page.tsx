import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import CourseClientWrapper from "@/app/cours/_components/CourseClientWrapper";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import { extractIdFromSlug, buildIdSlug, slugify } from "@/utils/slugify";

interface PageProps {
    params: Promise<{ coursId: string }>;
}

/**
 * Trouve un cours par ID (composite id-slug) ou par slug pur.
 */
async function findCourse(idSlug: string) {
    const objectId = extractIdFromSlug(idSlug);

    if (objectId) {
        const cours: any = await Course.findById(objectId).populate('authors', 'username').lean();
        if (cours) return { cours, id: objectId };
    }

    // Fallback : chercher par slug
    const cours: any = await Course.findOne({ slug: idSlug }).populate('authors', 'username').lean();
    if (cours) return { cours, id: cours._id.toString() };

    return null;
}

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
            title: `${cours.title} - Cours ${cours.matiere} ${cours.niveau} | Workyt`,
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

    await dbConnect();
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
        jsonLd.push({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": cours.title,
            "description": cours.description,
            "provider": {
                "@type": "Organization",
                "name": "Workyt",
                "url": "https://workyt.fr",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://workyt.fr/default-thumbnail.png",
                },
            },
            "author": authorNames.map((name: string) => ({
                "@type": "Person",
                "name": name,
            })),
            "educationalLevel": cours.niveau,
            "about": {
                "@type": "Thing",
                "name": cours.matiere,
            },
            "inLanguage": "fr",
            "isAccessibleForFree": true,
            "url": pageUrl,
            "dateCreated": cours.createdAt ? new Date(cours.createdAt).toISOString() : undefined,
            "dateModified": cours.updatedAt ? new Date(cours.updatedAt).toISOString() : undefined,
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

    return (
        <>
            {jsonLd.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <CourseClientWrapper params={{ coursId: id }} />
        </>
    );
}
