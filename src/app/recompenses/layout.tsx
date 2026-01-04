import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Récompenses & Calendrier Mensuel | Workyt",
    description: "Découvrez les récompenses disponibles, participez aux événements et réclamez votre récompense quotidienne avec le calendrier mensuel. Gagnez des points et des diamants chaque jour !",
    keywords: "récompenses, événements, calendrier mensuel, récompenses quotidiennes, points, diamants, classement, Workyt",
    openGraph: {
        title: "Récompenses & Calendrier Mensuel | Workyt",
        description: "Découvrez les récompenses disponibles, participez aux événements et réclamez votre récompense quotidienne avec le calendrier mensuel. Gagnez des points et des diamants chaque jour !",
        type: "website",
        images: [
            {
                url: "/workytreward.png",
                width: 800,
                height: 600,
                alt: "Récompenses et Calendrier Mensuel Workyt",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Récompenses & Calendrier Mensuel | Workyt",
        description: "Découvrez les récompenses disponibles, participez aux événements et réclamez votre récompense quotidienne avec le calendrier mensuel.",
        images: ["https://www.workyt.fr/workytreward.png"],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}