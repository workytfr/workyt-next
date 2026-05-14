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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ message: "Non autorisé" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const update: Record<string, any> = {};
    if (body.title !== undefined) update.title = body.title.trim();
    if (body.videoId !== undefined) update.videoId = body.videoId.trim();
    if (body.scheduledAt !== undefined) update.scheduledAt = new Date(body.scheduledAt);
    if (body.isActive !== undefined) update.isActive = body.isActive;

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
