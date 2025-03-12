import { Metadata } from "next";
import React from "react";
import QuestionDetailPage from "@/app/forum/_components/QuestionDetailPage";

export const generateMetadata = async ({
                                           params,
                                       }: {
    params: { id: string };
}): Promise<Metadata> => {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/forum/questions/${params.id}?page=1&limit=10`,
            { headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
            console.error("Erreur API : ", response.statusText);
            return {
                title: "Question non trouvée",
                description: "La question que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const data = await response.json();

        if (!data.success) {
            return {
                title: "Question non trouvée",
                description: "La question que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const question = data.question;
        let metaDescription = "";
        if (question.description && question.description.whatINeed) {
            metaDescription = question.description.whatINeed;
        } else if (question.description && question.description.whatIDid) {
            metaDescription = question.description.whatIDid;
        }
        metaDescription = metaDescription ? metaDescription.slice(0, 150) + "..." : "Forum Workyt";

        return {
            title: question.title ?  question.title : "Forum - Workyt",
            description: metaDescription,
            openGraph: {
                title: question.title,
                description: metaDescription,
                images:
                    (question.attachments && question.attachments.length > 0 && question.attachments[0]) ||
                    "/default-thumbnail.png",
            },
            twitter: {
                card: "summary_large_image",
                title: question.title,
                description: metaDescription,
                images: ["https://www.workyt.fr/workytfiche.png"],
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

export default function QuestionPage({ params }: { params: { id: string } }) {
    return (
        <div>
            <QuestionDetailPage id={params.id} />
        </div>
    );
}
