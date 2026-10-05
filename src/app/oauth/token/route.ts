import { NextResponse } from "next/server";
import { OAuthError, exchangeCode } from "@/lib/oidc/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /oauth/token — échange du code (usage unique, 60 s, PKCE) contre les jetons. Appelé par le serveur du blog. */
export async function POST(req: Request) {
    const headers = { "Cache-Control": "no-store", Pragma: "no-cache" };
    const form = new URLSearchParams(await req.text());
    try {
        return NextResponse.json(await exchangeCode(form, req.headers.get("authorization")), { headers });
    } catch (error) {
        if (error instanceof OAuthError) return NextResponse.json({ error: error.code, error_description: error.message }, { status: error.status, headers });
        console.error("[oauth/token]", error);
        return NextResponse.json({ error: "server_error" }, { status: 500, headers });
    }
}
