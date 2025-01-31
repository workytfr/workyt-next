import { Metadata } from "next";

export const metadata: Metadata = {
    title:
        "Déposer une question | Workyt",
    description:
        "Déposez une question pour obtenir de l'aide de la communauté.",
    openGraph: {
        title: "Déposer une question | Workyt",
        description:
            "Déposez une question pour obtenir de l'aide de la communauté.",
        images: [
            {
                url: "/workytquestion.png",
                width: 800,
                height: 600,
                alt: "Déposer une question",
            },
        ],
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
