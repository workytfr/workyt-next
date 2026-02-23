import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";

connectDB();

// GET /api/bookmarks/check?revisionId=xxx | questionId=xxx | courseId=xxx
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ success: true, bookmarked: false });
        }

        const { searchParams } = new URL(req.url);
        const revisionId = searchParams.get("revisionId");
        const questionId = searchParams.get("questionId");
        const courseId = searchParams.get("courseId");
        const exerciseId = searchParams.get("exerciseId");

        let refId: string | null = null;
        let contentType: 'fiche' | 'forum' | 'cours' | 'exercise' = 'fiche';

        if (revisionId && mongoose.Types.ObjectId.isValid(revisionId)) {
            refId = revisionId;
            contentType = 'fiche';
        } else if (questionId && mongoose.Types.ObjectId.isValid(questionId)) {
            refId = questionId;
            contentType = 'forum';
        } else if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
            refId = courseId;
            contentType = 'cours';
        } else if (exerciseId && mongoose.Types.ObjectId.isValid(exerciseId)) {
            refId = exerciseId;
            contentType = 'exercise';
        } else {
            return NextResponse.json(
                { success: false, message: "ID invalide. Fournissez revisionId, questionId, courseId ou exerciseId." },
                { status: 400 }
            );
        }

        const existing = await Bookmark.findOne({
            user: user._id,
            $or: [
                { revision: refId },
                { contentType, refId: new mongoose.Types.ObjectId(refId) },
            ],
        });

        return NextResponse.json({
            success: true,
            bookmarked: !!existing,
            collection: existing?.collectionName || null,
        });
    } catch (error: any) {
        console.error("Erreur bookmarks check:", error.message);
        return NextResponse.json({ success: true, bookmarked: false });
    }
}
