import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import User from "@/models/User";
import PointTransaction from '@/models/PointTransaction';
import { BadgeService } from "@/lib/badgeService";

// --- Configuration Client S3 pour Cloudflare R2 ---
const s3Client = new S3Client({
    region: process.env.R2_REGION,
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
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

// Téléverser un fichier sur Cloudflare R2
async function uploadFileToR2(file: File): Promise<string> {
    try {
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;

        // Conversion en Buffer
        const fileBuffer = await fileToBuffer(file);

        // Commande d'upload
        const putCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: file.type,
        });

        // Envoi de la requête à R2
        await s3Client.send(putCommand);

        // Construire l'URL publique (ou signée) selon votre configuration
        // Exemple : https://<votreCompte>.r2.cloudflarestorage.com/bucketName/uploads/...
        // OU si vous avez un domaine perso, adaptez ici
        const baseUrl = process.env.R2_PUBLIC_URL
            ? process.env.R2_PUBLIC_URL // ex: "https://cdn.mondomaine.com"
            : process.env.R2_ENDPOINT?.replace("https://", ""); // ex: "<compte>.r2.cloudflarestorage.com"

        return `https://${baseUrl}/${process.env.R2_BUCKET_NAME}/${fileKey}`;
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

        // Téléversement des fichiers (si présents)
        const fileURLs: string[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "file" && value instanceof File) {
                const fileUrl = await uploadFileToR2(value);
                fileURLs.push(fileUrl);
            }
        }

        // Création de la réponse
        const answerData = {
            user: user._id,
            question: question._id,
            content,
            likes: 0,
            status: "Proposée",
            attachments: fileURLs,
            createdAt: new Date(),
            isOwner, // Flag pour identifier si l'auteur est le même que la question
        };

        const newAnswer = await Answer.create(answerData);

        // Ajouter +2 points à l'utilisateur SI ce n'est PAS lui qui a posé la question
        if (!isOwner) {
            await User.findByIdAndUpdate(user._id, { $inc: { points: 2 } });
            await PointTransaction.create({
                user:   user._id,
                question: question._id,
                action: 'createAnswer',
                type:   'gain',
                points: 2
            });
        }

        // Vérification et attribution des badges
        await BadgeService.checkAndAwardBadges(user._id.toString());

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
                details: error.message,
            },
            { status: 500 }
        );
    }
}