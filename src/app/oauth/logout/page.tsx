import type { Metadata } from "next";
import { OIDC_CLIENTS } from "@/lib/oidc/config";
import LogoutScreen from "./LogoutScreen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Déconnexion", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ post_logout_redirect_uri?: string; client_id?: string }> };

/**
 * GET /oauth/logout — « se déconnecter partout » : l'application (le blog) a
 * déjà fermé sa session ; on ferme celle de workyt.fr puis on y renvoie.
 * L'adresse de retour doit être déclarée par l'application (liste blanche).
 */
export default async function LogoutPage({ searchParams }: Props) {
    const sp = await searchParams;
    const allowed = Object.values(OIDC_CLIENTS).flatMap((c) => c.postLogoutUris);
    const target = sp.post_logout_redirect_uri && allowed.includes(sp.post_logout_redirect_uri) ? sp.post_logout_redirect_uri : "/";
    return <LogoutScreen target={target} />;
}
