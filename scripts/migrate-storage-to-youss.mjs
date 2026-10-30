#!/usr/bin/env node
/**
 * Migration du stockage vers le MinIO de Youss (bucket public `workyt-learn`).
 *
 *   R2 (sauf mentorship/)          ─┐
 *   UploadThing (utfs.io, ufs.sh)  ─┼─▶  s3.youss.dev/workyt-learn/<clé>
 *   Disque serveur (/uploads/cours)─┘
 *
 * Les pièces jointes des suivis (`mentorship/`) restent sur R2 : elles ne sont
 * ni copiées ni réécrites.
 *
 * Variables lues (fichier --env, `.env` par défaut) :
 *   S3_*        destination : MinIO de Youss (S3_ENDPOINT, S3_REGION, S3_BUCKET_NAME,
 *               S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL facultatif)
 *   SUIVI_S3_*  source R2 (mêmes valeurs que l'ancien S3_*)
 *   MONGODB_URI base à réécrire (étapes « base » seulement)
 *
 * Étapes (toutes en simulation sans --apply) :
 *   --copy      copie les objets R2 hors mentorship/ vers MinIO (sans écraser)
 *   --db        réécrit en base les adresses R2, UploadThing et /uploads/cours
 *   --uploads-dir=<dossier>   où trouver les fichiers de /uploads/cours
 *                             (sur le serveur : <app>/public/uploads/cours)
 *   --apply     écrit vraiment ; avant toute écriture en base, une sauvegarde
 *               JSON des documents modifiés est créée dans scripts/backups/
 *
 * Exemples :
 *   node scripts/migrate-storage-to-youss.mjs --copy              # simulation
 *   node scripts/migrate-storage-to-youss.mjs --copy --apply
 *   node scripts/migrate-storage-to-youss.mjs --db --uploads-dir=public/uploads/cours
 *   node scripts/migrate-storage-to-youss.mjs --db --uploads-dir=public/uploads/cours --apply
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, ...v] = a.replace(/^--/, "").split("=");
        return [k, v.length ? v.join("=") : true];
    })
);
const APPLY = !!args.apply;
const envFile = typeof args.env === "string" ? args.env : ".env";

// ── Variables d'environnement ──
for (const line of fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8").split(/\r?\n/) : []) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const need = (name) => {
    if (!process.env[name]) {
        console.error(`Variable manquante : ${name}`);
        process.exit(1);
    }
    return process.env[name];
};

const MINIO_BUCKET = need("S3_BUCKET_NAME");
const minio = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: need("S3_ENDPOINT"),
    forcePathStyle: true,
    credentials: { accessKeyId: need("S3_ACCESS_KEY"), secretAccessKey: need("S3_SECRET_KEY") },
});
const PUBLIC_BASE = (process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT.replace(/\/+$/, "")}/${MINIO_BUCKET}`).replace(/\/+$/, "");
const publicUrl = (key) => `${PUBLIC_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`;

if (/r2\.cloudflarestorage\.com/.test(process.env.S3_ENDPOINT)) {
    console.error("S3_ENDPOINT pointe encore vers R2 : il doit désigner le MinIO de Youss (destination).");
    process.exit(1);
}

/** R2 : l'ancien S3_ENDPOINT finissait par /workyt, d'où des clés réelles « workyt/<clé> » */
function r2Client() {
    const endpoint = need("SUIVI_S3_ENDPOINT");
    const u = new URL(endpoint);
    return {
        client: new S3Client({
            region: process.env.SUIVI_S3_REGION || "auto",
            endpoint: u.origin,
            forcePathStyle: true,
            credentials: { accessKeyId: need("SUIVI_S3_ACCESS_KEY"), secretAccessKey: need("SUIVI_S3_SECRET_KEY") },
        }),
        bucket: need("SUIVI_S3_BUCKET"),
        // Préfixe ajouté par le chemin de l'endpoint (« workyt/ »)
        prefix: u.pathname.replace(/^\/+|\/+$/g, "") ? `${u.pathname.replace(/^\/+|\/+$/g, "")}/` : "",
    };
}

