import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";

connectDB();

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const level = searchParams.get("level");
    const subject = searchParams.get("subject");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const skip = (page - 1) * limit;

    try {
        const filter: any = {};

        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: "i" } },
                { content: { $regex: query, $options: "i" } },
            ];
        }

        if (level) filter.level = level;
        if (subject) filter.subject = subject;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const fiches = await Revision.find(filter)
            .populate("author", "username points _id") // Populate `author` avec l'ID
            .select("title content likes comments status level subject createdAt") // Exclude `files`
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const results = fiches.map((fiche) => ({
            id: fiche._id,
            title: fiche.title,
            authors: fiche.author,
            content: fiche.content,
            likes: fiche.likes,
            comments: fiche.comments?.length || 0,
            status: fiche.status,
            level: fiche.level,
            subject: fiche.subject,
            createdAt: fiche.createdAt,
        }));

        const totalResults = await Revision.countDocuments(filter);

        return NextResponse.json({
            success: true,
            data: results,
            pagination: {
                total: totalResults,
                page,
                limit,
                totalPages: Math.ceil(totalResults / limit),
            },
        });
    } catch (error: any) {
        console.error("Erreur lors de la recherche :", error.message);
        return NextResponse.json({ success: false, message: "Erreur lors de la recherche." }, { status: 500 });
    }
};
