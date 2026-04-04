import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import authMiddleware from '@/middlewares/authMiddleware';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const s3 = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || '',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

const bucketName = process.env.S3_BUCKET_NAME!;

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

/**
 * POST /api/evaluations/upload
 * Upload de fichiers (photos de copie ou correction) vers R2.
 * Accepte FormData avec champ "files" (multiple).
 * Query param: context=submission|correction (pour organiser dans R2).
 */
export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);

        // Rate limit: 10 uploads / minute
        const rl = rateLimit(`eval-upload:${user._id}`, 10, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const context = new URL(req.url).searchParams.get('context') || 'submission';
        if (!['submission', 'correction'].includes(context)) {
            return NextResponse.json({ error: 'Context invalide.' }, { status: 400 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files.length) {
            return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers.` }, { status: 400 });
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            // Validation type
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: `Type de fichier non autorisé : ${file.type}. Acceptés : JPEG, PNG, WebP, HEIC, PDF.` },
                    { status: 400 }
                );
            }

            // Validation taille
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `Fichier trop lourd (max ${MAX_FILE_SIZE / 1024 / 1024} Mo).` },
                    { status: 400 }
                );
            }

            const sanitizedName = file.name.replace(/[<>:"/\\|?*]+/g, '_');
            const fileKey = `evaluations/${context}/${uuidv4()}-${sanitizedName}`;
            const buffer = Buffer.from(await file.arrayBuffer());

            await s3.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
                Body: buffer,
                ContentType: file.type,
                ACL: 'public-read',
            }));

            const baseUrl = process.env.R2_PUBLIC_URL || process.env.S3_ENDPOINT;
            uploadedUrls.push(`${baseUrl}/${fileKey}`);
        }

        return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
    } catch (error: any) {
        console.error('[EvalUpload] Erreur:', error);
        return NextResponse.json({ error: 'Erreur upload.' }, { status: 500 });
    }
}
