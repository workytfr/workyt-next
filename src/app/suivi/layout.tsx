import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Suivi personnalisé avec un bénévole | Workyt",
    description:
        "Un bénévole de l'association Workyt t'accompagne pendant plusieurs semaines : conversation privée, plan d'objectifs, cours et quiz choisis pour toi. Gratuit, du collège au supérieur.",
    alternates: { canonical: "https://workyt.fr/suivi" },
    openGraph: {
        title: "Suivi personnalisé avec un bénévole | Workyt",
        description: "Un bénévole de l'association t'accompagne, gratuitement, jusqu'à ce que ça aille mieux.",
        url: "https://workyt.fr/suivi",
        siteName: "Workyt",
        locale: "fr_FR",
        type: "website",
    },
};

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
