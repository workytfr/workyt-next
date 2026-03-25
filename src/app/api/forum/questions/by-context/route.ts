import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Question from "@/models/Question";
import Answer from "@/models/Answer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // lesson | exercise
        const id = searchParams.get("id");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "5", 10);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const skip = (page - 1) * limit;

        if (!type || !id) {
            return NextResponse.json(
                { success: false, message: "Paramètres type et id requis." },
                { status: 400 }
            );
        }

        const filter: any = { contextType: type, contextId: id };
        if (status) filter.status = status;

        const questions = await Question.find(filter)
            .populate({ path: "user", select: "username points" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const questionIds = questions.map((q) => q._id);
        const answerCounts = await Answer.aggregate([
            { $match: { question: { $in: questionIds } } },
            { $group: { _id: "$question", count: { $sum: 1 } } },
        ]);
        const answerCountMap = answerCounts.reduce((acc: any, item: any) => {
            acc[item._id.toString()] = item.count;
            return acc;
        }, {});

        const questionsWithAnswers = questions.map((q) => ({
            ...q.toObject(),
            answerCount: answerCountMap[q._id.toString()] || 0,
        }));

        const total = await Question.countDocuments(filter);

        return NextResponse.json({
            success: true,
            data: questionsWithAnswers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalQuestions: total,
            },
        });
    } catch (error: any) {
        console.error("Erreur récupération questions par contexte :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de récupérer les questions." },
            { status: 500 }
        );
    }
}
