import { NextRequest, NextResponse } from "next/server";
import { currentUserId } from "@/lib/bearerUser";
import { rateLimit, rateLimitResponse, getIP } from "@/lib/rateLimit";
import { deleteAccount, AccountDeletionError } from "@/lib/accountDeletion";

/**
 * Suppression du compte de l'utilisateur connecté (exigence Google Play).
 *
 * Authentification : session du site OU jeton Bearer de l'application mobile.
 * Corps obligatoire : { confirm: "SUPPRIMER" }, pour qu'aucun appel accidentel
 * ne puisse effacer un compte. Réponse : { success: true }.
 *
 * Après coup, l'app mobile oublie simplement son jeton ; le site appelle
 * signOut() côté client.
 */
export async function DELETE(req: NextRequest) {
    const ipLimit = rateLimit(`account-delete-ip:${getIP(req)}`, 10, 60 * 60_000);
    if (!ipLimit.success) return rateLimitResponse(ipLimit.retryAfterMs);

    const userId = await currentUserId();
    if (!userId) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userLimit = rateLimit(`account-delete:${userId}`, 3, 60 * 60_000);
    if (!userLimit.success) return rateLimitResponse(userLimit.retryAfterMs);

    const body = await req.json().catch(() => null);
    if (body?.confirm !== "SUPPRIMER") {
        return NextResponse.json(
            { error: "Confirmation manquante : envoie { confirm: \"SUPPRIMER\" }." },
            { status: 400 }
        );
    }

    try {
        await deleteAccount(userId);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        if (error instanceof AccountDeletionError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("Erreur lors de la suppression du compte:", error);
        return NextResponse.json(
            { error: "La suppression n'a pas pu aboutir. Réessaie, ou écris à admin@workyt.fr." },
            { status: 500 }
        );
    }
}
