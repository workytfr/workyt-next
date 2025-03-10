import { Metadata } from "next";
import dynamic from "next/dynamic";

// Génération des métadonnées côté serveur
export async function generateMetadata({
                                           params,
                                       }: {
    params: { coursId: string };
}): Promise<Metadata> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/cours/${params.coursId}`,
            { cache: "no-store" }
        );
        if (!res.ok) {
            console.error("Erreur API :", res.statusText);
            return {
                title: "Cours non trouvé",
                description: "Le cours que vous recherchez n'existe pas ou a été supprimé.",
            };
        }
        const data = await res.json();
        const cours = data?.cours;
        if (!cours) {
            return {
                title: "Cours non trouvé",
                description: "Le cours que vous recherchez n'existe pas ou a été supprimé.",
            };
        }
        const metaDescription = cours.description
            ? cours.description.slice(0, 150) + "..."
            : "Cours Workyt";

        return {
            title: `${cours.title} - Cours - Workyt` || "Cours - Workyt",
            description: metaDescription,
            openGraph: {
                title: `${cours.title} - Cours - Workyt`,
                description: metaDescription,
                images: (cours.image && cours.image.url) || "/default-thumbnail.png",
            },
            twitter: {
                card: "summary_large_image",
                title: `${cours.title} - Cours - Workyt`,
                description: metaDescription,
                images: (cours.image && cours.image.url) || "/default-thumbnail.png",
            },
        };
    } catch (error) {
        console.error("Erreur dans generateMetadata :", error);
        return {
            title: "Erreur",
            description: "Une erreur s'est produite lors de la récupération des métadonnées.",
        };
    }
}

// Import dynamique du composant client pour désactiver le SSR sur celui-ci
const CoursePageClient = dynamic(() => import("./../_components/CoursePageClient"), {
    ssr: false,
});

// Composant de page qui délègue l'affichage au composant client
export default function CoursePage({ params }: { params: { coursId: string } }) {
    return <CoursePageClient params={params} />;
}
