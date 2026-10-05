import { NextResponse } from "next/server";
import { jwks } from "@/lib/oidc/jwt";

export const dynamic = "force-dynamic";

/** Clés publiques de signature des jetons (JWKS) */
export function GET() {
    return NextResponse.json(jwks(), { headers: { "Cache-Control": "public, max-age=3600" } });
}
