import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Digital Asset Links (Android App Links) : prouve à Android que l'application
 * Workyt (fr.workyt.app) a le droit d'ouvrir directement les liens workyt.fr,
 * sans demander « ouvrir avec… ».
 *
 * L'empreinte SHA-256 du certificat de signature vient de l'environnement :
 * ANDROID_CERT_SHA256 (plusieurs séparées par des virgules : clé EAS + clé
 * Play Store). Elle s'obtient avec `eas credentials` (Android) ou dans la Play
 * Console → Intégrité de l'app. Sans variable, la liste est vide (aucun effet).
 */
export function GET() {
    const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
        .split(",")
        .map((f) => f.trim().toUpperCase())
        .filter(Boolean);

    const statements = fingerprints.length
        ? [{
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
                namespace: "android_app",
                package_name: process.env.ANDROID_PACKAGE ?? "fr.workyt.app",
                sha256_cert_fingerprints: fingerprints,
            },
        }]
        : [];

    return NextResponse.json(statements, { headers: { "Cache-Control": "public, max-age=3600" } });
}
