import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Déposer une question | Workyt",
    description: "Déposez une question pour obtenir de l'aide de la communauté Workyt. Forum d'entraide scolaire gratuit.",
    robots: { index: false, follow: true },
    openGraph: {
        title: "Déposer une question | Workyt",
        description: "Déposez une question pour obtenir de l'aide de la communauté Workyt.",
        images: [
            {
                url: "https://workyt.fr/workytforum.png",
                width: 1200,
                height: 630,
                alt: "Déposer une question sur Workyt",
            },
        ],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
