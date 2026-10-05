import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { SCOPES } from "@/lib/oidc/config";
import { approve, decisionToken, hasConsent, parseAuthorizeRequest } from "@/lib/oidc/service";
import AuthorizeScreen from "./AuthorizeScreen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Se connecter avec Workyt", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * GET /oauth/authorize — « Se connecter avec Workyt » (OAuth 2.0 + OIDC).
 * Pas connecté : on se connecte ici même. Déjà autorisé : retour direct vers
 * l'application. Sinon : écran d'autorisation (une seule fois).
 */
export default async function AuthorizePage({ searchParams }: Props) {
    const sp = await searchParams;
    const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
    const query = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString();
    const parsed = parseAuthorizeRequest(get);

    if (!parsed.ok && parsed.fatal) return <AuthorizeScreen mode="error" message={parsed.message} query={query} />;
    if (!parsed.ok) redirect(parsed.redirect);

    const { req } = parsed;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return <AuthorizeScreen mode="login" clientName={req.client.name} query={query} />;

    // Déjà autorisé (et pas de demande explicite de reconfirmation) : retour direct
    if (get("prompt") !== "consent" && (await hasConsent(userId, req))) redirect(await approve(userId, req, new Date()));

    return (
        <AuthorizeScreen
            mode="consent"
            query={query}
            clientName={req.client.name}
            clientHost={new URL(req.client.homepage).host}
            username={session.user.username || session.user.email || "toi"}
            scopes={req.scopes.map((s) => SCOPES[s])}
            token={decisionToken(userId, req)}
        />
    );
}
