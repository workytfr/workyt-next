import { NextRequest, NextResponse } from "next/server";
import { getFileFromStorage } from "@/lib/b2Utils";

/**
 * GET /api/tts/audio/[lessonId]
 * Sert le fichier audio TTS directement depuis R2
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    const { lessonId } = await params;
    const bucketName = process.env.S3_BUCKET_NAME || "workyt";
    const fileKey = `audio-tts/${lessonId}.mp3`;

    try {
        const response = await getFileFromStorage(bucketName, fileKey);

        if (!response.Body) {
            return NextResponse.json({ error: "Audio non trouvé" }, { status: 404 });
        }

        const bytes = await response.Body.transformToByteArray();

        return new NextResponse(Buffer.from(bytes), {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Accept-Ranges": "bytes",
                "Content-Length": bytes.length.toString(),
                "Cache-Control": "public, max-age=604800",
            },
        });
    } catch (error: any) {
        console.error("Erreur audio TTS:", error?.message);
        return NextResponse.json({ error: "Audio non trouvé" }, { status: 404 });
    }
}
