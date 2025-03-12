import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forum | Workyt",
    description:
        "Posez vos questions et obtenez des réponses de la communauté Workyt.",
    openGraph: {
        title: "Forum | Workyt",
        description:
            "Posez vos questions et obtenez des réponses de la communauté Workyt.",
        images: [
            {
                url: "/workytfiche.png",
                width: 800,
                height: 600,
                alt: "Forum",
            },
        ],
        type: "profile",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt",
        title: "Forum | Workyt",
        description:
            "Posez vos questions et obtenez des réponses de la communauté Workyt.",
        images: ["https://www.workyt.fr/workytfiche.png"],
    },
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}