import { revalidatePath } from "next/cache";

/**
 * Invalide les pages publiques des cours (accueil, leçons, exercices, quiz,
 * versions imprimables) après une modification de contenu. Les pages sont
 * régénérées à la visite suivante (ISR), pas toutes d'un coup.
 */
export function revalidateCoursePages() {
    try {
        revalidatePath("/cours/[coursId]", "layout");
    } catch (err) {
        console.error("Revalidation des pages cours impossible :", err);
    }
}
