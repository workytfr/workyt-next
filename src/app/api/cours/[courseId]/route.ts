// app/api/cours/[courseId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
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
        if (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            query.status = "publie";
        }

        // Fetch course with populated sections
        const cours = await Course.findOne(query)
            .populate({
                path: "sections",
                select: "title order",
                options: { sort: { order: 1 } },
            })
            .lean();

        if (!cours) {
            return NextResponse.json(
                { error: "Cours non trouvé" },
                { status: 404 }
            );
        }

        // Add user context to response if needed
        const response = {
            cours,
            userRole: user?.role || "anonymous",
            canEdit: user && ["Rédacteur", "Correcteur", "Admin"].includes(user.role)
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération du cours:", error.message);

        // Don't expose internal error details in production
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

// Optional: Add other HTTP methods if needed
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
    try {
        await dbConnect();

        // Require authentication for updates
        const user = await authMiddleware(req);

        if (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json(
                { error: "Accès non autorisé" },
                { status: 403 }
            );
        }

        const { courseId } = await params;

        if (!isValidObjectId(courseId)) {
            return NextResponse.json(
                { error: "ID de cours invalide" },
                { status: 400 }
            );
        }

        const updates = await req.json();

        // Validate updates object here
        if (!updates || typeof updates !== "object") {
            return NextResponse.json(
                { error: "Données de mise à jour invalides" },
                { status: 400 }
            );
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate({
            path: "sections",
            select: "title order",
            options: { sort: { order: 1 } },
        });

        if (!updatedCourse) {
            return NextResponse.json(
                { error: "Cours non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json({ cours: updatedCourse }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du cours:", error.message);

        return NextResponse.json(
            {
                error: "Impossible de mettre à jour le cours.",
                ...(process.env.NODE_ENV === "development" && { details: error.message }),
            },
            { status: 500 }
        );
    }
}