import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Fiches de révision | Workyt",
    description:
        "Consultez les fiches de révision pour vous aider à réussir vos examens.",
    openGraph: {
        title: "Fiches de révision | Workyt",
        description:
            "Découvrez les fiches de révision créées par les autres étudiants pour vous aider à réussir vos examens.",
        images: [
            {
                url: "/workytfiche.png",
                width: 800,
                height: 600,
                alt: "Fiches de révision",
            },
        ],
        type: "profile",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt",
        title: "Fiches de révision | Workyt",
        description:
            "Consultez les fiches de révision pour vous aider à réussir vos examens.",
        images: ["https://www.workyt.fr/workytfiche.png"],
    },
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}