import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forum d'entraide | Workyt - Posez vos questions et obtenez de l'aide",
    description: "Posez vos questions et obtenez des réponses de la communauté Workyt. Forum d'entraide scolaire gratuit pour tous les niveaux d'études.",
    keywords: "forum d'entraide, aide scolaire, questions réponses, communauté étudiante, entraide, soutien scolaire",
    authors: [{ name: "Workyt" }],
    creator: "Workyt",
    publisher: "Workyt",
    openGraph: {
        title: "Forum d'entraide | Workyt",
        description: "Posez vos questions et obtenez des réponses de la communauté Workyt. Forum d'entraide scolaire gratuit.",
        url: "https://workyt.fr/forum",
        siteName: "Workyt",
        images: [
            {
                url: "https://workyt.fr/workytforum.png",
                width: 1200,
                height: 630,
                alt: "Forum d'entraide Workyt",
            },
        ],
        locale: "fr_FR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        creator: "@workyt_fr",
        title: "Forum d'entraide | Workyt",
        description: "Posez vos questions et obtenez des réponses de la communauté Workyt.",
        images: ["https://workyt.fr/workytforum.png"],
    },
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
    alternates: {
        canonical: "https://workyt.fr/forum",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
