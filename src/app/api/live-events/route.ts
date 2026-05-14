import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import LiveEvent from "@/models/LiveEvent";
import User from "@/models/User";

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
    const { title, videoId, scheduledAt, isActive } = body;

    if (!title || !videoId || !scheduledAt) {
        return NextResponse.json({ message: "Titre, videoId et date requis" }, { status: 400 });
    }

    const event = await LiveEvent.create({
        title: title.trim(),
        videoId: videoId.trim(),
        scheduledAt: new Date(scheduledAt),
        isActive: isActive ?? true,
        createdBy: admin._id,
    });

    return NextResponse.json({ event }, { status: 201 });
}
