import { Metadata } from "next";

export const metadata: Metadata = {
    title:
        "Créer une fiche de révision | Workyt",
    description:
        "Créez une fiche de révision pour aider les autres étudiants à réussir leurs examens.",
    openGraph: {
        title: "Créer une fiche de révision | Workyt",
        description:
            "Partagez vos connaissances en créant une fiche de révision pour les autres étudiants.",
        images: [
            {
                url: "/workytfiche.png",
                width: 800,
                height: 600,
                alt: "Créer une fiche de révision",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt",
        title: "Créer une fiche de révision | Workyt",
        description:
            "Créez une fiche de révision pour aider les autres étudiants à réussir leurs examens.",
        images: ["https://www.workyt.fr/workytfiche.png"],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
