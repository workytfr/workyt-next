import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import Revision from "@/models/Revision";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";
import dbConnect from "@/lib/mongodb";

// Configuration de Cloudflare R2 via AWS SDK
const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

const bucketName = process.env.S3_BUCKET_NAME!;

// Fonction pour convertir un File en Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Fonction pour téléverser un fichier sur Cloudflare R2
async function uploadFileToR2(file: File) {
    try {
        const sanitizedFileName = file.name.replace(/[<>:"/\\|?*]+/g, "_");
        const fileKey = `fiches/${uuidv4()}-${sanitizedFileName}`;
        const fileBuffer = await fileToBuffer(file);

        await s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
                Body: fileBuffer,
                ContentType: file.type,
                ACL: "public-read",
            })
        );

        return `${process.env.R2_PUBLIC_URL}/${fileKey}`;
    } catch (error) {
        console.error("Erreur lors du téléversement :", error);
        throw new Error("Échec du téléversement du fichier.");
    }
}

// Route POST pour créer une fiche de révision
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const formData = await req.formData();
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const subject = formData.get("subject") as string;
        const level = formData.get("level") as string;

        if (!title || !subject || !level) {
            return NextResponse.json({ error: "Données obligatoires manquantes." }, { status: 400 });
        }

        const fileURLs: string[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "file" && value instanceof File) {
                const fileUrl = await uploadFileToR2(value);
                fileURLs.push(fileUrl);
            }
        }

        const status = ["Rédacteur", "Correcteur", "Admin"].includes(user.role) ? "Certifiée" : "Non Certifiée";

        const newRevision = await Revision.create({
            title,
            content,
            subject,
            level,
            author: user._id,
            files: fileURLs,
            createdAt: new Date(),
            status,
        });

        await User.findByIdAndUpdate(user._id, { $inc: { points: 10 } });
        return NextResponse.json(newRevision, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la création de la fiche." }, { status: 500 });
    }
}
