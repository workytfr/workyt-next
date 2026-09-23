import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Affichage d'une photo de profil stockée sur R2.
 *
 * Le bucket n'est pas exposé publiquement : on relaie le fichier. Le nom est un
 * UUID, donc le contenu ne change jamais — on met un cache long, et la charge
 * serveur reste négligeable.
 */

export const runtime = "nodejs";

const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

/** UUID + extension image : rien d'autre ne doit sortir du dossier avatars/. */
const SAFE = /^[0-9a-f-]{36}\.(png|jpg|webp)$/i;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
    try {
        const { file } = await params;
        if (!SAFE.test(file)) {
            return NextResponse.json({ error: "Fichier invalide." }, { status: 400 });
        }

        const obj = await s3.send(
            new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: `avatars/${file}` }),
        );
        const body = await obj.Body?.transformToByteArray();
        if (!body) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

        return new NextResponse(Buffer.from(body), {
            headers: {
                "Content-Type": obj.ContentType || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error: any) {
        if (error?.name === "NoSuchKey") {
            return NextResponse.json({ error: "Introuvable." }, { status: 404 });
        }
        console.error("Erreur GET /api/media/avatar :", error);
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}
