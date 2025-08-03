import { Metadata } from "next";
import CourseClientWrapper from "@/app/cours/_components/CourseClientWrapper";
import { BASE_URL } from "@/utils/constants";

// Updated interface for the new Next.js params format
interface PageProps {
    params: Promise<{ coursId: string }>;
}

// Génération des métadonnées côté serveur (mise à jour pour async params)
export async function generateMetadata({
                                           params,
                                       }: PageProps): Promise<Metadata> {
    try {
        // Await the params Promise
        const { coursId } = await params;

        const res = await fetch(
            `${BASE_URL}/api/cours/${coursId}`,
            { 
                cache: "no-store",
                headers: {
                    'Content-Type': 'application/json',
                }
            }
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
                images:
                    (cours.image && cours.image.url) ||
                    "https://www.workyt.fr/default-thumbnail.png",
            },
        };
    } catch (error) {
        console.error("Erreur dans generateMetadata :", error);
        return {
            title: "Erreur",
            description:
                "Une erreur s'est produite lors de la récupération des métadonnées.",
        };
    }
}

// Updated component to handle async params
export default async function CoursePage({ params }: PageProps) {
    // Await the params Promise
    const resolvedParams = await params;

    // Pass the resolved params to the client wrapper
    return <CourseClientWrapper params={resolvedParams} />;
}