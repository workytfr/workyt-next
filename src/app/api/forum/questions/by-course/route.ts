import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json(
                { success: false, message: "Paramètre courseId requis." },
                { status: 400 }
            );
        }

        const total = await Question.countDocuments({ courseId });

        return NextResponse.json({
            success: true,
            total,
        });
    } catch (error: any) {
        console.error("Erreur comptage questions par cours :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de compter les questions." },
            { status: 500 }
        );
    }
}
