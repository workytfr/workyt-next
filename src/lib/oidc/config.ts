/**
 * workyt.fr fournisseur d'identité (OAuth 2.0 + OpenID Connect) : « Se
 * connecter avec Workyt » sur le blog (cahier des charges du blog, § 5).
 *
 * Liste blanche des applications clientes : seules celles-ci peuvent demander
 * une connexion, et seulement vers leurs adresses de retour exactes.
 */

export interface OidcClient {
    id: string;
    name: string;
    /** Variable d'environnement qui contient le secret du client */
    secretEnv: string;
    /** Adresses de retour autorisées (correspondance exacte) */
    redirectUris: string[];
    /** Où renvoyer après « se déconnecter partout » */
    postLogoutUris: string[];
    /** Site du client (affiché sur l'écran d'autorisation) */
    homepage: string;
}

const dev = process.env.NODE_ENV !== "production";

export const OIDC_CLIENTS: Record<string, OidcClient> = {
    blog: {
        id: "blog",
        name: "Le blog de Workyt",
        secretEnv: "OIDC_BLOG_CLIENT_SECRET",
        homepage: "https://blog.workyt.fr",
        redirectUris: [
            "https://blog.workyt.fr/api/auth/callback/workyt",
            "https://blog.workyt.fr/api/auth/callback/workyt/",
            // Développement local du blog (jamais accepté en production)
            ...(dev ? ["http://localhost:3100/api/auth/callback/workyt", "http://localhost:3100/api/auth/callback/workyt/"] : []),
        ],
        postLogoutUris: ["https://blog.workyt.fr/", ...(dev ? ["http://localhost:3100/"] : [])],
    },
};

/** Ce qu'une application peut demander, et ce que l'écran d'autorisation en dit */
export const SCOPES: Record<string, string> = {
    openid: "Savoir que c'est bien toi (ton identifiant Workyt)",
    profile: "Ton pseudo et ton avatar",
    email: "Ton adresse e-mail",
    role: "Ton rôle sur Workyt (Apprenti, Rédacteur, Admin…)",
};

/** Adresse publique de workyt.fr (émetteur des jetons) */
export function issuer(): string {
    return (process.env.OIDC_ISSUER || process.env.NEXTAUTH_URL || "https://workyt.fr").replace(/\/$/, "");
}

export const CODE_TTL_S = 60;
export const ACCESS_TTL_S = 60 * 60;
export const ID_TOKEN_TTL_S = 10 * 60;
