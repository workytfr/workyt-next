import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cours | Workyt - La plate-forme d'apprentissage gratuite",
    description: "Accédez à une large sélection de cours sur Workyt et développez vos compétences professionnelles et personnelles.",
    openGraph: {
        title: "Cours | Workyt - La plate-forme d'apprentissage gratuite",
        description: "Découvrez des formations de qualité sur Workyt pour booster votre carrière.",
        images: [
            {
                url: "/workytfiche.png",
                width: 1200,
                height: 630,
                alt: "Aperçu des cours Workyt avec différentes catégories d'apprentissage.",
            },
        ],
        type: "website",
        url: "https://www.workyt.com/cours",
        siteName: "Workyt",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt",
        title: "Cours | Workyt - La plate-forme d'apprentissage gratuite",
        description: "Trouvez des cours adaptés à vos besoins et apprenez auprès d'experts.",
        images: ["/workytfiche.png"],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
