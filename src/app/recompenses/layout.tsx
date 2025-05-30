import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Récompenses | Workyt",
    description: "Découvrez les récompenses disponibles et comment participer.",
    openGraph: {
        title: "Récompenses | Workyt",
        description: "Découvrez les récompenses disponibles et comment participer.",
        images: [
            {
                url: "/workytreward.png",
                width: 800,
                height: 600,
                alt: "Récompenses Workyt",
            },
        ],
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}