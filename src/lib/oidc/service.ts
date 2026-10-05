import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ProfileCustomization from "@/models/ProfileCustomization";
import OAuthCode from "@/models/OAuthCode";
import OAuthConsent from "@/models/OAuthConsent";
import { ACCESS_TTL_S, CODE_TTL_S, ID_TOKEN_TTL_S, OIDC_CLIENTS, SCOPES, issuer, type OidcClient } from "./config";
import { signJwt } from "./jwt";

/**
 * Règles du fournisseur d'identité :
 * - client et adresse de retour en liste blanche (correspondance exacte) ;
 * - PKCE obligatoire (S256) ; code à usage unique, 60 s ;
 * - autorisation demandée une fois par application, révocable.
 */

export interface AuthorizeRequest {
    client: OidcClient;
    redirectUri: string;
    scopes: string[];
    state: string;
    nonce?: string;
    codeChallenge: string;
}

export type ParseResult =
    | { ok: true; req: AuthorizeRequest }
    /** fatal : client ou adresse de retour inconnus, on ne redirige surtout pas */
    | { ok: false; fatal: true; message: string }
    | { ok: false; fatal: false; redirect: string };

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("base64url");

/** Adresse de retour avec les paramètres OAuth (code, state, erreur…) */
function back(redirectUri: string, params: Record<string, string | undefined>): string {
    const u = new URL(redirectUri);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, v);
    u.searchParams.set("iss", issuer());
    return u.toString();
}

export function parseAuthorizeRequest(get: (k: string) => string | null | undefined): ParseResult {
    const client = OIDC_CLIENTS[get("client_id") || ""];
    if (!client) return { ok: false, fatal: true, message: "Application inconnue." };
    const redirectUri = get("redirect_uri") || "";
    if (!client.redirectUris.includes(redirectUri)) return { ok: false, fatal: true, message: "Adresse de retour non autorisée pour cette application." };
    const state = get("state") || undefined;
    const fail = (error: string, description: string) => ({ ok: false as const, fatal: false as const, redirect: back(redirectUri, { error, error_description: description, state }) });

    if (get("response_type") !== "code") return fail("unsupported_response_type", "Seul response_type=code est accepté.");
    const scopes = [...new Set((get("scope") || "").split(/\s+/).filter(Boolean))];
    if (!scopes.includes("openid")) return fail("invalid_scope", "La portée openid est obligatoire.");
    if (scopes.some((s) => !(s in SCOPES))) return fail("invalid_scope", "Portée inconnue.");
    const codeChallenge = get("code_challenge") || "";
    if (!codeChallenge || get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) return fail("invalid_request", "PKCE (S256) obligatoire.");
    if (!state) return fail("invalid_request", "Paramètre state manquant.");
    const nonce = get("nonce") || undefined;
    return { ok: true, req: { client, redirectUri, scopes, state, nonce: nonce?.slice(0, 200), codeChallenge } };
}

/** Jeton anti-falsification du formulaire d'autorisation (lié au membre et à la demande) */
export function decisionToken(userId: string, req: AuthorizeRequest): string {
    return crypto
        .createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev")
        .update([userId, req.client.id, req.redirectUri, req.codeChallenge, req.state, req.scopes.join(" ")].join("|"))
        .digest("base64url");
}

