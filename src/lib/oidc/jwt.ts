import crypto from "crypto";
import { issuer } from "./config";

/**
 * Signature des jetons (RS256) avec la clé privée OIDC_PRIVATE_KEY (PEM).
 * La clé publique est publiée sur /oauth/jwks : le blog vérifie les jetons
 * sans jamais connaître la clé privée.
 *
 * En développement, sans clé configurée, une clé temporaire est générée (elle
 * change à chaque redémarrage). En production, la clé est obligatoire.
 */

type Keys = { privateKey: crypto.KeyObject; publicKey: crypto.KeyObject; kid: string };
const store = globalThis as unknown as { __oidcKeys?: Keys };

function loadKeys(): Keys {
    if (store.__oidcKeys) return store.__oidcKeys;
    const pem = process.env.OIDC_PRIVATE_KEY?.replace(/\\n/g, "\n");
    let privateKey: crypto.KeyObject;
    if (pem) privateKey = crypto.createPrivateKey(pem);
    else if (process.env.NODE_ENV !== "production") {
        console.warn("[oidc] OIDC_PRIVATE_KEY absente : clé temporaire de développement");
        privateKey = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    } else throw new Error("OIDC_PRIVATE_KEY manquante (voir scripts/oidc-generate-key.mjs)");
    const publicKey = crypto.createPublicKey(privateKey);
    // Identifiant de clé : empreinte de la clé publique (change si on change de clé)
    const kid = crypto.createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("base64url").slice(0, 16);
    store.__oidcKeys = { privateKey, publicKey, kid };
    return store.__oidcKeys;
}

export function jwks() {
    const { publicKey, kid } = loadKeys();
    const jwk = publicKey.export({ format: "jwk" }) as { kty: string; n: string; e: string };
    return { keys: [{ kty: jwk.kty, n: jwk.n, e: jwk.e, kid, use: "sig", alg: "RS256" }] };
}

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

export function signJwt(payload: Record<string, unknown>, ttlSeconds: number): string {
    const { privateKey, kid } = loadKeys();
    const now = Math.floor(Date.now() / 1000);
    const body = { iss: issuer(), iat: now, exp: now + ttlSeconds, ...payload };
    const data = `${b64({ alg: "RS256", typ: "JWT", kid })}.${b64(body)}`;
    return `${data}.${crypto.sign("sha256", Buffer.from(data), privateKey).toString("base64url")}`;
}

/** Vérifie un jeton émis par workyt.fr : signature, émetteur, expiration. Renvoie son contenu ou null. */
export function verifyJwt(token: string): Record<string, unknown> | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
        const { publicKey, kid } = loadKeys();
        if (header.alg !== "RS256" || header.kid !== kid) return null;
        if (!crypto.verify("sha256", Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, Buffer.from(parts[2], "base64url"))) return null;
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        if (payload.iss !== issuer() || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}
