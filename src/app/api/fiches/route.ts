import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import Revision from "@/models/Revision";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";

// Initialisation du client S3 pour Backblaze B2
const s3 = new S3Client({
    region: "eu-central-003",
    endpoint: process.env.B2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
});

// Fonction pour téléverser un fichier dans S3
async function uploadFileToS3(file: File, bucketName: string) {
    const fileKey = `uploads/${uuidv4()}-${file.name}`;
    const upload = new Upload({
        client: s3,
        params: {
            Bucket: bucketName,
            Key: fileKey,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type,
        },
    });
    await upload.done();
    return `${process.env.B2_ENDPOINT}/${bucketName}/${fileKey}`;
}

// Route pour créer une fiche de révision
export async function POST(req: NextRequest) {
    try {
        // Authentification
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { error: "Non autorisé. Utilisateur non trouvé." },
                { status: 401 }
            );
        }

        // Récupération des données du formulaire
        const formData = await req.formData();
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const subject = formData.get("subject") as string;
        const level = formData.get("level") as string;

        // Vérifications
        if (!title || !subject || !level) {
            return NextResponse.json(
                { error: "Titre, matière ou niveau manquant." },
                { status: 400 }
            );
        }

        // Téléversement des fichiers
        const fileURLs: string[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "file" && value instanceof File) {
                const fileUrl = await uploadFileToS3(value, process.env.B2_BUCKET_NAME!);
                fileURLs.push(fileUrl);
            }
        }

        // Définir le statut en fonction du rôle
        const status =
            ['Rédacteur', 'Correcteur', 'Admin'].includes(user.role)
                ? 'Certifiée'
                : 'Non Certifiée';

        // Création de la fiche
        const revisionData = {
            title,
            content,
            subject,
            level,
            author: user._id, // Utilisation directe de l'ID utilisateur
            files: fileURLs,
            createdAt: new Date(),
            status, // Ajout du statut
        };

        const newRevision = await Revision.create(revisionData);

        // Ajout de 10 points à l'utilisateur
        await User.findByIdAndUpdate(user._id, { $inc: { points: 10 } });

        return NextResponse.json(newRevision, { status: 201 });
    } catch (error: any) {
        console.error("Erreur lors de la création de la fiche :", error.message);
        return NextResponse.json(
            { error: "Impossible de créer la fiche de révision.", details: error.message },
            { status: 500 }
        );
    }
}
