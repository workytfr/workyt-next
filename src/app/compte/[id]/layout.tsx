import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Profil utilisateur | Workyt",
    description:
        "Consultez les informations utilisateur, y compris leurs fiches de révision, leurs badges et leur biographie.",
    openGraph: {
        title: "Profil utilisateur | Workyt",
        description:
            "Découvrez le profil utilisateur avec des informations détaillées et des fiches de révision.",
        images: [
            {
                url: "/avatars/default.png",
                width: 800,
                height: 600,
                alt: "Avatar par défaut",
            },
        ],
        type: "profile",
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt",
        title: "Profil utilisateur | Workyt",
        description:
            "Consultez les informations utilisateur, y compris leurs fiches de révision, leurs badges et leur biographie.",
        images: ["https://www.workyt.fr/avatars/default.png"],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
