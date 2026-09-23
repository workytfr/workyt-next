import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Suppression d'un objet unique sur R2 (photos de profil, pièces jointes…).
 * Le nettoyage de masse des fichiers orphelins vit dans `r2Cleanup.ts`.
 */
const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

/** Ne lève jamais : l'échec de suppression ne doit pas bloquer l'utilisateur. */
export async function deleteFromR2(key?: string): Promise<void> {
    if (!key) return;
    try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key }));
    } catch (err) {
        console.error("Suppression R2 impossible :", key, err);
    }
}
