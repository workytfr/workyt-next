import { Metadata } from "next";
import React from "react";
import { notFound, redirect } from "next/navigation";
import QuestionDetailPage from "@/app/forum/_components/QuestionDetailPage";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import { extractIdFromSlug, buildIdSlug, slugify } from "@/utils/slugify";

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Trouve une question par ID (composite id-slug) ou par slug pur.
 * Supporte : "64a1b2c3...-mon-slug", "64a1b2c3...", "mon-slug"
 */
async function findQuestion(idSlug: string, populateFields?: any) {
    const objectId = extractIdFromSlug(idSlug);

    // Cas 1 : on a trouvé un ObjectID valide au début
    if (objectId) {
        const query = Question.findById(objectId);
        if (populateFields) query.populate(populateFields);
        const question = await query;
        if (question) return { question, id: objectId };
    }

    // Cas 2 : pas d'ObjectID → chercher par slug
    const query = Question.findOne({ slug: idSlug });
    if (populateFields) query.populate(populateFields);
    const question = await query;
    if (question) return { question, id: question._id.toString() };

    return null;
}

// Génération des paramètres statiques pour l'indexation SEO (avec slug dans l'URL)
export async function generateStaticParams() {
    try {
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);

        const questions = await Question.find({
            status: { $in: ['Validée', 'Résolue'] }
        })
        .select('_id title slug')
        .limit(100);

        return questions.map((question) => ({
            id: buildIdSlug(question._id.toString(), question.slug || question.title),
        }));
    } catch (error) {
        console.error('Erreur lors de la génération des paramètres statiques:', error);
        return [];
    }
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

        const result = await findQuestion(idSlug, { path: "user", select: "username points" });

        if (!result) {
            return {
                title: "Question non trouvée",
                description: "La question que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const { question, id } = result;

        // Construire l'URL canonique avec slug
        const slug = question.slug || slugify(question.title);
        const canonicalPath = buildIdSlug(id, slug);
        const canonicalUrl = `https://workyt.fr/forum/${canonicalPath}`;

        let metaDescription = "";
        if (question.description && question.description.whatINeed) {
            metaDescription = question.description.whatINeed;
        } else if (question.description && question.description.whatIDid) {
            metaDescription = question.description.whatIDid;
        }
        metaDescription = metaDescription ? metaDescription.slice(0, 150) + "..." : "Forum Workyt";

        return {
            title: question.title ? `${question.title} | Forum Workyt` : "Forum - Workyt",
            description: metaDescription,
            keywords: [
                question.subject,
                question.classLevel,
                "forum d'entraide",
                "aide scolaire",
                "questions réponses",
                "communauté étudiante"
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
                title: question.title,
                description: metaDescription,
                url: canonicalUrl,
                siteName: "Workyt",
                type: "article",
                images: [
                    {
                        url: (question.attachments && question.attachments.length > 0 && (question.attachments[0].startsWith("http") ? question.attachments[0] : `https://workyt.fr/api/file-proxy?questionId=${id}&index=0`)) ||
                            "https://workyt.fr/default-thumbnail.png",
                        width: 1200,
                        height: 630,
                        alt: question.title,
                    }
                ],
                locale: "fr_FR",
            },
            twitter: {
                card: "summary_large_image",
                title: question.title,
                description: metaDescription,
                images: ["https://workyt.fr/workytfiche.png"],
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
};

export default async function QuestionPage({ params }: PageProps) {
    const { id: idSlug } = await params;

    await dbConnect();
    const result = await findQuestion(idSlug, { path: 'user', select: 'username' });

    if (!result) {
        notFound();
    }

    const { id } = result;
    const question: any = result.question.toObject ? result.question.toObject() : result.question;

    // Redirection 301 vers l'URL canonique si le format n'est pas id-slug
    const slug = question.slug || slugify(question.title);
    const canonicalParam = buildIdSlug(id, slug);
    if (idSlug !== canonicalParam) {
        redirect(`/forum/${canonicalParam}`);
    }

    // JSON-LD structured data pour les rich snippets Google
    let jsonLd: object[] = [];
    try {
        const slug = question.slug || slugify(question.title);
        const canonicalPath = buildIdSlug(id, slug);
        const pageUrl = `https://workyt.fr/forum/${canonicalPath}`;

        // Compter les vraies réponses pour cette question
        const answerCount = await Answer.countDocuments({ question: id });

        // Récupérer la meilleure réponse si elle existe (pour le rich snippet "accepted answer")
        const bestAnswer: any = await Answer.findOne({
            question: id,
            status: 'Meilleure Réponse'
        }).populate('user', 'username').lean();

        // Schema QAPage - permet les rich snippets Q&A dans Google
        const qaSchema: any = {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
                "@type": "Question",
                "name": question.title,
                "text": question.description?.whatINeed || question.description?.whatIDid || '',
                "dateCreated": question.createdAt ? new Date(question.createdAt).toISOString() : undefined,
                "author": {
                    "@type": "Person",
                    "name": question.user?.username || "Anonyme",
                },
                "about": [
                    { "@type": "Thing", "name": question.subject },
                    { "@type": "Thing", "name": question.classLevel },
                ],
                "answerCount": answerCount,
                "upvoteCount": question.points || 0,
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
            "inLanguage": "fr",
        };

        // Ajouter la meilleure réponse acceptée si disponible (booste les rich snippets)
        if (bestAnswer) {
            qaSchema.mainEntity.acceptedAnswer = {
                "@type": "Answer",
                "text": bestAnswer.content?.replace(/<[^>]*>/g, ' ').slice(0, 300),
                "dateCreated": bestAnswer.createdAt ? new Date(bestAnswer.createdAt).toISOString() : undefined,
                "author": {
                    "@type": "Person",
                    "name": bestAnswer.user?.username || "Anonyme",
                },
                "upvoteCount": bestAnswer.likes || 0,
            };
        }

        jsonLd.push(qaSchema);

        // Schema BreadcrumbList - améliore la navigation dans les résultats Google
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
                    "name": "Forum",
                    "item": "https://workyt.fr/forum",
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": question.title,
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
            <QuestionDetailPage id={id} />
        </>
    );
}
