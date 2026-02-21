import React from "react";
import ForumPageClient from "./_components/ForumPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forum d'entraide scolaire | Workyt",
    description: "Posez vos questions et obtenez de l'aide de la communauté Workyt. Forum d'entraide scolaire gratuit pour collégiens et lycéens : mathématiques, physique, français, histoire et plus.",
    keywords: "forum entraide scolaire, aide devoirs, questions réponses, mathématiques, physique, français, lycée, collège, bac, brevet",
    openGraph: {
        title: "Forum d'entraide scolaire | Workyt",
        description: "Posez vos questions et obtenez de l'aide de la communauté Workyt. Forum d'entraide scolaire gratuit.",
        url: "https://workyt.fr/forum",
        siteName: "Workyt",
        type: "website",
        locale: "fr_FR",
        images: [
            {
                url: "https://workyt.fr/default-thumbnail.png",
                width: 1200,
                height: 630,
                alt: "Forum Workyt",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Forum d'entraide scolaire | Workyt",
        description: "Posez vos questions et obtenez de l'aide de la communauté Workyt.",
        creator: "@workyt_fr",
    },
    alternates: {
        canonical: "https://workyt.fr/forum",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function ForumPage() {
    return <ForumPageClient />;
}