const LEGACY_BUCKETS = ["workyt", MINIO_BUCKET];
/** Clé logique d'une adresse R2 : retire l'hôte et le(s) préfixe(s) bucket */
function keyFromR2Url(url) {
    let p = decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));
    for (let i = 0; i < 2; i++) {
        const b = LEGACY_BUCKETS.find((x) => p.startsWith(`${x}/`));
        if (b) p = p.slice(b.length + 1);
    }
    return p;
}

/**
 * Présence (et taille) d'un objet, par listing : à travers le Cloudflare de
 * s3.youss.dev, HEAD est refusé (403) et les lectures partielles sont capricieuses.
 */
let inventory = null; // clé → taille, chargé une fois
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
/** Le Cloudflare de s3.youss.dev bloque les rafales : une requête toutes les PACE ms au plus */
const PACE = Number(args.pace || 400);

async function loadInventory() {
    inventory = new Map();
    let token;
    do {
        const r = await minio.send(new ListObjectsV2Command({ Bucket: MINIO_BUCKET, ContinuationToken: token }));
        for (const o of r.Contents || []) inventory.set(o.Key, o.Size);
        token = r.IsTruncated ? r.NextContinuationToken : undefined;
        await pause(PACE);
    } while (token);
    return inventory;
}

async function exists(key, size) {
    if (inventory) return inventory.has(key) && (size === undefined || inventory.get(key) === size);
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const r = await minio.send(new ListObjectsV2Command({ Bucket: MINIO_BUCKET, Prefix: key, MaxKeys: 1 }));
            const o = (r.Contents || []).find((x) => x.Key === key);
            return !!o && (size === undefined || o.Size === size);
        } catch (e) {
            if (attempt === 3) throw e;
            await new Promise((r) => setTimeout(r, 500 * attempt));
        }
    }
    return false;
}

const EXT_TYPES = {
    pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
    gif: "image/gif", svg: "image/svg+xml", mp3: "audio/mpeg", mp4: "video/mp4", heic: "image/heic",
};
const typeOf = (key, fallback) => EXT_TYPES[(key.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase()] || fallback || "application/octet-stream";

// ───────────────────────── 1. Copie R2 → MinIO ─────────────────────────
async function copyR2() {
    const r2 = r2Client();
    console.log(`\n== Copie R2 (${r2.bucket}/${r2.prefix}…) → MinIO (${MINIO_BUCKET}) ${APPLY ? "" : "[simulation]"}`);
    let token, seen = 0, copied = 0, skipped = 0, kept = 0, bytes = 0;
    await loadInventory();
    const pending = [];
    const failed = [];
    do {
        const page = await r2.client.send(new ListObjectsV2Command({ Bucket: r2.bucket, Prefix: r2.prefix || undefined, ContinuationToken: token }));
        for (const o of page.Contents || []) {
            seen++;
            const key = o.Key.slice(r2.prefix.length);
            if (!key || key.endsWith("/")) continue;
            if (key.startsWith("mentorship/")) { kept++; continue; }
            if (await exists(key, o.Size)) { skipped++; continue; }
            if (APPLY) {
                const obj = await r2.client.send(new GetObjectCommand({ Bucket: r2.bucket, Key: o.Key }));
                const body = Buffer.from(await obj.Body.transformToByteArray());
                try {
                    await minio.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: key, Body: body, ContentType: obj.ContentType || typeOf(key) }));
                    pending.push([key, body.length]);
                    process.stdout.write(`${pending.length} copiés…`);
                } catch (e) {
                    // Page HTML = pare-feu Cloudflare de s3.youss.dev (contenu ou rafale)
                    const html = /closing tag|<html|DOCTYPE/i.test(String(e.message));
                    failed.push(`${key} (${(body.length / 1024).toFixed(0)} Ko, ${e.$metadata?.httpStatusCode || e.name}${html ? ", pare-feu Cloudflare" : ""})`);
                    process.stdout.write(`${pending.length} copiés, ${failed.length} refusés…`);
                }
                await pause(PACE);
                continue;
            }
            copied++; bytes += o.Size || 0;
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    if (pending.length) {
        // Vérification en un seul listing : chaque fichier copié doit être là, à la bonne taille
        await loadInventory();
        const bad = pending.filter(([k, n]) => inventory.get(k) !== n);
        console.log(`
Vérification : ${pending.length - bad.length}/${pending.length} fichiers présents à la bonne taille`);
        for (const [k] of bad) console.log("  ✗", k);
        if (bad.length) process.exitCode = 1;
    }
    if (failed.length) {
        console.log(`
⚠️ ${failed.length} envois refusés :`);
        for (const f of failed) console.log("  ✗", f);
        process.exitCode = 1;
    }
    console.log(`${seen} objets R2 · ${copied} ${APPLY ? "copiés" : "à copier"} (${(bytes / 1048576).toFixed(1)} Mo) · ${skipped} déjà présents · ${kept} pièces jointes de suivi laissées sur R2`);
}

