import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/authOptions";
import { hasPermission } from "@/lib/roles";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

/**
 * Envoi de la photo de profil, en passant par le serveur.
 *
 * Volontairement différent des fiches, qui envoient directement sur R2 avec une
 * URL signée : cela suppose des règles CORS sur le bucket, qui ne sont pas
 * configurées (le navigateur renvoie « Failed to fetch »). Ici le fichier
 * transite par le serveur : aucune configuration de stockage n'est nécessaire,
 * et la photo reste petite (3 Mo maximum).
 *
 * La photo est ensuite servie par /api/media/avatar/<fichier>.
 */

export const runtime = "nodejs";

const MAX_BYTES = 3 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
};

const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }
        if (!(await hasPermission(session.user.role as string, "profile.custom_photo"))) {
            return NextResponse.json(
                { error: "Cette fonctionnalité est réservée aux bénévoles de l'association." },
                { status: 403 },
            );
        }

        const rl = rateLimit(`avatar-upload:${session.user.id}`, 10, 60 * 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const form = await req.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
        }

        const ext = MIME_EXT[file.type];
        if (!ext) {
            return NextResponse.json({ error: "Formats acceptés : JPG, PNG ou WebP." }, { status: 400 });
        }
        if (file.size <= 0 || file.size > MAX_BYTES) {
            return NextResponse.json({ error: "Image trop lourde (3 Mo maximum)." }, { status: 400 });
        }

        const name = `${uuidv4()}.${ext}`;
        const key = `avatars/${name}`;
        const body = Buffer.from(await file.arrayBuffer());

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: key,
                ContentType: file.type,
                CacheControl: "public, max-age=31536000, immutable",
                Body: body,
            }),
        );

        // Servie par notre proxy : indépendant de la configuration publique du bucket
        return NextResponse.json({ success: true, key, url: `/api/media/avatar/${name}` });
    } catch (error) {
        console.error("Erreur POST /api/users/me/photo/upload :", error);
        return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
    }
}
