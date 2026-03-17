import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { adminAuthMiddleware } from "@/middlewares/authMiddleware";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { generateAndUploadTTS } from "@/lib/elevenLabs";
import { generateSignedUrl } from "@/lib/b2Utils";
import Lesson from "@/models/Lesson";

/**
 * POST /api/tts
 * Génère un audio TTS pour une leçon (admin uniquement)
 * Body: { lessonId: string, voiceId?: string }
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await adminAuthMiddleware(req);

        // Rate limit: 10 générations par jour par admin
        const rl = rateLimit(`tts:${user._id}`, 10, 86_400_000);
        if (!rl.success) {
            return rateLimitResponse(rl.retryAfterMs);
        }

        const { lessonId, voiceId } = await req.json();

        if (!lessonId) {
            return NextResponse.json(
                { error: "L'identifiant de la leçon est requis." },
                { status: 400 }
            );
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return NextResponse.json(
                { error: "Leçon non trouvée." },
                { status: 404 }
            );
        }

        // Générer l'audio et l'uploader sur R2
        const fileKey = await generateAndUploadTTS(
            lessonId,
            lesson.content,
            voiceId
        );

        // Sauvegarder l'URL sur la leçon
        lesson.audioUrl = fileKey;
        await lesson.save();

        // Générer une URL signée pour la réponse
        const signedUrl = await generateSignedUrl(
            process.env.S3_BUCKET_NAME || "workyt",
            fileKey
        );

        return NextResponse.json({
            message: "Audio généré avec succès.",
            audioUrl: fileKey,
            signedUrl,
            remaining: rl.remaining,
        });
    } catch (error: any) {
        console.error("Erreur TTS :", error.message);

        if (error.message?.includes("caractères")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message?.includes("vide")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message?.includes("Non autorisé") || error.message?.includes("admin")) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json(
            { error: "Erreur lors de la génération de l'audio." },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tts
 * Supprime l'audio TTS d'une leçon (admin uniquement)
 * Body: { lessonId: string }
 */
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        await adminAuthMiddleware(req);

        const { lessonId } = await req.json();

        if (!lessonId) {
            return NextResponse.json(
                { error: "L'identifiant de la leçon est requis." },
                { status: 400 }
            );
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return NextResponse.json(
                { error: "Leçon non trouvée." },
                { status: 404 }
            );
        }

        if (lesson.audioUrl) {
            const { deleteFileFromStorage } = await import("@/lib/b2Utils");
            await deleteFileFromStorage(
                process.env.S3_BUCKET_NAME || "workyt",
                lesson.audioUrl
            );
        }

        lesson.audioUrl = undefined;
        await lesson.save();

        return NextResponse.json({ message: "Audio supprimé avec succès." });
    } catch (error: any) {
        console.error("Erreur suppression TTS :", error.message);
        return NextResponse.json(
            { error: "Erreur lors de la suppression de l'audio." },
            { status: 500 }
        );
    }
}
