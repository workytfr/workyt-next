import { NextRequest, NextResponse } from "next/server";
import B2 from "backblaze-b2";
import { v4 as uuidv4 } from "uuid";
import Revision from "@/models/Revision";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";
import dbConnect from "@/lib/mongodb";

// Initialisation de Backblaze B2
const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID!,
    applicationKey: process.env.B2_APPLICATION_KEY!,
});

// Fonction pour convertir un ReadableStream en Buffer
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) chunks.push(value);
        done = readerDone;
    }

    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

// Fonction pour nettoyer le nom des fichiers
function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]+/g, "_");
}

// Fonction pour téléverser un fichier dans Backblaze B2
async function uploadFileToB2(file: File) {
    try {
        // Authentifier avec Backblaze
        await b2.authorize();

        const bucketId = process.env.B2_BUCKET_ID!;
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;


        // Convertir le fichier (ReadableStream) en Buffer
        const fileBuffer = await streamToBuffer(file.stream());

        // Obtenir l'URL d'upload
        const uploadUrlResponse = await b2.getUploadUrl({ bucketId });

        // Téléverser le fichier
        const uploadResponse = await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName: fileKey,
            data: fileBuffer,
            contentType: file.type,
        });

        return `${process.env.B2_ENDPOINT}/file/${bucketId}/${fileKey}`;
    } catch (error: any) {
        console.error("Erreur lors du téléversement :", error.response?.data || error.message);
        throw new Error("Échec du téléversement du fichier.");
    }
}

// Route POST pour créer une fiche de révision
export async function POST(req: NextRequest) {
    try {
        // Connexion à MongoDB
        await dbConnect();

        // Authentification de l'utilisateur
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
                const fileUrl = await uploadFileToB2(value);
                fileURLs.push(fileUrl);
            }
        }

        // Définir le statut en fonction du rôle
        const status =
            ["Rédacteur", "Correcteur", "Admin"].includes(user.role)
                ? "Certifiée"
                : "Non Certifiée";

        // Création de la fiche
        const revisionData = {
            title,
            content,
            subject,
            level,
            author: user._id,
            files: fileURLs,
            createdAt: new Date(),
            status,
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
