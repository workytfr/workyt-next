import { Metadata } from "next";
import FicheView from "@/app/fiches/_components/FicheView";
import React from "react";

// Fonction pour générer des métadonnées
export const generateMetadata = async ({ params }: { params: { id: string } }): Promise<Metadata> => {
    try {
        // Appel de l'API pour récupérer les données
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fiches/${params.id}`, {
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

// Composant principal de la page
export default function FichePage({ params }: { params: { id: string } }) {
    return (
        <div>
            {/* Affichage de la fiche */}
            <FicheView id={params.id} />
        </div>
    );
}
