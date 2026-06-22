import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import EvaluationDraw from "@/models/EvaluationDraw";
import Evaluation from "@/models/Evaluation";

/**
 * GET /api/evaluations/active
 * Renvoie l'évaluation chronométrée en cours de l'élève (s'il y en a une),
 * pour l'afficher dans la navbar et permettre de la reprendre depuis n'importe où.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const now = new Date();
        const draw: any = await EvaluationDraw.findOne({
            userId: user._id,
            status: { $in: ["drawn", "in_progress"] },
            mustSubmitBefore: { $gt: now },
        })
            .sort({ mustSubmitBefore: 1 })
            .lean();

        if (!draw) return NextResponse.json({ active: null });

        const evaluation: any = await Evaluation.findById(draw.evaluationId).select("title").lean();

        return NextResponse.json({
            active: {
                drawId: draw._id.toString(),
                remainingMs: Math.max(0, new Date(draw.mustSubmitBefore).getTime() - now.getTime()),
                title: evaluation?.title || "Évaluation",
            },
        });
    } catch {
        // Non authentifié / pas de token → aucune éval active
        return NextResponse.json({ active: null });
    }
}
