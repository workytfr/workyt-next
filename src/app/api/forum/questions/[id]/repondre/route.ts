import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import User from "@/models/User";
import PointTransaction from '@/models/PointTransaction';
import { BadgeService } from "@/lib/badgeService";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { buildIdSlug } from "@/utils/slugify";
import { parseMentions, type Participant } from "@/lib/mentionsParser";
import { emitAnswerChanged } from "@/lib/realtime/emit";

// Configuration S3/R2 (compatible S3_* et R2_*)
const s3Client = new S3Client({
    region: process.env.R2_REGION || process.env.S3_REGION || "auto",
    endpoint: process.env.R2_ENDPOINT || process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

// Convertir un fichier (File) en Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Nettoyer le nom du fichier (remplacer les caractères spéciaux)
function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]+/g, "_");
}

// Téléverser un fichier sur Cloudflare R2 et retourner la clé (stockage robuste)
async function uploadFileToR2(file: File): Promise<string> {
    try {
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;

        // Conversion en Buffer
        const fileBuffer = await fileToBuffer(file);

        // Commande d'upload
        const bucket = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME!;
        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: file.type,
        });

        // Envoi de la requête à R2
        await s3Client.send(putCommand);

        // Stocker uniquement la clé (uploads/uuid-filename) : le file-proxy construit l'URL côté serveur
        return fileKey;
    } catch (error: any) {
        console.error("Erreur téléversement R2 :", error.message || error);
        throw new Error("Échec du téléversement du fichier sur R2.");
    }
}

