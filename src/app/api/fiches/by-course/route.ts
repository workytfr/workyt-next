import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Revision from "@/models/Revision";

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

        const fiches = await Revision.find({ courseId })
            .populate({ path: "author", select: "username image" })
            .sort({ createdAt: -1 })
            .select("title slug likes status author subject level files createdAt comments");

        const total = await Revision.countDocuments({ courseId });

        return NextResponse.json({
            success: true,
            data: fiches,
            total,
        });
    } catch (error: any) {
        console.error("Erreur récupération fiches par cours :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de récupérer les fiches." },
            { status: 500 }
        );
    }
}
