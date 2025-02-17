import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import Question from "@/models/Question";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";
import authMiddleware from "@/middlewares/authMiddleware";
import dbConnect from "@/lib/mongodb";


// Si besoin, vous pouvez définir le runtime à "node"
export const runtime = "nodejs";

// Initialiser le client S3 pour Cloudflare R2
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!, // Utilisez S3_ACCESS_KEY
        secretAccessKey: process.env.S3_SECRET_KEY!, // Utilisez S3_SECRET_KEY
    },
    // Pour Cloudflare R2, il peut être utile d'activer le mode "forcePathStyle"
    forcePathStyle: true,
});

// Convertir un File en Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Nettoyer le nom du fichier (enlever les caractères spéciaux)
function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]+/g, "_");
}

// Fonction pour téléverser un fichier dans Cloudflare R2
async function uploadFileToR2(file: File): Promise<string> {
    try {
        const sanitizedFileName = sanitizeFileName(file.name);
        // Générer un chemin unique
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;

        // Conversion en Buffer
        const fileBuffer = await fileToBuffer(file);

        // Envoi du fichier à R2 via PutObjectCommand
        const putCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: file.type,
        });

        await s3Client.send(putCommand);

        // Construction de l'URL finale (à adapter selon votre configuration)
        const publicUrl = process.env.R2_PUBLIC_URL
            ? process.env.R2_PUBLIC_URL
            : `${process.env.R2_ENDPOINT?.replace("https://", "")}`;

        return `https://${publicUrl}/${process.env.R2_BUCKET_NAME}/${fileKey}`;
    } catch (error: any) {
        console.error("Erreur lors du téléversement :", error.message || error);
        throw new Error("Échec du téléversement du fichier sur R2.");
    }
}

// Route POST pour créer une question
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Vérifier l'authentification
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { error: "Non autorisé. Utilisateur non trouvé." },
                { status: 401 }
            );
        }

        // Récupérer les données du formulaire
        const formData = await req.formData();
        console.log("FormData reçu :", formData);

        const title = formData.get("title") as string;
        const classLevel = formData.get("classLevel") as string;
        const subject = formData.get("subject") as string;
        const whatIDid = formData.get("whatIDid") as string;
        const whatINeed = formData.get("whatINeed") as string;
        const points = parseInt(formData.get("points") as string, 10);

        // Vérifications basiques
        if (!title || !classLevel || !subject || !whatIDid || !whatINeed || isNaN(points)) {
            return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
        }
        if (points < 1 || points > 15) {
            return NextResponse.json({ error: "Les points doivent être entre 1 et 15." }, { status: 400 });
        }
        if (user.points < points) {
            return NextResponse.json(
                { error: "Vous n'avez pas assez de points pour poser cette question." },
                { status: 400 }
            );
        }

        // Téléversement des fichiers sur R2
        const fileURLs: string[] = [];
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log("Téléversement du fichier :", value.name);
                const fileUrl = await uploadFileToR2(value);
                fileURLs.push(fileUrl);
            }
        }
        console.log("Fichiers téléversés :", fileURLs);

        // Création de la question
        const questionData = {
            user: user._id,
            title,
            classLevel,
            subject,
            description: {
                whatIDid,
                whatINeed,
            },
            attachments: fileURLs,
            points,
            status: "Non validée",
            createdAt: new Date(),
        };
        const newQuestion = await Question.create(questionData);

        // Déduction des points de l'utilisateur
        await User.findByIdAndUpdate(user._id, { $inc: { points: -points } });

        // Enregistrement de la transaction de points
        await PointTransaction.create({
            user: user._id,
            question: newQuestion._id,
            type: "perte",
            points,
            createdAt: new Date(),
        });

        return NextResponse.json(newQuestion, { status: 201 });
    } catch (error: any) {
        console.error("Erreur lors de la création de la question :", error.message);
        return NextResponse.json(
            { error: "Impossible de créer la question.", details: error.message },
            { status: 500 }
        );
    }
}
