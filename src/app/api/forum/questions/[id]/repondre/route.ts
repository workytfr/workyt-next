import { NextRequest, NextResponse } from "next/server";
import B2 from "backblaze-b2";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import User from "@/models/User";

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

// Fonction pour téléverser un fichier dans Backblaze B2
async function uploadFileToB2(file: File) {
    try {
        await b2.authorize();
        const bucketId = process.env.B2_BUCKET_ID!;
        const sanitizedFileName = file.name.replace(/[<>:"/\\|?*]+/g, "_");
        const fileKey = `uploads/${uuidv4()}-${sanitizedFileName}`;
        const fileBuffer = await streamToBuffer(file.stream());

        const uploadUrlResponse = await b2.getUploadUrl({ bucketId });
        await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName: fileKey,
            data: fileBuffer,
            contentType: file.type,
        });

        return `${process.env.B2_ENDPOINT}/file/${bucketId}/${fileKey}`;
    } catch (error: any) {
        console.error("Erreur téléversement :", error.response?.data || error.message);
        throw new Error("Échec du téléversement du fichier.");
    }
}

// API pour ajouter une réponse à une question
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

        // Vérification de l'existence de la question
        const question = await Question.findById(params.id);
        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }

        // Vérification que l'utilisateur n'est pas l'auteur de la question
        const isOwner = user._id.toString() === question.user.toString();

        // Récupération des données de la requête
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
                const fileUrl = await uploadFileToB2(value);
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
            isOwner, // Ajoute un flag pour identifier les réponses de l'auteur de la question
        };

        const newAnswer = await Answer.create(answerData);

        // Ajouter +2 points à l'utilisateur SI ce n'est PAS lui qui a posé la question
        if (!isOwner) {
            await User.findByIdAndUpdate(user._id, { $inc: { points: 2 } });
        }

        return NextResponse.json(
            { success: true, message: "Réponse ajoutée avec succès.", data: newAnswer },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Erreur lors de l'ajout de la réponse :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible d'ajouter la réponse.", details: error.message },
            { status: 500 }
        );
    }
}
