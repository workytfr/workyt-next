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

export async function GET() {
    await connectDB();
    const events = await LiveEvent.find()
        .sort({ scheduledAt: -1 })
        .limit(20)
        .lean();
    return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ message: "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { title, scheduledAt, isActive, platforms } = body;

    if (!title || !scheduledAt) {
        return NextResponse.json({ message: "Titre et date requis" }, { status: 400 });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
        return NextResponse.json({ message: "Au moins une plateforme est requise" }, { status: 400 });
    }

    // Normalize platforms and extract YouTube videoId
    const normalizedPlatforms: IPlatform[] = platforms.map((p: IPlatform) => {
        if (p.type === "youtube") {
            const id = extractYoutubeId(p.url);
            return { type: "youtube", url: id ? `https://www.youtube.com/watch?v=${id}` : p.url };
        }
        return { type: p.type, url: p.url.trim() };
    });

    const youtubePlatform = normalizedPlatforms.find((p) => p.type === "youtube");
    const videoId = youtubePlatform ? extractYoutubeId(youtubePlatform.url) ?? undefined : undefined;

    const event = await LiveEvent.create({
        title: title.trim(),
        videoId,
        platforms: normalizedPlatforms,
        scheduledAt: new Date(scheduledAt),
        isActive: isActive ?? true,
        createdBy: admin._id,
    });

    return NextResponse.json({ event }, { status: 201 });
}
