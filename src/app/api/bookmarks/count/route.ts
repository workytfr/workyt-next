import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import authMiddleware from "@/middlewares/authMiddleware";

connectDB();

// GET /api/bookmarks/count - Retourne le nombre total de bookmarks (léger, pour le badge)
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const count = await Bookmark.countDocuments({ user: user._id });

        return NextResponse.json({
            success: true,
            count,
        });
    } catch (error: any) {
        console.error("Erreur bookmarks count:", error.message);
        return NextResponse.json({ success: true, count: 0 });
    }
}
