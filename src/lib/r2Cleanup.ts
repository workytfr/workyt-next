/**
 * Détection et nettoyage des fichiers orphelins sur Cloudflare R2.
 *
 * Stratégie :
 * 1. Collecte toutes les clés/URLs référencées dans MongoDB
 * 2. Liste tous les objets R2 sous les préfixes gérés
 * 3. Identifie les orphelins (non référencés ET > GRACE_DAYS jours)
 * 4. Supprime par batch (mode active) ou simplement compte (mode dry-run)
 */

import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand,
    type _Object as R2Object,
    type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import Revision from "@/models/Revision";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import Lesson from "@/models/Lesson";
import Course from "@/models/Course";
import Exercise from "@/models/Exercise";

const s3 = new S3Client({
    region: process.env.R2_REGION || process.env.S3_REGION || "auto",
    endpoint: process.env.R2_ENDPOINT || process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

const BUCKET = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME!;

// Préfixes gérés par l'app (on n'évalue PAS les autres : badges/, public assets, etc.)
const MANAGED_PREFIXES = ["fiches/", "uploads/"];

// On ne touche pas aux fichiers récents (uploads en cours, brouillons)
const GRACE_DAYS = 7;
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

// Limite par batch R2 DeleteObjects
const DELETE_BATCH_SIZE = 1000;

// Cap de sécurité : pas plus de N suppressions par run
const MAX_DELETIONS_PER_RUN = 10_000;

export interface CleanupResult {
    dryRun: boolean;
    startedAt: Date;
    finishedAt: Date;
    durationMs: number;
    scanned: number;
    referenced: number;
    orphans: number;
    deleted: number;
    bytesFreed: number;
    skippedRecent: number;
    sampleOrphans: string[]; // Premiers 50 pour debug
    errors: string[];
}

/**
 * Extrait la clé R2 depuis une URL ou retourne la string telle quelle si c'est déjà une clé.
 * Exemples :
 *  - "https://bucket.r2.dev/fiches/img/abc.png" → "fiches/img/abc.png"
 *  - "https://workyt.fr/api/file-proxy?..." → null (pas une clé directe)
 *  - "fiches/img/abc.png" → "fiches/img/abc.png"
 *  - "uploads/xyz.pdf" → "uploads/xyz.pdf"
 */
function extractKey(value: string | null | undefined): string | null {
    if (!value) return null;
    const v = value.trim();
    if (!v) return null;

    // Clé directe (commence par un préfixe géré)
    for (const prefix of MANAGED_PREFIXES) {
        if (v.startsWith(prefix)) return v;
    }

    // URL absolue : extraire le chemin après le domaine
    try {
        const url = new URL(v);
        const path = url.pathname.replace(/^\/+/, "");
        for (const prefix of MANAGED_PREFIXES) {
            if (path.startsWith(prefix)) return path;
            // Cas avec bucket en path-style : /bucket-name/fiches/img/...
            const segments = path.split("/");
            const idx = segments.findIndex((s) => s === prefix.replace("/", ""));
            if (idx >= 0) return segments.slice(idx).join("/");
        }
    } catch {
        // pas une URL parseable
    }

    return null;
}

/**
 * Extrait toutes les clés référencées dans une string markdown
 * (cherche ![](url), [](url), <img src="...">, <!--tldraw:url-->).
 */
function extractKeysFromMarkdown(md: string | null | undefined): string[] {
    if (!md) return [];
    const keys: string[] = [];
    const patterns = [
        /!\[[^\]]*\]\(([^)\s]+)/g,                // markdown image
        /\[[^\]]*\]\(([^)\s]+)/g,                 // markdown link
        /<img[^>]+src=["']([^"']+)["']/gi,        // html img
        /<!--\s*tldraw\s*:\s*([^>\s]+)\s*-->/g,   // tldraw snapshot comment
        /<a[^>]+href=["']([^"']+)["']/gi,         // html link
    ];
    for (const re of patterns) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(md)) !== null) {
            const k = extractKey(m[1]);
            if (k) keys.push(k);
        }
    }
    return keys;
}

/**
 * Collecte toutes les clés R2 référencées dans la base.
 * Retourne un Set pour lookup O(1).
 */
