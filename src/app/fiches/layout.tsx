import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Fiches de révision gratuites | Workyt",
    description:
        "Consultez et partagez des fiches de révision gratuites créées par la communauté Workyt. Mathématiques, physique, français, histoire, SVT et plus pour le bac, brevet et examens.",
    keywords: "fiches de révision, révision bac, révision brevet, fiches gratuites, mathématiques, physique, français, histoire, SVT, lycée, collège",
    openGraph: {
        title: "Fiches de révision gratuites | Workyt",
        description:
            "Découvrez les fiches de révision créées par la communauté étudiante pour vous aider à réussir vos examens.",
        url: "https://workyt.fr/fiches",
        siteName: "Workyt",
        images: [
            {
                url: "https://workyt.fr/workytfiche.png",
                width: 1200,
                height: 630,
                alt: "Fiches de révision Workyt",
            },
        ],
        type: "website",
        locale: "fr_FR",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        title: "Fiches de révision gratuites | Workyt",
        description:
            "Consultez les fiches de révision pour vous aider à réussir vos examens.",
        images: ["https://workyt.fr/workytfiche.png"],
    },
    alternates: {
        canonical: "https://workyt.fr/fiches",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
