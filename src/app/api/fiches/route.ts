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
        console.log("Authentification avec Backblaze B2...");
        await b2.authorize();
        console.log("Authentification réussie.");

        const bucketId = process.env.B2_BUCKET_ID!;
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;

        console.log("Conversion du fichier en buffer...");
        const fileBuffer = await streamToBuffer(file.stream());
        console.log("Buffer créé.");

        // Obtenir l'URL d'upload
        const uploadUrlResponse = await b2.getUploadUrl({ bucketId });
        console.log("URL d'upload obtenue.", uploadUrlResponse.data);

        // Téléverser le fichier
        const uploadResponse = await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName: fileKey,
            data: fileBuffer,
            contentType: file.type,
        });

        console.log("Téléversement réussi.", uploadResponse.data);
        return `${process.env.B2_ENDPOINT}/file/${bucketId}/${fileKey}`;
    } catch (error: any) {
        console.error("Erreur lors du téléversement :", error.response?.data || error.message);
        throw new Error("Échec du téléversement du fichier.");
    }
}
// Route POST pour créer une fiche de révision
export async function POST(req: NextRequest) {
    try {
        console.log("Connexion à MongoDB...");
        await dbConnect();
        console.log("Connexion réussie.");

        console.log("Vérification de l'utilisateur...");
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            console.error("Utilisateur non trouvé ou non authentifié.");
            return NextResponse.json(
                { error: "Non autorisé. Utilisateur non trouvé." },
                { status: 401 }
            );
        }
        console.log("Utilisateur authentifié :", user);

        console.log("Lecture des données du formulaire...");
        const formData = await req.formData();
        console.log("FormData reçu.", Array.from(formData.entries()));

        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const subject = formData.get("subject") as string;
        const level = formData.get("level") as string;

        // Vérifications
        if (!title || !subject || !level) {
            console.error("Données obligatoires manquantes.");
            return NextResponse.json(
                { error: "Titre, matière ou niveau manquant." },
                { status: 400 }
            );
        }

        console.log("Début du téléversement des fichiers...");
        const fileURLs: string[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "file" && value instanceof File) {
                console.log("Téléversement du fichier :", value.name);
                const fileUrl = await uploadFileToB2(value);
                fileURLs.push(fileUrl);
                console.log("Fichier téléversé :", fileUrl);
            }
        }

        // Définir le statut en fonction du rôle
        const status =
            ["Rédacteur", "Correcteur", "Admin"].includes(user.role)
                ? "Certifiée"
                : "Non Certifiée";

        console.log("Création de la fiche avec les données :", {
            title,
            content,
            subject,
            level,
            author: user._id,
            files: fileURLs,
            status,
        });

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

        console.log("Fiche créée avec succès :", newRevision);

        console.log("Mise à jour des points de l'utilisateur...");
        await User.findByIdAndUpdate(user._id, { $inc: { points: 10 } });
        console.log("Points mis à jour.");

        return NextResponse.json(newRevision, { status: 201 });
    } catch (error: any) {
        console.error("Erreur lors de la création de la fiche :", error.message);
        return NextResponse.json(
            { error: "Impossible de créer la fiche de révision.", details: error.message },
            { status: 500 }
        );
    }
}
