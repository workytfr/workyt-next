import { NextResponse } from "next/server";

/**
 * Helper pour gérer les erreurs dans les routes API
 * Détecte spécifiquement les erreurs JWT expiré et retourne un code 401 approprié
 */
export function handleApiError(error: any, defaultMessage: string = "Erreur serveur"): NextResponse {
    // Si le JWT est expiré, retourner un code 401 pour forcer la déconnexion
    if (error.code === "JWT_EXPIRED" || error.message?.includes("jwt expired") || error.message?.includes("Session expirée")) {
        return NextResponse.json(
            { error: "Session expirée. Veuillez vous reconnecter.", code: "JWT_EXPIRED" },
            { status: 401 }
        );
    }
    
    // Pour les autres erreurs, retourner un code 500 avec le message par défaut
    console.error(`Erreur API: ${defaultMessage}`, error.message || error);
    return NextResponse.json(
        { error: defaultMessage, details: error.message },
        { status: 500 }
    );
}

