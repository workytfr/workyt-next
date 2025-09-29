import { Metadata } from "next";
import React from "react";
import QuestionDetailPage from "@/app/forum/_components/QuestionDetailPage";
import { BASE_URL } from "@/utils/constants";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";

// Interface mise à jour pour correspondre au format de params utilisé ailleurs
interface PageProps {
    params: Promise<{ id: string }>;
}

// Génération des paramètres statiques pour l'indexation SEO
export async function generateStaticParams() {
    try {
        // Connexion à la base de données avec timeout
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);
        
        // Récupération des questions validées et résolues pour la génération statique
        const questions = await Question.find({ 
            status: { $in: ['Validée', 'Résolue'] } 
        })
        .select('_id')
        .limit(100); // Limiter pour éviter un build trop long
        
        return questions.map((question) => ({
            id: question._id.toString(),
        }));
    } catch (error) {
        console.error('Erreur lors de la génération des paramètres statiques:', error);
        // Retourner un tableau vide en cas d'erreur pour permettre le build
        return [];
    }
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
    try {
        // Récupération des paramètres de l'URL
        const { id } = await params;

        // Connexion directe à la base de données pour éviter les erreurs de fetch lors du build
        await Promise.race([
            dbConnect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de connexion DB')), 5000)
            )
        ]);
        
        const question = await Question.findById(id).populate({
            path: "user",
            select: "username points",
        });

        if (!question) {
            return {
                title: "Question non trouvée",
                description: "La question que vous recherchez n'existe pas ou a été supprimée.",
            };
        }
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
                url: `https://workyt.fr/forum/${id}`,
                siteName: "Workyt",
                type: "article",
                images: [
                    {
                        url: (question.attachments && question.attachments.length > 0 && question.attachments[0]) ||
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
                canonical: `https://workyt.fr/forum/${id}`,
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

// Composant de page mis à jour pour utiliser async/await avec les params
export default async function QuestionPage({ params }: PageProps) {
    // Attendre la résolution de la promesse params
    const { id } = await params;

    return (
        <div>
            <QuestionDetailPage id={id} />
        </div>
    );
}