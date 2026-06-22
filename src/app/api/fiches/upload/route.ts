import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { optionalAuthMiddleware } from "@/middlewares/authMiddleware";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

const BUCKET = process.env.S3_BUCKET_NAME!;
const PUBLIC_BASE = process.env.R2_PUBLIC_URL || process.env.S3_ENDPOINT || "";

type Kind = "img" | "draw" | "attach";

const LIMITS: Record<Kind, { maxBytes: number; mime: RegExp }> = {
    img: { maxBytes: 5 * 1024 * 1024, mime: /^image\/(png|jpe?g|webp|gif|svg\+xml)$/ },
    draw: { maxBytes: 5 * 1024 * 1024, mime: /^image\/(png|svg\+xml)$|^application\/json$/ },
    attach: { maxBytes: 20 * 1024 * 1024, mime: /^(application\/pdf|image\/.+|text\/plain)$/ },
};

function sanitize(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

export async function POST(req: NextRequest) {
    try {
        // Auth : Bearer token (header) OU cookie de session NextAuth (appels same-origin
        // depuis l'éditeur, qui n'envoie pas de Bearer).
        let user: any = await optionalAuthMiddleware(req);
        if (!user) {
            const session = await getServerSession(authOptions);
            if (session?.user?.id) {
                user = await User.findById(session.user.id).select("-password");
            }
        }
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const rl = rateLimit(`fiche-upload:${user._id}`, 30, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Corps invalide." }, { status: 400 });

        const kind = body.kind as Kind;
        const filename = String(body.filename ?? "file");
        const contentType = String(body.contentType ?? "");
        const size = Number(body.size ?? 0);

        const limit = LIMITS[kind];
        if (!limit) return NextResponse.json({ error: "Type inconnu." }, { status: 400 });
        if (!limit.mime.test(contentType)) {
            return NextResponse.json({ error: `Type MIME non autorisé pour ${kind}.` }, { status: 400 });
        }
        if (!Number.isFinite(size) || size <= 0 || size > limit.maxBytes) {
            return NextResponse.json(
                { error: `Taille invalide (max ${Math.round(limit.maxBytes / 1024 / 1024)} MB).` },
                { status: 400 },
            );
        }

        const key = `fiches/${kind}/${uuidv4()}-${sanitize(filename)}`;

        const uploadUrl = await getSignedUrl(
            s3,
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                ContentType: contentType,
                ACL: "public-read",
            }),
            { expiresIn: 300 },
        );

        const publicUrl = `${PUBLIC_BASE}/${key}`;

        return NextResponse.json({ uploadUrl, publicUrl, key });
    } catch (err) {
        console.error("upload presign error", err);
        return NextResponse.json({ error: "Erreur lors de la signature." }, { status: 500 });
    }
}