export function checkDecisionToken(userId: string, req: AuthorizeRequest, token: string): boolean {
    const expected = Buffer.from(decisionToken(userId, req));
    const given = Buffer.from(token || "");
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Le membre a-t-il déjà autorisé cette application pour ces informations ? */
export async function hasConsent(userId: string, req: AuthorizeRequest): Promise<boolean> {
    await connectDB();
    const c = await OAuthConsent.findOne({ user: userId, clientId: req.client.id, revokedAt: null }).lean();
    return !!c && req.scopes.every((s) => c.scopes.includes(s));
}

/** Autorisation accordée : code à usage unique, retour vers l'application */
export async function approve(userId: string, req: AuthorizeRequest, authTime: Date): Promise<string> {
    await connectDB();
    await OAuthConsent.updateOne({ user: userId, clientId: req.client.id }, { $set: { scopes: req.scopes, revokedAt: null, lastUsedAt: new Date() } }, { upsert: true });
    const code = crypto.randomBytes(32).toString("base64url");
    await OAuthCode.create({
        codeHash: sha256(code),
        clientId: req.client.id,
        user: new mongoose.Types.ObjectId(userId),
        redirectUri: req.redirectUri,
        scopes: req.scopes,
        codeChallenge: req.codeChallenge,
        nonce: req.nonce,
        authTime,
        expiresAt: new Date(Date.now() + CODE_TTL_S * 1000),
    });
    return back(req.redirectUri, { code, state: req.state });
}

export function deny(req: AuthorizeRequest): string {
    return back(req.redirectUri, { error: "access_denied", error_description: "Autorisation refusée.", state: req.state });
}

/* ─── Échange du code contre les jetons (/oauth/token) ─── */

export class OAuthError extends Error {
    constructor(
        public code: string,
        message: string,
        public status = 400
    ) {
        super(message);
    }
}

/** Authentification du client : en-tête Basic ou client_id + client_secret dans le formulaire */
function authenticateClient(form: URLSearchParams, authorization: string | null): OidcClient {
    let id = form.get("client_id") || "";
    let secret = form.get("client_secret") || "";
    if (authorization?.startsWith("Basic ")) {
        const [u, p] = Buffer.from(authorization.slice(6), "base64").toString().split(":");
        id = decodeURIComponent(u || "");
        secret = decodeURIComponent(p || "");
    }
    const client = OIDC_CLIENTS[id];
    const expected = client ? process.env[client.secretEnv] : undefined;
    if (!client || !expected) throw new OAuthError("invalid_client", "Application inconnue.", 401);
    const a = Buffer.from(sha256(secret));
    const b = Buffer.from(sha256(expected));
    if (!crypto.timingSafeEqual(a, b)) throw new OAuthError("invalid_client", "Secret incorrect.", 401);
    return client;
}

export async function exchangeCode(form: URLSearchParams, authorization: string | null) {
    if (form.get("grant_type") !== "authorization_code") throw new OAuthError("unsupported_grant_type", "Seul authorization_code est accepté.");
    const client = authenticateClient(form, authorization);
    const code = form.get("code") || "";
    const verifier = form.get("code_verifier") || "";
    await connectDB();
    // Usage unique : on marque le code utilisé dans la même opération
    const row = await OAuthCode.findOneAndUpdate({ codeHash: sha256(code), used: false }, { $set: { used: true } }, { new: false }).lean();
    if (!row || row.expiresAt < new Date()) throw new OAuthError("invalid_grant", "Code inconnu, expiré ou déjà utilisé.");
    if (row.clientId !== client.id || row.redirectUri !== form.get("redirect_uri")) throw new OAuthError("invalid_grant", "Code émis pour une autre application ou une autre adresse.");
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || sha256(verifier) !== row.codeChallenge) throw new OAuthError("invalid_grant", "Vérification PKCE échouée.");

    const sub = String(row.user);
    const claims = await userClaims(sub, row.scopes);
    if (!claims) throw new OAuthError("invalid_grant", "Compte introuvable.");
    const scope = row.scopes.join(" ");
    return {
        access_token: signJwt({ sub, aud: `${issuer()}/oauth/userinfo`, client_id: client.id, scope }, ACCESS_TTL_S),
        token_type: "Bearer",
        expires_in: ACCESS_TTL_S,
        scope,
        id_token: signJwt({ ...claims, aud: client.id, auth_time: Math.floor(new Date(row.authTime).getTime() / 1000), ...(row.nonce ? { nonce: row.nonce } : {}) }, ID_TOKEN_TTL_S),
    };
}

/** Avatar comme sur le site : photo perso, sinon image de la boutique, sinon Blobatar (avec accessoires) */
async function avatarOf(userId: string): Promise<string> {
    const c = await ProfileCustomization.findOne({ user: userId }).select("customPhoto profileImage").lean<{ customPhoto?: { url?: string; isActive?: boolean }; profileImage?: { filename?: string; isActive?: boolean } }>();
    if (c?.customPhoto?.isActive && c.customPhoto.url) return new URL(c.customPhoto.url, issuer()).toString();
    if (c?.profileImage?.isActive && c.profileImage.filename) return `${issuer()}/profile/${c.profileImage.filename}`;
    return `${issuer()}/api/avatar/${userId}?size=256`;
}

/** Informations transmises à l'application, selon ce que le membre a autorisé */
export async function userClaims(userId: string, scopes: string[]): Promise<Record<string, unknown> | null> {
    await connectDB();
    if (!mongoose.isValidObjectId(userId)) return null;
    const u = await User.findById(userId).select("username email role isAdmin verified").lean<{ username: string; email: string; role: string; isAdmin?: boolean; verified?: boolean }>();
    if (!u) return null;
    return {
        sub: userId,
        ...(scopes.includes("profile") ? { username: u.username, preferred_username: u.username, name: u.username, picture: await avatarOf(userId) } : {}),
        ...(scopes.includes("email") ? { email: u.email, email_verified: !!u.verified } : {}),
        ...(scopes.includes("role") ? { role: u.isAdmin ? "Admin" : u.role } : {}),
    };
}

/** Applications autorisées par un membre (page « applications connectées ») */
export async function listConsents(userId: string) {
    await connectDB();
    const rows = await OAuthConsent.find({ user: userId, revokedAt: null }).lean();
    return rows.filter((r) => OIDC_CLIENTS[r.clientId]).map((r) => ({ clientId: r.clientId, name: OIDC_CLIENTS[r.clientId].name, homepage: OIDC_CLIENTS[r.clientId].homepage, scopes: r.scopes, lastUsedAt: r.lastUsedAt ?? null }));
}

export async function revokeConsent(userId: string, clientId: string) {
    await connectDB();
    await OAuthConsent.updateOne({ user: userId, clientId }, { $set: { revokedAt: new Date() } });
}
