import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cours gratuits | Workyt - Plateforme d'apprentissage",
    description: "Accédez à des cours gratuits sur Workyt : mathématiques, physique, français, histoire et plus. Contenu de qualité pour collégiens et lycéens.",
    keywords: "cours gratuits, apprentissage, mathématiques, physique, français, lycée, collège, bac, brevet",
    openGraph: {
        title: "Cours gratuits | Workyt",
        description: "Accédez à des cours gratuits pour le collège et le lycée sur Workyt.",
        images: [
            {
                url: "https://workyt.fr/workytcours.png",
                width: 1200,
                height: 630,
                alt: "Cours gratuits Workyt",
            },
        ],
        type: "website",
        url: "https://workyt.fr/cours",
        siteName: "Workyt",
        locale: "fr_FR",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        creator: "@workyt_fr",
        title: "Cours gratuits | Workyt",
        description: "Accédez à des cours gratuits pour le collège et le lycée sur Workyt.",
        images: ["https://workyt.fr/workytcours.png"],
    },
    alternates: {
        canonical: "https://workyt.fr/cours",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
