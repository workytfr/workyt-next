import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // Import du module pour signer les URLs

// Configuration du client S3 pour Backblaze B2
const s3 = new S3Client({
    region: "eu-central-003",
    endpoint: process.env.B2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
});

/**
 * Génère une URL signée pour accéder à un fichier dans Backblaze B2
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

    return await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL valide pendant 1 heure
}
