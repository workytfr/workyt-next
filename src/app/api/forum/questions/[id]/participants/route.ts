import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import mongoose from "mongoose";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await dbConnect();
        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const question = await Question.findById(id).populate({
            path: "user",
            select: "username _id",
        }).lean();
        if (!question) {
            return NextResponse.json({ error: "Question non trouvée" }, { status: 404 });
        }

        const answers = await Answer.find({ question: id })
            .populate({ path: "user", select: "username _id" })
            .lean();

        const seen = new Set<string>();
        const participants: { _id: string; username: string }[] = [];

        const addUser = (u: any) => {
            if (!u?._id || !u?.username) return;
            const id = String(u._id);
            if (seen.has(id)) return;
            seen.add(id);
            participants.push({ _id: id, username: u.username });
        };

        addUser((question as any).user);
        for (const a of answers as any[]) addUser(a.user);

        return NextResponse.json({ participants });
    } catch (err: any) {
        console.error("Erreur participants :", err?.message ?? err);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