// ───────────────────────── 2. Réécriture de la base ─────────────────────────
const R2_URL = /https?:\/\/[a-z0-9.-]*(?:r2\.cloudflarestorage\.com|\.r2\.app|\.r2\.dev)\/[^\s"'\\)<>]+/gi;
const UT_URL = /https?:\/\/(?:[a-z0-9-]+\.)?(?:utfs\.io|ufs\.sh)\/[^\s"'\\)<>]+/gi;
const LOCAL_URL = /(?:https?:\/\/(?:www\.)?workyt\.fr)?\/uploads\/cours\/[A-Za-z0-9._-]+/g;
// Les collections des suivis ne contiennent que des clés R2 privées : on n'y touche pas
const SKIP_COLLECTIONS = /^(mentorships?|mentorshipmessages?|system\..*)$/i;

async function migrateDb() {
    const { MongoClient } = await import("mongodb");
    const uploadsDir = typeof args["uploads-dir"] === "string" ? path.resolve(args["uploads-dir"]) : null;
    console.log(`\n== Base : réécriture des adresses ${APPLY ? "" : "[simulation]"}`);
    if (!uploadsDir) console.log("(sans --uploads-dir, les fichiers /uploads/cours sont seulement comptés)");

    const client = await MongoClient.connect(need("MONGODB_URI"), { serverSelectionTimeoutMS: 20000 });
    const db = client.db();
    const cache = new Map(); // ancienne adresse → nouvelle (ou null si introuvable)
    const missing = new Set();
    const stats = { r2: 0, ut: 0, local: 0, docs: 0 };

    async function resolve(url, kind) {
        if (cache.has(url)) return cache.get(url);
        let next = null;
        try {
            if (kind === "r2") {
                const key = keyFromR2Url(url);
                if (key.startsWith("mentorship/")) next = null;
                else if (await exists(key)) next = publicUrl(key);
                else missing.add(`${url}  (clé ${key} absente de MinIO : lancer --copy d'abord)`);
            } else if (kind === "ut") {
                const name = path.basename(new URL(url).pathname);
                const key = `cours/images/ut-${name}`;
                if (await exists(key)) next = publicUrl(key);
                else if (APPLY) {
                    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 WorkytStorageMigration" } });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const body = Buffer.from(await res.arrayBuffer());
                    await minio.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: key, Body: body, ContentType: res.headers.get("content-type") || typeOf(key, "image/jpeg") }));
                    next = publicUrl(key);
                } else next = publicUrl(key);
            } else {
                const name = path.basename(url);
                const key = `cours/fichiers/${name}`;
                if (await exists(key)) next = publicUrl(key);
                else if (uploadsDir && fs.existsSync(path.join(uploadsDir, name))) {
                    if (APPLY) {
                        const body = fs.readFileSync(path.join(uploadsDir, name));
                        await minio.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: key, Body: body, ContentType: typeOf(name) }));
                    }
                    next = publicUrl(key);
                } else missing.add(`${url}  (fichier introuvable${uploadsDir ? ` dans ${uploadsDir}` : ""})`);
            }
        } catch (e) {
            missing.add(`${url}  (${e.message})`);
        }
        cache.set(url, next);
        return next;
    }

    /** Réécrit toutes les chaînes d'une valeur ; renvoie la nouvelle valeur si elle a changé */
    async function rewrite(value) {
        if (typeof value === "string") {
            let out = value;
            for (const [re, kind] of [[R2_URL, "r2"], [UT_URL, "ut"], [LOCAL_URL, "local"]]) {
                const found = [...new Set(out.match(re) || [])];
                for (const u of found) {
                    const n = await resolve(u, kind);
                    if (n) { out = out.split(u).join(n); stats[kind]++; }
                }
            }
            return out;
        }
        if (Array.isArray(value)) return Promise.all(value.map(rewrite));
        if (value && typeof value === "object" && value.constructor === Object) {
            const o = {};
            for (const [k, v] of Object.entries(value)) o[k] = await rewrite(v);
            return o;
        }
        return value;
    }

    const backup = [];
    const updates = [];
    for (const { name } of await db.listCollections().toArray()) {
        if (SKIP_COLLECTIONS.test(name)) continue;
        const col = db.collection(name);
        for await (const doc of col.find({})) {
            const raw = JSON.stringify(doc);
            if (!/r2\.cloudflarestorage\.com|\.r2\.(?:app|dev)|utfs\.io|ufs\.sh|\/uploads\/cours\//i.test(raw)) continue;
            const $set = {};
            for (const [field, value] of Object.entries(doc)) {
                if (field === "_id") continue;
                const next = await rewrite(value);
                if (JSON.stringify(next) !== JSON.stringify(value)) $set[field] = next;
            }
            if (!Object.keys($set).length) continue;
            stats.docs++;
            backup.push({ collection: name, _id: doc._id, before: Object.fromEntries(Object.keys($set).map((f) => [f, doc[f]])) });
            updates.push({ col, _id: doc._id, $set, name });
        }
    }

    const byCol = updates.reduce((a, u) => ((a[u.name] = (a[u.name] || 0) + 1), a), {});
    console.log(`Adresses remplacées : ${stats.r2} R2 · ${stats.ut} UploadThing · ${stats.local} /uploads/cours, dans ${stats.docs} documents`);
    console.log("Par collection :", Object.entries(byCol).map(([k, v]) => `${k} ${v}`).join(" · ") || "aucune");
    if (missing.size) {
        console.log(`\n⚠️ ${missing.size} adresses laissées telles quelles :`);
        for (const m of [...missing].slice(0, 30)) console.log("  -", m);
        if (missing.size > 30) console.log(`  … et ${missing.size - 30} autres`);
    }

    if (APPLY && updates.length) {
        fs.mkdirSync("scripts/backups", { recursive: true });
        const file = `scripts/backups/storage-migration-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(3).toString("hex")}.json`;
        fs.writeFileSync(file, JSON.stringify(backup, null, 1));
        console.log(`\nSauvegarde des valeurs d'origine : ${file}`);
        for (const u of updates) await u.col.updateOne({ _id: u._id }, { $set: u.$set });
        console.log(`${updates.length} documents mis à jour.`);
    }
    await client.close();
}

if (!args.copy && !args.db) {
    console.log("Préciser --copy et/ou --db (voir l'en-tête du script). Ajouter --apply pour écrire.");
    process.exit(0);
}
if (args.copy) await copyR2();
if (args.db) await migrateDb();
if (!APPLY) console.log("\nSimulation terminée : rien n'a été écrit. Relancer avec --apply pour migrer.");
