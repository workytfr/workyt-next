import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuration du client S3 pour Cloudflare R2 via AWS SDK
const s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || "",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

/**
 * Génère une URL signée pour accéder à un fichier sur Cloudflare R2
 * @param bucketName - Nom du bucket
 * @param fileKey - Clé du fichier dans le bucket (inclut le chemin complet)
 * @returns URL signée valide pour un accès temporaire
 */

export async function generateSignedUrl(bucketName: string, fileKey: string): Promise<string> {
    const cleanFileKey = decodeURIComponent(fileKey); // Décoder tout encodage supplémentaire
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: cleanFileKey, // Transmettre la clé corrigée
    });

    return await getSignedUrl(s3, command, { expiresIn: 86400 }); // URL valide pendant 1 jour
}

/**
 * Supprime un fichier du cloud storage (Cloudflare R2)
 * @param bucketName - Nom du bucket
 * @param fileKey - Clé du fichier dans le bucket (inclut le chemin complet)
 * @returns Promise<boolean> - true si la suppression a réussi, false sinon
 */
export async function deleteFileFromStorage(bucketName: string, fileKey: string): Promise<boolean> {
    try {
        const cleanFileKey = decodeURIComponent(fileKey);
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: cleanFileKey,
        });

        await s3.send(command);
        console.log(`Fichier supprimé avec succès: ${cleanFileKey}`);
        return true;
    } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${fileKey}:`, error);
        return false;
    }
}

/**
 * Récupère un fichier depuis Cloudflare R2 (stream côté serveur)
 * @param bucketName - Nom du bucket
 * @param fileKey - Clé du fichier dans le bucket
 * @returns Réponse S3 avec le Body streamable
 */
export async function getFileFromStorage(bucketName: string, fileKey: string) {
    const cleanFileKey = decodeURIComponent(fileKey);
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: cleanFileKey,
    });

    return await s3.send(command);
}

/**
 * Extrait la clé du fichier à partir de l'URL complète du fichier
 * @param fileUrl - URL complète du fichier
 * @returns string - Clé du fichier pour la suppression
 */
export function extractFileKeyFromUrl(fileUrl: string): string {
    try {
        if (!fileUrl || fileUrl.includes('undefined')) {
            return '';
        }

        // Déjà une clé (ex: fiches/uuid-file.pdf ou uploads/uuid-file.pdf)
        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
            const key = fileUrl.replace(/^\/+/, '');
            return stripBucketPrefix(key) || '';
        }

        // URL complète: https://domain.com/fiches/uuid-filename ou .../workyt/uploads/...
        const url = new URL(fileUrl);
        const fullKey = url.pathname.replace(/^\/+/, '');
        if (fullKey) return stripBucketPrefix(fullKey);

        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) return stripBucketPrefix(pathParts.slice(-2).join('/'));
        return pathParts[pathParts.length - 1] || '';
    } catch {
        return '';
    }
}

/** Retire le préfixe bucket du chemin si présent (ex: workyt/fiches/ -> fiches/) */
function stripBucketPrefix(key: string): string {
    const bucket = process.env.S3_BUCKET_NAME || 'workyt';
    if (key.startsWith(`${bucket}/`)) {
        return key.slice(bucket.length + 1);
    }
    return key;
}