export async function collectReferencedKeys(): Promise<Set<string>> {
    const referenced = new Set<string>();
    const addKey = (v: string | null | undefined) => {
        const k = extractKey(v);
        if (k) referenced.add(k);
    };
    const addKeys = (arr: string[] | null | undefined) => arr?.forEach(addKey);

    // Revision (fiches)
    const revisions = await Revision.find({}, { content: 1, files: 1 }).lean();
    for (const r of revisions as any[]) {
        addKeys(r.files);
        extractKeysFromMarkdown(r.content).forEach((k) => referenced.add(k));
    }

    // Question (forum)
    const questions = await Question.find(
        {},
        { attachments: 1, "description.whatIDid": 1, "description.whatINeed": 1 },
    ).lean();
    for (const q of questions as any[]) {
        addKeys(q.attachments);
        extractKeysFromMarkdown(q.description?.whatIDid).forEach((k) => referenced.add(k));
        extractKeysFromMarkdown(q.description?.whatINeed).forEach((k) => referenced.add(k));
    }

    // Answer (forum)
    const answers = await Answer.find({}, { content: 1, attachments: 1 }).lean();
    for (const a of answers as any[]) {
        addKeys(a.attachments);
        extractKeysFromMarkdown(a.content).forEach((k) => referenced.add(k));
    }

    // Lesson
    const lessons = await Lesson.find({}, { content: 1 }).lean();
    for (const l of lessons as any[]) {
        extractKeysFromMarkdown(l.content).forEach((k) => referenced.add(k));
    }

    // Course
    const courses = await Course.find({}, { image: 1, description: 1 }).lean();
    for (const c of courses as any[]) {
        addKey(c.image);
        extractKeysFromMarkdown(c.description).forEach((k) => referenced.add(k));
    }

    // Exercise
    const exercises = await Exercise.find({}, { content: 1, image: 1, correction: 1 }).lean();
    for (const e of exercises as any[]) {
        addKey(e.image);
        addKey(e.correction?.image);
        extractKeysFromMarkdown(e.content).forEach((k) => referenced.add(k));
        extractKeysFromMarkdown(e.correction?.content).forEach((k) => referenced.add(k));
    }

    return referenced;
}

/**
 * Liste tous les objets R2 sous un préfixe donné (avec pagination).
 */
async function listAllObjects(prefix: string): Promise<R2Object[]> {
    const all: R2Object[] = [];
    let continuationToken: string | undefined = undefined;
    do {
        const res: ListObjectsV2CommandOutput = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            }),
        );
        if (res.Contents) all.push(...res.Contents);
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);
    return all;
}

/**
 * Identifie et (optionnellement) supprime les fichiers orphelins.
 *
 * @param options.dryRun Si true, ne supprime rien, juste compte.
 * @param options.maxDeletions Cap absolu sur les suppressions.
 */
export async function runR2Cleanup(options: {
    dryRun?: boolean;
    maxDeletions?: number;
} = {}): Promise<CleanupResult> {
    const dryRun = options.dryRun ?? true;
    const maxDeletions = Math.min(options.maxDeletions ?? MAX_DELETIONS_PER_RUN, MAX_DELETIONS_PER_RUN);
    const startedAt = new Date();
    const errors: string[] = [];

    let scanned = 0;
    let skippedRecent = 0;
    const orphans: R2Object[] = [];

    try {
        // Étape 1 : collecte des références (peut prendre quelques secondes)
        const referenced = await collectReferencedKeys();

        // Étape 2 : listing R2 sous chaque préfixe géré
        const now = Date.now();
        for (const prefix of MANAGED_PREFIXES) {
            try {
                const objects = await listAllObjects(prefix);
                for (const obj of objects) {
                    if (!obj.Key) continue;
                    scanned++;

                    const age = obj.LastModified ? now - obj.LastModified.getTime() : 0;
                    if (age < GRACE_MS) {
                        skippedRecent++;
                        continue;
                    }

                    if (!referenced.has(obj.Key)) {
                        orphans.push(obj);
                        if (orphans.length >= maxDeletions) break;
                    }
                }
            } catch (err: any) {
                errors.push(`List ${prefix}: ${err.message ?? err}`);
            }
            if (orphans.length >= maxDeletions) break;
        }

        // Étape 3 : suppression (sauf en dry-run)
        let deleted = 0;
        let bytesFreed = 0;

        if (!dryRun && orphans.length > 0) {
            for (let i = 0; i < orphans.length; i += DELETE_BATCH_SIZE) {
                const batch = orphans.slice(i, i + DELETE_BATCH_SIZE);
                try {
                    await s3.send(
                        new DeleteObjectsCommand({
                            Bucket: BUCKET,
                            Delete: {
                                Objects: batch.map((o) => ({ Key: o.Key! })),
                                Quiet: true,
                            },
                        }),
                    );
                    deleted += batch.length;
                    bytesFreed += batch.reduce((sum, o) => sum + (o.Size ?? 0), 0);
                } catch (err: any) {
                    errors.push(`Delete batch ${i}: ${err.message ?? err}`);
                }
            }
        } else if (dryRun) {
            // En dry-run, on calcule juste les bytes qui auraient été libérés
            bytesFreed = orphans.reduce((sum, o) => sum + (o.Size ?? 0), 0);
        }

        const finishedAt = new Date();

        return {
            dryRun,
            startedAt,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            scanned,
            referenced: referenced.size,
            orphans: orphans.length,
            deleted: dryRun ? 0 : deleted,
            bytesFreed,
            skippedRecent,
            sampleOrphans: orphans.slice(0, 50).map((o) => o.Key!),
            errors,
        };
    } catch (err: any) {
        const finishedAt = new Date();
        return {
            dryRun,
            startedAt,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            scanned,
            referenced: 0,
            orphans: orphans.length,
            deleted: 0,
            bytesFreed: 0,
            skippedRecent,
            sampleOrphans: [],
            errors: [err.message ?? String(err), ...errors],
        };
    }
}
