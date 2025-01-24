import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Réinitialisation du mot de passe | Workyt",
    description:
        "Réinitialisez votre mot de passe en toute sécurité. Veuillez saisir un nouveau mot de passe pour continuer.",
    openGraph: {
        title: "Réinitialisation du mot de passe | Workyt",
        description:
            "Réinitialisez votre mot de passe en toute sécurité. Veuillez saisir un nouveau mot de passe pour continuer.",
        type: "website",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}