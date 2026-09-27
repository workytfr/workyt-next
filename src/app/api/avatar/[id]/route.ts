import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ProfileCustomization from "@/models/ProfileCustomization";
import { generatedAvatarSvg } from "@/lib/blobatar";
import { sanitizeLook, type AvatarLook } from "@/lib/avatarLook";

export const runtime = "nodejs";

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * GET /api/avatar/[id]?size=128
 * SVG Blobatar (même id → même avatar que sur le site), avec les accessoires
 * équipés. Public ; cache court, puisque les accessoires peuvent changer.
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
        let look: AvatarLook = {};
        if (mongoose.isValidObjectId(id)) {
            await dbConnect();
            const custom = await ProfileCustomization.findOne({ user: id }).select("avatarLook").lean<{ avatarLook?: unknown }>();
            look = sanitizeLook(custom?.avatarLook);
        }
        const svg = generatedAvatarSvg(id, size, look);
        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
            },
        });
    } catch (e) {
        console.error("[api/avatar]", e);
        return NextResponse.json({ error: "Génération impossible" }, { status: 500 });
    }
}
