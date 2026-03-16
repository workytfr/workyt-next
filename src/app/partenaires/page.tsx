import { Metadata } from "next";
import PartenairesPageClient from "./PartenairesPageClient";

export const metadata: Metadata = {
    title: "Nos Partenaires | Workyt",
    description:
        "Découvrez les partenaires Workyt : des entreprises et organisations engagées pour la réussite étudiante. Profitez de réductions exclusives, offres spéciales et avantages partout en France.",
    keywords: [
        "partenaires Workyt",
        "réductions étudiantes",
        "offres étudiantes",
        "avantages étudiants",
        "bons plans étudiants",
        "partenaires éducation",
    ],
    openGraph: {
        title: "Nos Partenaires | Workyt",
        description:
            "Découvrez les partenaires Workyt et profitez d'offres exclusives pour les étudiants partout en France.",
        type: "website",
    },
    alternates: {
        canonical: "/partenaires",
    },
};

export default function PartenairesPage() {
    return <PartenairesPageClient />;
}
