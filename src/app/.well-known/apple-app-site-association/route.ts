import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Chemins du site que l'application sait afficher (même liste que app.json côté app) */
const APP_PATHS = ["/forum/*", "/fiches/*", "/compte/*", "/clan", "/amis", "/defis", "/suivi/*", "/recompenses", "/calendrier", "/gems", "/kits/*"];

/**
 * Universal Links (iOS) : équivalent Apple de assetlinks.json. Nécessite
 * APPLE_TEAM_ID (Apple Developer → Membership) ; sans lui, aucun lien n'est
 * revendiqué. Servi en JSON sans extension, comme l'exige iOS.
 */
export function GET() {
    const team = process.env.APPLE_TEAM_ID?.trim();
    const bundle = process.env.IOS_BUNDLE_ID ?? "fr.workyt.app";
    const body = {
        applinks: {
            details: team ? [{ appIDs: [`${team}.${bundle}`], components: APP_PATHS.map((p) => ({ "/": p })) }] : [],
        },
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
