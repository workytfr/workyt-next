import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { issuer } from "@/lib/oidc/config";
import { approve, checkDecisionToken, deny, parseAuthorizeRequest } from "@/lib/oidc/service";

export const dynamic = "force-dynamic";

/**
 * POST /oauth/decision — « Autoriser » ou « Refuser » sur l'écran
 * d'autorisation. Renvoie l'adresse de retour vers l'application ; la page
 * s'y rend elle-même (la politique de sécurité du site bloque les
 * redirections de formulaire vers un autre domaine).
 */
export async function POST(req: Request) {
    // Uniquement depuis workyt.fr (protection contre les formulaires piégés)
    const origin = req.headers.get("origin");
    if (origin && new URL(issuer()).origin !== origin) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const params = new URLSearchParams(typeof body.query === "string" ? body.query : "");
    const parsed = parseAuthorizeRequest((k) => params.get(k));
    if (!parsed.ok) return NextResponse.json({ error: parsed.fatal ? parsed.message : "Demande invalide.", redirect: parsed.fatal ? undefined : parsed.redirect }, { status: 400 });
    if (!checkDecisionToken(userId, parsed.req, String(body.token || ""))) return NextResponse.json({ error: "Demande expirée : recharge la page." }, { status: 403 });
    const redirect = body.allow === true ? await approve(userId, parsed.req, new Date()) : deny(parsed.req);
    return NextResponse.json({ redirect }, { headers: { "Cache-Control": "no-store" } });
}
