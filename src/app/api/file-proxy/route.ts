import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import { getFileFromStorage } from "@/lib/b2Utils";

connectDB();

/**
 * Proxy pour servir les fichiers R2 via le serveur Next.js.
 * Contourne les problèmes CORS et iframe des URLs signées R2.
 * Usage: /api/file-proxy?ficheId=xxx&index=0
 */
export const GET = async (req: NextRequest) => {
    const ficheId = req.nextUrl.searchParams.get("ficheId");
    const fileIndex = parseInt(req.nextUrl.searchParams.get("index") || "0", 10);

    if (!ficheId) {
        return NextResponse.json({ error: "ficheId requis" }, { status: 400 });
    }

    try {
        const fiche = await Revision.findById(ficheId).select("files");
        if (!fiche || !fiche.files || !fiche.files[fileIndex]) {
            return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
        }

        const fileUrl: string = fiche.files[fileIndex];

        // Extraire la clé du fichier - les clés R2 sont au format: workyt/fiches/uuid-file.pdf
        const rawKey = fileUrl.split("/").slice(-1)[0];
        const fileKey = `workyt/fiches/${decodeURIComponent(rawKey)}`;

        const response = await getFileFromStorage(process.env.S3_BUCKET_NAME!, fileKey);

        if (!response.Body) {
            return NextResponse.json({ error: "Fichier vide" }, { status: 500 });
        }

        // Déterminer le Content-Type
        const fileNameLower = rawKey.toLowerCase();
        let contentType = response.ContentType || "application/octet-stream";
        if (fileNameLower.endsWith(".pdf")) contentType = "application/pdf";
        else if (fileNameLower.endsWith(".png")) contentType = "image/png";
        else if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (fileNameLower.endsWith(".webp")) contentType = "image/webp";
        else if (fileNameLower.endsWith(".gif")) contentType = "image/gif";

        const bytes = await response.Body.transformToByteArray();

        return new NextResponse(bytes, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": "inline",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error: any) {
        console.error("File proxy error:", error.message);
        return NextResponse.json({ error: "Impossible de récupérer le fichier" }, { status: 500 });
    }
};
