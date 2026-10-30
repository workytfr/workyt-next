import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Stockage public de Workyt : bucket `workyt-learn` sur le MinIO de Youss
 * (s3.youss.dev), configuré par les variables `S3_*`.
 *
 * Le bucket est lisible par URL directe mais pas listable : une clé à UUID
 * n'est donc lisible que par qui la connaît. On y range ce qui est public par
 * nature : images et fichiers des cours, fiches, forum, avatars, audio TTS.
 *
 * ⚠️ Les pièces jointes des suivis n'y vont JAMAIS : elles restent sur R2,
 * privées (voir `src/lib/mentorship/storage.ts`).
 */
export const storage = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || "",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    // MinIO n'a pas de sous-domaine par bucket : adresses en s3.youss.dev/<bucket>/<clé>
    forcePathStyle: true,
});

export function storageBucket(): string {
    return process.env.S3_BUCKET_NAME || "";
}

/** https://s3.youss.dev/workyt-learn/<clé> (ou S3_PUBLIC_URL si défini) */
export function publicUrl(key: string): string {
    const base = (process.env.S3_PUBLIC_URL || `${(process.env.S3_ENDPOINT || "").replace(/\/+$/, "")}/${storageBucket()}`).replace(/\/+$/, "");
    return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/** Envoie un fichier dans le stockage public et renvoie son adresse publique */
export async function putPublicObject(key: string, body: Buffer, contentType: string): Promise<string> {
    await storage.send(
        new PutObjectCommand({ Bucket: storageBucket(), Key: key, Body: body, ContentType: contentType })
    );
    return publicUrl(key);
}
