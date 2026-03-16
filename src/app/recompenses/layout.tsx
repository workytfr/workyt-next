import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Récompenses & Calendrier Mensuel | Workyt",
    description: "Découvrez les récompenses disponibles, participez aux événements et réclamez votre récompense quotidienne avec le calendrier mensuel. Gagnez des points et des diamants chaque jour !",
    keywords: "récompenses, événements, calendrier mensuel, récompenses quotidiennes, points, diamants, classement, Workyt",
    openGraph: {
        title: "Récompenses & Calendrier Mensuel | Workyt",
        description: "Découvrez les récompenses et réclamez votre récompense quotidienne sur Workyt.",
        type: "website",
        url: "https://workyt.fr/recompenses",
        siteName: "Workyt",
        locale: "fr_FR",
        images: [
            {
                url: "https://workyt.fr/default-thumbnail.png",
                width: 1200,
                height: 630,
                alt: "Récompenses et Calendrier Mensuel Workyt",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        creator: "@workyt_fr",
        title: "Récompenses & Calendrier Mensuel | Workyt",
        description: "Découvrez les récompenses et réclamez votre récompense quotidienne sur Workyt.",
        images: ["https://workyt.fr/default-thumbnail.png"],
    },
    alternates: {
        canonical: "https://workyt.fr/recompenses",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
