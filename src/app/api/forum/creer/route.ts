import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import Question from "@/models/Question";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";
import authMiddleware from "@/middlewares/authMiddleware";
import dbConnect from "@/lib/mongodb";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { notifySeo } from '@/lib/seoNotify';
import { buildIdSlug } from '@/utils/slugify';

// Exécuter ce route handler en runtime Node.js
export const runtime = "nodejs";

// Initialisation du client S3 (Cloudflare R2)
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

// Utility: convertir File en Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Nettoyage du nom de fichier
function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]+/g, "_");
}

// Téléversement sur R2 et renvoi de la clé du fichier (stockage robuste, pas d'URL selon les env)
async function uploadFileToR2(file: File): Promise<string> {
    const sanitized = sanitizeFileName(file.name);
    const key = `uploads/${uuidv4()}-${sanitized}`;
    const buffer = await fileToBuffer(file);
    const cmd = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
    });
    await s3Client.send(cmd);

    // Stocker uniquement la clé (uploads/uuid-filename) : le file-proxy construit l'URL côté serveur
    return key;
}

// Route POST: création d'une question
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);
        if (!user?._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        // Rate limit: 5 questions par minute par compte
        const rl = rateLimit(`forum-creer:${user._id}`, 5, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const formData = await req.formData();
        const title = formData.get("title") as string;
        const classLevel = formData.get("classLevel") as string;
        const subject = formData.get("subject") as string;
        const whatIDid = formData.get("whatIDid") as string;
        const whatINeed = formData.get("whatINeed") as string;
        const points = parseInt(formData.get("points") as string, 10);

        // Validation simple
        if (!title || !classLevel || !subject || !whatIDid || !whatINeed || isNaN(points)) {
            return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
        }
        if (points < 1 || points > 15) {
            return NextResponse.json({ error: "Les points doivent être entre 1 et 15." }, { status: 400 });
        }

        // Upload des fichiers avec validation
        const ALLOWED_MIME_TYPES = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
        const MAX_IMAGES = 3;
        const MAX_FILES = 5;

        const incomingFiles: File[] = [];
        for (const [_, value] of formData.entries()) {
            if (value instanceof File && value.size > 0) incomingFiles.push(value);
        }

        // Compte aussi les dessins inline (markdown `![dessin](url)`) — sur le forum, dessin = image
        const DRAWING_RE = /!\[dessin\]\([^)]+\)/g;
        const drawingCount =
            ((whatIDid || "").match(DRAWING_RE)?.length ?? 0) +
            ((whatINeed || "").match(DRAWING_RE)?.length ?? 0);
        const photoCount = incomingFiles.filter((f) => f.type.startsWith("image/")).length;
        const imageCount = photoCount + drawingCount;
        if (imageCount > MAX_IMAGES) {
            return NextResponse.json(
                { error: `Maximum ${MAX_IMAGES} images (photos + dessins) par question. Tu en as ${imageCount}.` },
                { status: 400 },
            );
        }
        if (incomingFiles.length > MAX_FILES) {
            return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers autorisés.` }, { status: 400 });
        }

        // Coût images : 1ʳᵉ image gratuite, +1 point à partir de la 2ᵉ (photo OU dessin)
        const photoCost = Math.max(0, imageCount - 1);
        const totalCost = points + photoCost;
        if (user.points < totalCost) {
            return NextResponse.json(
                {
                    error: `Points insuffisants. Coût total : ${totalCost} (mise ${points}${
                        photoCost > 0 ? ` + ${photoCost} photo${photoCost > 1 ? "s" : ""}` : ""
                    }). Solde : ${user.points}.`,
                },
                { status: 400 },
            );
        }

        const fileKeys: string[] = [];
        for (const value of incomingFiles) {
            if (!ALLOWED_MIME_TYPES.includes(value.type)) {
                return NextResponse.json({ error: `Type de fichier non autorisé : ${value.type}` }, { status: 400 });
            }
            if (value.size > MAX_FILE_SIZE) {
                return NextResponse.json({ error: `Fichier trop volumineux (max 10 MB) : ${value.name}` }, { status: 400 });
            }
            const key = await uploadFileToR2(value);
            fileKeys.push(key);
        }

        // Création de la question en BDD (attachments = clés de fichiers: uploads/uuid-filename)
        const question = await Question.create({
            user: user._id,
            title,
            classLevel,
            subject,
            description: { whatIDid, whatINeed },
            attachments: fileKeys,
            points,
            status: "Non validée",
            createdAt: new Date(),
        });

        // Mise à jour des points de l'utilisateur (mise + malus photos)
        await User.findByIdAndUpdate(user._id, { $inc: { points: -totalCost } });
        await PointTransaction.create({
            user: user._id,
            question: question._id,
            action: 'createQuestion',
            type: "perte",
            points,
            createdAt: new Date(),
        });
        if (photoCost > 0) {
            await PointTransaction.create({
                user: user._id,
                question: question._id,
                action: 'createQuestionPhotoCost',
                type: "perte",
                points: photoCost,
                createdAt: new Date(),
            });
        }

        // --- Envoi de la notification Discord via webhook ---
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
        const questionLink = `${baseUrl}/forum/${question._id}`;
        const payload = {
            embeds: [
                {
                    title: "🆕 Nouvelle question postée",
                    url: questionLink,
                    author: { name: user.username },
                    fields: [
                        { name: "Titre", value: title, inline: true },
                        { name: "Sujet", value: subject, inline: true },
                        { name: "Niveau", value: classLevel, inline: true },
                        { name: "Points misés", value: points.toString(), inline: true },
                    ],
                    timestamp: question.createdAt.toISOString(),
                    color: 0x00aaff,
                },
            ],
        };
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        // Notifier les moteurs de recherche (revalidate sitemap + IndexNow → Bing/Yandex)
        try {
            const slugForSeo = buildIdSlug(question._id.toString(), question.slug || question.title);
            notifySeo(`https://workyt.fr/forum/${slugForSeo}`);
        } catch (seoErr) {
            console.error("notifySeo error (non blocking):", seoErr);
        }

        return NextResponse.json(question, { status: 201 });
    } catch (err: any) {
        console.error("Erreur création question :", err);
        return NextResponse.json({ error: "Échec création question." }, { status: 500 });
    }
}
