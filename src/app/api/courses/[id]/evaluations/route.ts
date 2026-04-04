import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { optionalAuthMiddleware } from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import { getCurrentTrimester, getNextTrimester } from '@/lib/trimester';
import Evaluation from '@/models/Evaluation';
import EvaluationDraw from '@/models/EvaluationDraw';

/**
 * GET /api/courses/[id]/evaluations
 * Informations publiques sur les évaluations d'un cours.
 * Si l'utilisateur est connecté, ajoute son status trimestre.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await optionalAuthMiddleware(req);
        await connectDB();

        const { id: courseId } = await params;

        const activeCount = await Evaluation.countDocuments({ courseId, isActive: true });

        const result: any = {
            courseId,
            evaluationCount: activeCount,
            hasEvaluations: activeCount > 0,
        };

        // Ajouter le trimestre courant
        const now = new Date();
        const trimester = getCurrentTrimester(now);
        if (trimester) {
            result.currentTrimester = {
                number: trimester.trimester,
                name: trimester.name,
                schoolYear: trimester.schoolYear,
            };
        } else {
            result.currentTrimester = null;
            result.isVacation = true;
        }

        // Si connecté, vérifier le status de l'utilisateur
        if (user && trimester) {
            const existingDraw = await EvaluationDraw.findOne({
                userId: user._id,
                courseId,
                trimester: trimester.trimester,
                schoolYear: trimester.schoolYear,
            }).lean();

            if (existingDraw) {
                result.userStatus = {
                    hasDraw: true,
                    drawId: existingDraw._id,
                    drawStatus: existingDraw.status,
                    mustSubmitBefore: existingDraw.mustSubmitBefore,
                };
            } else {
                result.userStatus = { hasDraw: false };
            }
        }

        // Prochain trimestre
        const next = getNextTrimester(now);
        result.nextTrimester = {
            number: next.trimester,
            name: next.name,
            startsAt: next.startDate,
        };

        return NextResponse.json(result);
    } catch (error: any) {
        return handleApiError(error, 'Erreur évaluations du cours');
    }
}
