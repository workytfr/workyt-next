import { NextResponse } from "next/server";
import { issuer } from "@/lib/oidc/config";
import { verifyJwt } from "@/lib/oidc/jwt";
import { userClaims } from "@/lib/oidc/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /oauth/userinfo — profil du membre (selon ce qu'il a autorisé), avec le jeton d'accès */
async function handle(req: Request) {
    const auth = req.headers.get("authorization") || "";
    const payload = auth.startsWith("Bearer ") ? verifyJwt(auth.slice(7)) : null;
    const unauthorized = () => NextResponse.json({ error: "invalid_token" }, { status: 401, headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' } });
    if (!payload || payload.aud !== `${issuer()}/oauth/userinfo` || typeof payload.sub !== "string") return unauthorized();
    const claims = await userClaims(payload.sub, String(payload.scope || "").split(" "));
    if (!claims) return unauthorized();
    return NextResponse.json(claims, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
