import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // Import du module pour signer les URLs

// Configuration du client S3 pour Cloudflare R2 via AWS SDK
const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
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
