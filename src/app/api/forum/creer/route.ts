import { NextRequest, NextResponse } from "next/server";
import B2 from "backblaze-b2";
import { v4 as uuidv4 } from "uuid";
import Question from "@/models/Question";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";
import authMiddleware from "@/middlewares/authMiddleware";
import dbConnect from "@/lib/mongodb";

//  Désactiver `bodyParser` pour gérer `multipart/form-data`
export const config = {
    api: {
        bodyParser: false,
    },
};

//  Initialisation de Backblaze B2
const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID!,
    applicationKey: process.env.B2_APPLICATION_KEY!,
});

//  Fonction pour convertir un `ReadableStream` en `Buffer`
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

//  Fonction pour nettoyer le nom des fichiers
function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[<>:"/\\|?*]+/g, "_");
}

//  Fonction pour téléverser un fichier dans Backblaze B2
async function uploadFileToB2(file: File) {
    try {
        await b2.authorize();

        const bucketId = process.env.B2_BUCKET_ID!;
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;

        //  Convertir le fichier en Buffer
        const fileBuffer = await streamToBuffer(file.stream());

        //  Obtenir l'URL d'upload
        const uploadUrlResponse = await b2.getUploadUrl({ bucketId });

        //  Téléverser le fichier
        await b2.uploadFile({
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

//  Route POST pour créer une question
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé. Utilisateur non trouvé." }, { status: 401 });
        }

        //  Récupération des données du formulaire
        const formData = await req.formData();
        console.log(" FormData reçu :", formData);

        const title = formData.get("title") as string;
        const classLevel = formData.get("classLevel") as string;
        const subject = formData.get("subject") as string;
        const whatIDid = formData.get("whatIDid") as string;
        const whatINeed = formData.get("whatINeed") as string;
        const points = parseInt(formData.get("points") as string, 10);

        if (!title || !classLevel || !subject || !whatIDid || !whatINeed || isNaN(points)) {
            return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
        }

        if (points < 1 || points > 15) {
            return NextResponse.json({ error: "Les points doivent être entre 1 et 15." }, { status: 400 });
        }

        if (user.points < points) {
            return NextResponse.json({ error: "Vous n'avez pas assez de points pour poser cette question." }, { status: 400 });
        }

        //  Téléversement des fichiers
        const fileURLs: string[] = [];
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(" Téléversement du fichier :", value.name);
                const fileUrl = await uploadFileToB2(value);
                fileURLs.push(fileUrl);
            }
        }

        console.log(" Fichiers téléversés :", fileURLs);

        //  Création de la question
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

        //  Déduire les points de l'utilisateur
        await User.findByIdAndUpdate(user._id, { $inc: { points: -points } });

        //  Enregistrer la transaction
        await PointTransaction.create({
            user: user._id,
            question: newQuestion._id,
            type: "perte",
            points: points,
            createdAt: new Date(),
        });

        return NextResponse.json(newQuestion, { status: 201 });
    } catch (error: any) {
        console.error("Erreur lors de la création de la question :", error.message);
        return NextResponse.json({ error: "Impossible de créer la question.", details: error.message }, { status: 500 });
    }
}