// API pour ajouter une réponse à une question
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        // Authentification de l'utilisateur
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { success: false, message: "Non autorisé. Utilisateur non trouvé." },
                { status: 401 }
            );
        }

        // Rate limit: 5 réponses par minute par compte
        const rl = rateLimit(`forum-repondre:${user._id}`, 5, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        // Await params to get the id
        const { id } = await params;

        // Vérification de l'existence de la question
        const question = await Question.findById(id);
        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }

        // Vérification que la question n'est pas résolue ou validée
        if (question.status === "Résolue" || question.status === "Validée") {
            return NextResponse.json(
                { success: false, message: "Cette question est fermée. Vous ne pouvez plus y répondre." },
                { status: 400 }
            );
        }

        // Vérification que l'utilisateur n'est pas l'auteur de la question
        const isOwner = user._id.toString() === question.user.toString();

        // Récupération des données de la requête (multipart/form-data)
        const formData = await req.formData();
        const content = formData.get("content") as string;

        if (!content) {
            return NextResponse.json(
                { success: false, message: "Le contenu de la réponse est obligatoire." },
                { status: 400 }
            );
        }

        // Récupération des fichiers + comptage des images (max 2 par réponse, 1ʳᵉ gratuite, malus +1 dès la 2ᵉ)
        const incomingFiles: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "file" && value instanceof File && value.size > 0) {
                incomingFiles.push(value);
            }
        }
        const MAX_ANSWER_IMAGES = 2;
        // Sur le forum, les dessins inline (markdown `![dessin](url)`) comptent comme images
        const DRAWING_RE = /!\[dessin\]\([^)]+\)/g;
        const drawingCount = ((content || "").match(DRAWING_RE)?.length ?? 0);
        const photoCount = incomingFiles.filter((f) => f.type.startsWith("image/")).length;
        const imageCount = photoCount + drawingCount;
        if (imageCount > MAX_ANSWER_IMAGES) {
            return NextResponse.json(
                { success: false, message: `Maximum ${MAX_ANSWER_IMAGES} images (photos + dessins) par réponse. Tu en as ${imageCount}.` },
                { status: 400 },
            );
        }
        // 1ʳᵉ image gratuite, +1 point à partir de la 2ᵉ
        const photoCost = Math.max(0, imageCount - 1);
        if (photoCost > 0 && user.points < photoCost) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Points insuffisants pour les photos. Coût : ${photoCost}. Solde : ${user.points}.`,
                },
                { status: 400 },
            );
        }

        // Téléversement des fichiers - stockage des clés
        const fileKeys: string[] = [];
        for (const value of incomingFiles) {
            const fileKey = await uploadFileToR2(value);
            fileKeys.push(fileKey);
        }

        // Parse les mentions @pseudo dans le contenu (auteur question + autres répondants)
        const existingAnswers = await Answer.find({ question: question._id })
            .populate({ path: "user", select: "username _id" })
            .select("user")
            .lean();
        const participants: Participant[] = [];
        const seen = new Set<string>();
        const addParticipant = (u: any) => {
            if (!u?._id || !u?.username) return;
            const idStr = String(u._id);
            if (seen.has(idStr) || idStr === String(user._id)) return; // pas soi-même
            seen.add(idStr);
            participants.push({ _id: idStr, username: u.username });
        };
        // Auteur de la question
        const questionPopulated = await Question.findById(question._id)
            .populate({ path: "user", select: "username _id" })
            .select("user")
            .lean();
        addParticipant((questionPopulated as any)?.user);
        for (const a of existingAnswers as any[]) addParticipant(a.user);

        const { content: contentWithMentions, mentionedUserIds } = parseMentions(content, participants);

        // Création de la réponse
        const answerData = {
            user: user._id,
            question: question._id,
            content: contentWithMentions,
            likes: 0,
            status: "Proposée",
            attachments: fileKeys,
            createdAt: new Date(),
            isOwner,
        };

        const newAnswer = await Answer.create(answerData);

        // Malus photos (si la 2ᵉ photo a été attachée)
        if (photoCost > 0) {
            await User.findByIdAndUpdate(user._id, { $inc: { points: -photoCost } });
            await PointTransaction.create({
                user: user._id,
                question: question._id,
                action: 'createAnswerPhotoCost',
                type: "perte",
                points: photoCost,
                createdAt: new Date(),
            });
        }

        // Ajouter +2 points à l'utilisateur SI ce n'est PAS lui qui a posé la question
        if (!isOwner) {
            const { addPointsWithBoost } = await import('@/lib/pointsService');
            await addPointsWithBoost(user._id.toString(), 2, 'createAnswer', { question: question._id.toString() });
        }

        // Vérification et attribution des badges
        await BadgeService.checkAndAwardBadges(user._id.toString());

        // Mettre à jour la progression des quêtes
        const { QuestService } = await import('@/lib/questService');
        await QuestService.updateQuestProgress(user._id.toString(), 'forum_answer');

        // Notification de l'auteur de la question
        const { NotificationService } = await import('@/lib/notificationService');
        await NotificationService.notifyNewForumAnswer(question._id.toString(), user._id.toString());

        // Notification des utilisateurs mentionnés (best-effort, non bloquant)
        if (mentionedUserIds.length > 0) {
            try {
                const NotifSvc: any = NotificationService as any;
                const notifyFn =
                    NotifSvc.notifyForumMention ||
                    NotifSvc.notifyMention ||
                    NotifSvc.notify;
                for (const uid of mentionedUserIds) {
                    if (typeof notifyFn === "function") {
                        await notifyFn.call(NotifSvc, {
                            type: "forum_mention",
                            recipientId: uid,
                            senderId: user._id.toString(),
                            questionId: question._id.toString(),
                            answerId: newAnswer._id.toString(),
                        });
                    }
                }
            } catch (notifErr) {
                console.warn("Notification mention échouée :", notifErr);
            }
        }

        const canonicalSlug = buildIdSlug(question._id.toString(), question.slug || question.title);
        revalidatePath(`/forum/${canonicalSlug}`);

        // Temps réel : prévenir les clients présents sur la question
        emitAnswerChanged(question._id.toString(), { answerId: newAnswer._id.toString() });

        return NextResponse.json(
            { success: true, message: "Réponse ajoutée avec succès.", data: newAnswer },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Erreur lors de l'ajout de la réponse :", error.message);
        return NextResponse.json(
            {
                success: false,
                message: "Impossible d'ajouter la réponse.",

            },
            { status: 500 }
        );
    }
}