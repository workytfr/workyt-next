import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * Batch fetch d'utilisateurs par IDs.
 * Utilisé par MentionMarkdown pour résoudre les mentions `@[user:id]`
 * en une seule requête au lieu d'une par mention.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json().catch(() => ({}));
        const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];

        // Garde-fou : max 100 IDs par requête
        const ids = rawIds
            .filter((x): x is string => typeof x === "string")
            .filter((id) => mongoose.isValidObjectId(id))
            .slice(0, 100);

        if (ids.length === 0) {
            return NextResponse.json({ users: [] });
        }

        const users = await User.find({ _id: { $in: ids } })
            .select("_id username")
            .lean();

        return NextResponse.json({
            users: users.map((u: any) => ({ _id: String(u._id), username: u.username })),
        });
    } catch (err: any) {
        console.error("Erreur batch users :", err?.message ?? err);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
