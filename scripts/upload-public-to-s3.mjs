/**
 * Envoie les images de public/ sur le S3 de Youss (bucket workyt-learn, préfixe public/),
 * pour que le loader next/image (src/lib/imageLoader.ts) les serve redimensionnées par
 * https://s3.youss.dev/_ydev/image/... sans passer par le serveur Next.
 *
 * Usage : node --env-file=<fichier LEARN_*> scripts/upload-public-to-s3.mjs [--only chemin] [--force]
 * Variables : LEARN_ENDPOINT, LEARN_REGION, LEARN_ACCESS_KEY, LEARN_SECRET_KEY, LEARN_BUCKET (défaut workyt-learn).
 *
 * Seuls les fichiers modifiés depuis le dernier envoi partent (empreintes dans
 * scripts/.public-s3-manifest.json). Envoi un par un, espacé : au-delà d'environ
 * 200 requêtes rapprochées, Cloudflare bloque l'IP.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const MANIFEST = path.join(import.meta.dirname, ".public-s3-manifest.json");
const PREFIX = "public/";
const DELAY_MS = 300;
// Images redimensionnables uniquement : les SVG restent servis tels quels par Next.
const TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
};

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const force = args.includes("--force");

for (const v of ["LEARN_ENDPOINT", "LEARN_ACCESS_KEY", "LEARN_SECRET_KEY"]) {
    if (!process.env[v]) throw new Error(`Variable manquante : ${v}`);
}
const bucket = process.env.LEARN_BUCKET || "workyt-learn";
const s3 = new S3Client({
    region: process.env.LEARN_REGION || "fr-shiftek",
    endpoint: process.env.LEARN_ENDPOINT,
    forcePathStyle: true,
    // Sans ça, le SDK envoie un corps « aws-chunked » avec somme de contrôle que le pare-feu refuse.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: process.env.LEARN_ACCESS_KEY, secretAccessKey: process.env.LEARN_SECRET_KEY },
});

function walk(dir) {
    return readdirSync(dir).flatMap((n) => {
        const p = path.join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : [p];
    });
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
let files = walk(PUBLIC)
    .map((p) => path.relative(PUBLIC, p).split(path.sep).join("/"))
    .filter((rel) => TYPES[path.extname(rel).toLowerCase()]);
if (only) files = files.filter((rel) => rel === only.replace(/^\/+/, ""));

let sent = 0;
for (const rel of files) {
    const body = readFileSync(path.join(PUBLIC, rel));
    const hash = createHash("sha1").update(body).digest("hex");
    if (!force && manifest[rel] === hash) continue;
    try {
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: PREFIX + rel,
            Body: body,
            ContentType: TYPES[path.extname(rel).toLowerCase()],
            CacheControl: "public, max-age=604800",
        }));
    } catch (err) {
        const raw = err.$response?.body;
        const text = typeof raw === "string" ? raw : raw ? await new Response(raw).text().catch(() => "") : "";
        const h = err.$response?.headers ?? {};
        console.error(`Échec sur ${rel} (${body.length} o) : HTTP ${err.$metadata?.httpStatusCode} ${err.name}`);
        console.error(`  ${new Date().toISOString()} | règle ${h["x-ydev-rule-id"] ?? "?"} | action ${h["x-ydev-waf-action"] ?? "?"} | cf-ray ${h["cf-ray"] ?? "?"}`);
        console.error(text.replace(/\s+/g, " ").slice(0, 600));
        process.exit(1);
    }
    manifest[rel] = hash;
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    sent++;
    console.log("envoyé", rel);
    await new Promise((r) => setTimeout(r, DELAY_MS));
}
console.log(`${sent} fichier(s) envoyé(s), ${files.length - sent} déjà à jour.`);
