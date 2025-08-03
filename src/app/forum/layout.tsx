import { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://www.workyt.fr"),
    title: "Forum d'entraide | Workyt - Posez vos questions et obtenez de l'aide",
    description: "Posez vos questions et obtenez des réponses de la communauté Workyt. Forum d'entraide gratuit pour tous les niveaux d'études.",
    keywords: "forum d'entraide, aide scolaire, questions réponses, communauté étudiante, entraide, soutien scolaire",
    authors: [{ name: "Workyt" }],
    creator: "Workyt",
    publisher: "Workyt",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Forum d'entraide | Workyt - Posez vos questions et obtenez de l'aide",
        description: "Posez vos questions et obtenez des réponses de la communauté Workyt. Forum d'entraide gratuit pour tous les niveaux d'études.",
        url: "https://www.workyt.fr/forum",
        siteName: "Workyt",
        images: [
            {
                url: "/workytforum.png",
                width: 1200,
                height: 630,
                alt: "Forum d'entraide Workyt - Communauté d'aide aux études",
            },
        ],
        locale: "fr_FR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt",
        creator: "@workyt",
        title: "Forum d'entraide | Workyt - Posez vos questions et obtenez de l'aide",
        description: "Posez vos questions et obtenez des réponses de la communauté Workyt. Forum d'entraide gratuit.",
        images: ["https://www.workyt.fr/workytforum.png"],
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
    verification: {
        google: "votre-code-verification-google",
    },
    alternates: {
        canonical: "https://www.workyt.fr/forum",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}