import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import LiveEvent from "@/models/LiveEvent";
import User from "@/models/User";
import { extractYoutubeId, type IPlatform } from "@/lib/livePlatforms";

async function requireAdmin(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    await connectDB();
    const user = await User.findById(session.user.id).select("role");
    if (user?.role !== "Admin") return null;
    return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ message: "Non autorisé" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.title !== undefined) update.title = body.title.trim();
    if (body.scheduledAt !== undefined) update.scheduledAt = new Date(body.scheduledAt);
    if (body.isActive !== undefined) update.isActive = body.isActive;
    if (body.forceLive !== undefined) update.forceLive = body.forceLive;

    if (Array.isArray(body.platforms)) {
        const normalizedPlatforms: IPlatform[] = body.platforms.map((p: IPlatform) => {
            if (p.type === "youtube") {
                const vid = extractYoutubeId(p.url);
                return { type: "youtube", url: vid ? `https://www.youtube.com/watch?v=${vid}` : p.url };
            }
            return { type: p.type, url: p.url.trim() };
        });
        update.platforms = normalizedPlatforms;

        const youtubePlatform = normalizedPlatforms.find((p) => p.type === "youtube");
        update.videoId = youtubePlatform ? (extractYoutubeId(youtubePlatform.url) ?? undefined) : undefined;
    }

    const event = await LiveEvent.findByIdAndUpdate(id, update, { new: true });
    if (!event) return NextResponse.json({ message: "Événement introuvable" }, { status: 404 });

    return NextResponse.json({ event });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ message: "Non autorisé" }, { status: 403 });

    const { id } = await params;
    await LiveEvent.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
}
