import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import Question from "@/models/Question";
import { getFileFromStorage, extractFileKeyFromUrl } from "@/lib/b2Utils";

connectDB();

/**
 * Proxy pour servir les fichiers R2 via le serveur Next.js.
 * Contourne les problèmes CORS et iframe des URLs signées R2.
 * Usage:
 *   - Fiches: /api/file-proxy?ficheId=xxx&index=0
 *   - Forum:  /api/file-proxy?questionId=xxx&index=0
 */
export const GET = async (req: NextRequest) => {
    const ficheId = req.nextUrl.searchParams.get("ficheId");
    const questionId = req.nextUrl.searchParams.get("questionId");
    const fileIndex = parseInt(req.nextUrl.searchParams.get("index") || "0", 10);

    if (!ficheId && !questionId) {
        return NextResponse.json({ error: "ficheId ou questionId requis" }, { status: 400 });
    }

    if (!process.env.S3_BUCKET_NAME || !process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
        console.error("File proxy: variables R2/S3 manquantes");
        return NextResponse.json({ error: "Configuration stockage manquante" }, { status: 503 });
    }

    const bucketName = process.env.S3_BUCKET_NAME;

    try {
        let fileUrl: string;
        let defaultPrefix: string;

        if (ficheId) {
            const fiche = await Revision.findById(ficheId).select("files");
            if (!fiche || !fiche.files || !fiche.files[fileIndex]) {
                return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
            }
            fileUrl = fiche.files[fileIndex];
            defaultPrefix = "fiches/";
        } else if (questionId) {
            const question = await Question.findById(questionId).select("attachments");
            if (!question || !question.attachments || !question.attachments[fileIndex]) {
                return NextResponse.json({ error: "Pièce jointe non trouvée" }, { status: 404 });
            }
            fileUrl = question.attachments[fileIndex];
            defaultPrefix = "uploads/";
        } else {
            return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
        }

        // Extraire la clé via extractFileKeyFromUrl (fiches: fiches/uuid-file.pdf, forum: uploads/uuid-file.pdf)
        let fileKey = extractFileKeyFromUrl(fileUrl);
        if (!fileKey) {
            const rawKey = fileUrl.split("/").pop()?.split("?")[0] || "";
            fileKey = rawKey.includes("/") ? rawKey : `${defaultPrefix}${decodeURIComponent(rawKey)}`;
        }

        const response = await getFileFromStorage(bucketName, fileKey);

        if (!response.Body) {
            return NextResponse.json({ error: "Fichier vide" }, { status: 500 });
        }

        // Déterminer le Content-Type
        const fileNameLower = fileKey.toLowerCase();
        let contentType = response.ContentType || "application/octet-stream";
        if (fileNameLower.endsWith(".pdf")) contentType = "application/pdf";
        else if (fileNameLower.endsWith(".png")) contentType = "image/png";
        else if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (fileNameLower.endsWith(".webp")) contentType = "image/webp";
        else if (fileNameLower.endsWith(".gif")) contentType = "image/gif";

        const bytes = await response.Body.transformToByteArray();

        return new NextResponse(Buffer.from(bytes), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": "inline",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error: any) {
        console.error("File proxy error:", error?.message || error, { ficheId, fileIndex });
        return NextResponse.json(
            { error: "Impossible de récupérer le fichier", ...(process.env.NODE_ENV === "development" && { details: error?.message }) },
            { status: 500 }
        );
    }
};
