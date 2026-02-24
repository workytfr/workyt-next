// app/api/cours/[courseId]/full/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";
import { isValidObjectId } from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
    try {
        await dbConnect();

        let user = null;
        try {
            user = await authMiddleware(req);
        } catch {
            // User authentication failed, continue as anonymous
            user = null;
        }

        const { courseId } = await params;

        // Validate ObjectId format
        if (!isValidObjectId(courseId)) {
            return NextResponse.json(
                { error: "ID de cours invalide" },
                { status: 400 }
            );
        }

        // Build query based on user permissions
        const query: any = { _id: courseId };

        // If user is not authorized to see unpublished content
        if (!user || typeof user.role !== 'string' || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            query.status = "publie";
        }

        // Ensure Section model is registered before populating virtuals
        void Section;

        // Fetch course with fully populated sections (lessons, exercises, quizzes metadata)
        const cours = await Course.findOne(query)
            .populate({
                path: "sections",
                select: "title order",
                options: { sort: { order: 1 } },
                populate: [
                    {
                        path: "lessons",
                        select: "title order _id",
                        options: { sort: { order: 1 } },
                    },
                    {
                        path: "exercises",
                        select: "title difficulty _id",
                        options: { sort: { order: 1 } },
                    },
                    {
                        path: "quizzes",
                        select: "title _id",
                    },
                ],
            })
            .lean({ virtuals: true });

        if (!cours) {
            return NextResponse.json(
                { error: "Cours non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json({ cours }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération du cours complet:", error.message);

        const isDevelopment = process.env.NODE_ENV === "development";

        return NextResponse.json(
            {
                error: "Impossible de récupérer le cours.",
                ...(isDevelopment && { details: error.message }),
            },
            { status: 500 }
        );
    }
}
