import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import EvaluationDraw from '@/models/EvaluationDraw';
import Evaluation from '@/models/Evaluation';

/**
 * GET /api/evaluations/draws/[drawId]
 * Récupère les détails d'un tirage (pour la page de passage d'évaluation).
 * Seul le propriétaire du tirage peut y accéder.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ drawId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const { drawId } = await params;
        if (!isValidObjectId(drawId)) {
            return NextResponse.json({ error: 'ID invalide.' }, { status: 400 });
        }

        const draw = await EvaluationDraw.findById(drawId).lean();
        if (!draw) {
            return NextResponse.json({ error: 'Tirage non trouvé' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (draw.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
        }

        // Récupérer l'évaluation
        const evaluation = await Evaluation.findById(draw.evaluationId).lean();
        if (!evaluation) {
            return NextResponse.json({ error: 'Évaluation non trouvée' }, { status: 404 });
        }

        const now = Date.now();
        const remaining = draw.mustSubmitBefore.getTime() - now;

        return NextResponse.json({
            draw: {
                _id: draw._id,
                status: draw.status,
                drawnAt: draw.drawnAt,
                mustSubmitBefore: draw.mustSubmitBefore,
                remainingMs: Math.max(0, remaining),
                isExpired: remaining <= 0,
                trimester: draw.trimester,
                schoolYear: draw.schoolYear,
            },
            evaluation: {
                _id: evaluation._id,
                title: evaluation.title,
                description: evaluation.description,
                type: evaluation.type,
                duration: evaluation.duration,
                // Ne renvoyer les questions/pdfUrl que si le tirage est encore actif
                questions: (draw.status === 'drawn' || draw.status === 'in_progress') && evaluation.type === 'form'
                    ? evaluation.questions?.map((q: any) => ({
                        questionText: q.questionText,
                        questionType: q.questionType,
                        options: q.options,
                        points: q.points,
                        order: q.order,
                        // correctAnswer volontairement exclu
                    }))
                    : undefined,
                pdfUrl: (draw.status === 'drawn' || draw.status === 'in_progress') && evaluation.type === 'pdf'
                    ? evaluation.pdfUrl
                    : undefined,
                linkedCompetencies: evaluation.linkedCompetencies,
            },
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur récupération tirage');
    }
}
