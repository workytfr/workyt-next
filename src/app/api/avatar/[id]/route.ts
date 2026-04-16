import { NextRequest, NextResponse } from "next/server";
import { generateEigenAvatarPngBuffer } from "@/lib/eigenAvatarNode";

export const runtime = "nodejs";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * GET /api/avatar/[id]?size=128
 * PNG déterministe (même id → même avatar que sur le site eigen-avatar-generator).
 * Public, cache long (pas de données sensibles).
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: raw } = await params;
    const id = decodeURIComponent(raw);

    if (!ID_PATTERN.test(id)) {
        return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    const sizeParam = req.nextUrl.searchParams.get("size");
    const parsed = sizeParam ? Number.parseInt(sizeParam, 10) : 128;
    const size = Number.isFinite(parsed)
        ? Math.min(512, Math.max(32, parsed))
        : 128;

    try {
        const buffer = generateEigenAvatarPngBuffer(id, size);
        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (e) {
        console.error("[api/avatar]", e);
        return NextResponse.json({ error: "Génération impossible" }, { status: 500 });
    }
}
