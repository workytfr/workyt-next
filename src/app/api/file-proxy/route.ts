import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import Question from "@/models/Question";
import { getFileFromStorage, extractFileKeyFromUrl } from "@/lib/b2Utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Dossiers R2 autorisés en accès direct via ?file= (clés à UUID non devinables)
const ALLOWED_FILE_PREFIXES = ["audio-tts/", "evaluations/", "fiches/"];

/**
 * Type servi, déduit de l'extension uniquement : le ContentType stocké vient du
 * client à l'upload. Sinon un .html ou un .svg téléversé était servi « inline »
 * sur workyt.fr et son script s'exécutait avec la session du visiteur.
 * Tout ce qui n'est pas dans cette liste part en téléchargement.
 */
const INLINE_TYPES: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    // Dessins des fiches : affichés via <img> (aucun script n'y tourne) ; ouverts
    // directement, la CSP sandbox ci-dessous bloque leurs scripts.
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
};

function fileResponse(bytes: Uint8Array, key: string, cacheControl: string) {
    const lower = key.toLowerCase();
    const ext = Object.keys(INLINE_TYPES).find((e) => lower.endsWith(e));
    const type = ext ? INLINE_TYPES[ext] : key.startsWith("audio-tts/") ? "audio/mpeg" : null;
    return new NextResponse(Buffer.from(bytes), {
        status: 200,
        headers: {
            "Content-Type": type ?? "application/octet-stream",
            "Content-Disposition": type ? "inline" : "attachment",
            "X-Content-Type-Options": "nosniff",
            // Même ouvert directement, le fichier ne peut ni exécuter de script ni
            // accéder à l'origine. Pas sur les PDF : Chrome refuse d'afficher un
            // PDF dans un document sandboxé.
            ...(type === "application/pdf" ? {} : { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'" }),
            "Cache-Control": cacheControl,
        },
    });
}

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
    const fileParam = req.nextUrl.searchParams.get("file");
    const fileIndex = parseInt(req.nextUrl.searchParams.get("index") || "0", 10);

    if (!ficheId && !questionId && !fileParam) {
        return NextResponse.json({ error: "ficheId, questionId ou file requis" }, { status: 400 });
    }

    if (!process.env.S3_BUCKET_NAME || !process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
        console.error("File proxy: variables R2/S3 manquantes");
        return NextResponse.json({ error: "Configuration stockage manquante" }, { status: 503 });
    }

    const bucketName = process.env.S3_BUCKET_NAME;

    try {
        // Accès direct par clé ou URL R2 (audio TTS, PDF/photos d'évaluation).
        // Accepte une clé brute (evaluations/...) ou l'URL complète stockée en base
        // (qui pointe vers l'endpoint privé R2 et n'est pas lisible directement).
        if (fileParam) {
            const key = (fileParam.startsWith("http://") || fileParam.startsWith("https://"))
                ? extractFileKeyFromUrl(fileParam)
                : fileParam.replace(/^\/+/, "");

            // Sécurité : restreindre aux dossiers autorisés
            if (!key || !ALLOWED_FILE_PREFIXES.some((p) => key.startsWith(p))) {
                return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
            }

            // Copies d'évaluation : réservées aux membres connectés, jamais en
            // cache partagé (la clé circule dans les URL et les logs).
            const isEvaluation = key.startsWith("evaluations/");
            if (isEvaluation && !(await getServerSession(authOptions))) {
                return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
            }

            const response = await getFileFromStorage(bucketName, key);
            if (!response.Body) {
                return NextResponse.json({ error: "Fichier vide" }, { status: 500 });
            }

            const bytes = await response.Body.transformToByteArray();
            return fileResponse(bytes, key, isEvaluation ? "private, max-age=3600" : "public, max-age=604800");
        }

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

        const bytes = await response.Body.transformToByteArray();
        return fileResponse(bytes, fileKey, "public, max-age=86400");
    } catch (error: any) {
        console.error("File proxy error:", error?.message || error, { ficheId, fileIndex });
        return NextResponse.json(
            { error: "Impossible de récupérer le fichier", ...(process.env.NODE_ENV === "development" && { details: error?.message }) },
            { status: 500 }
        );
    }
};
