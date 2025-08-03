import { Metadata } from "next";
import FicheView from "@/app/fiches/_components/FicheView";
import React from "react";
import { BASE_URL } from "@/utils/constants";

// Updated interface for the new Next.js params format
interface PageProps {
    params: Promise<{ id: string }>;
}

// Fonction pour générer des métadonnées (mise à jour pour async params)
export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
    try {
        // Await the params Promise
        const { id } = await params;

        // Appel de l'API pour récupérer les données
        const response = await fetch(`${BASE_URL}/api/fiches/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error("Erreur API : ", response.statusText);
            return {
                title: "Fiche non trouvée",
                description: "La fiche que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const data = await response.json();

        if (!data.success) {
            return {
                title: "Fiche non trouvée",
                description: "La fiche que vous recherchez n'existe pas ou a été supprimée.",
            };
        }

        const fiche = data.data;

        return {
            title: "Workyt - " + fiche.title,
            description: fiche.content.slice(0, 150) + "...",
            openGraph: {
                title: fiche.title,
                description: fiche.content.slice(0, 150) + "...",
                images: fiche.files?.[0] || "/default-thumbnail.png",
            },
            twitter: {
                card: "summary_large_image",
                title: fiche.title,
                description: fiche.content.slice(0, 150) + "...",
                images: fiche.files?.[0] || "https://www.workyt.fr/default-thumbnail.png",
            },
        };
    } catch (error) {
        console.error("Erreur dans generateMetadata :", error);
        return {
            title: "Erreur",
            description: "Une erreur s'est produite lors de la récupération des métadonnées.",
        };
    }
};

// Composant principal de la page (mise à jour pour async params)
export default async function FichePage({ params }: PageProps) {
    // Await the params Promise
    const { id } = await params;

    return (
        <div>
            {/* Affichage de la fiche */}
            <FicheView id={id} />
        </div>
    );
}