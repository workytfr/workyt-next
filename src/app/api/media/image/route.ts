import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/authOptions";
import { hasPermission } from "@/lib/roles";
import { putPublicObject } from "@/lib/publicStorage";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

/** Type réel d'après la signature binaire : le type annoncé par le navigateur ne suffit pas */
function sniffImage(buf: Buffer): { mime: string; ext: string } | null {
    if (buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: "image/png", ext: "png" };
    if (buf.toString("ascii", 0, 3) === "GIF") return { mime: "image/gif", ext: "gif" };
    if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
    return null;
}

/**
 * POST /api/media/image — image du back-office (couverture de cours, image
 * d'exercice, image insérée dans l'éditeur). Remplace UploadThing : le fichier
 * va dans le stockage public, sous `cours/images/`.
 * multipart/form-data : file
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }
    if (!(await hasPermission(session.user, "dashboard.access"))) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const rl = rateLimit(`media-image:${session.user.id}`, 30, 60 * 1000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: "Image trop lourde (8 Mo maximum)" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const type = sniffImage(buffer);
        if (!type) {
            return NextResponse.json({ error: "Seules les images JPEG, PNG, WebP et GIF sont acceptées" }, { status: 400 });
        }

        const url = await putPublicObject(`cours/images/${randomUUID()}.${type.ext}`, buffer, type.mime);
        return NextResponse.json({ url, name: file.name, size: file.size }, { status: 201 });
    } catch (error) {
        console.error("Erreur upload image :", error);
        return NextResponse.json({ error: "L'image n'a pas pu être envoyée" }, { status: 502 });
    }
}
