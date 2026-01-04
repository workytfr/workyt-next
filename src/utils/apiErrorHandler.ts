import { signOut } from "next-auth/react";

/**
 * Vérifie si une réponse API indique que le JWT est expiré
 * et force la déconnexion si c'est le cas
 */
export async function handleApiError(response: Response): Promise<boolean> {
    if (response.status === 401) {
        try {
            const data = await response.json();
            // Si le code d'erreur indique que le JWT est expiré, forcer la déconnexion
            if (data.code === "JWT_EXPIRED" || data.error?.includes("Session expirée")) {
                console.warn("Session expirée, déconnexion en cours...");
                // Rediriger vers la page d'accueil (le formulaire de connexion est dans la navbar)
                await signOut({ callbackUrl: "/?session_expired=true", redirect: true });
                return true; // Indique que la déconnexion a été déclenchée
            }
        } catch (e) {
            // Si la réponse n'est pas du JSON valide, vérifier quand même le statut 401
            if (response.status === 401) {
                console.warn("Erreur d'authentification, déconnexion en cours...");
                // Rediriger vers la page d'accueil (le formulaire de connexion est dans la navbar)
                await signOut({ callbackUrl: "/?session_expired=true", redirect: true });
                return true;
            }
        }
    }
    return false; // Aucune déconnexion n'a été déclenchée
}

/**
 * Wrapper pour fetch qui gère automatiquement les erreurs JWT expiré
 */
export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const response = await fetch(url, options);
    
    // Vérifier si le JWT est expiré et forcer la déconnexion si nécessaire
    const wasLoggedOut = await handleApiError(response);
    
    if (wasLoggedOut) {
        // Créer une réponse d'erreur pour indiquer que la déconnexion a été déclenchée
        throw new Error("Session expirée. Déconnexion en cours...");
    }
    
    return response;
}

