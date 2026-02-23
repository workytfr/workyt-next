import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuration du client S3 pour Cloudflare R2 via AWS SDK
// Utilise la même config que les routes d'upload pour que les URLs signées soient cohérentes
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
        // Vérifier si l'URL est valide
        if (!fileUrl || fileUrl.includes('undefined')) {
            console.warn(`URL de fichier invalide: ${fileUrl}`);
            return '';
        }

        // Pour les URLs de type: https://domain.com/bucket/fiches/uuid-filename
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        
        // Retourner le chemin complet sans le slash initial
        // Ex: /workyt/fiches/uuid-file.pdf → workyt/fiches/uuid-file.pdf
        const fullKey = url.pathname.replace(/^\/+/, '');
        if (fullKey) {
            return fullKey;
        }

        // Fallback: prendre les deux dernières parties du chemin
        if (pathParts.length >= 2) {
            return pathParts.slice(-2).join('/');
        }

        // Dernier fallback: prendre la dernière partie
        return pathParts[pathParts.length - 1];
    } catch (error) {
        console.error(`Erreur lors de l'extraction de la clé du fichier depuis l'URL ${fileUrl}:`, error);
        return '';
    }
}
