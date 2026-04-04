import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import EvaluationGrade from '@/models/EvaluationGrade';
import EvaluationDraw from '@/models/EvaluationDraw';
import { hasPermission } from '@/lib/roles';

/**
 * GET /api/submissions/[submissionId]
 * Détail d'une soumission (pour correction ou consultation par l'élève).
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const { submissionId } = await params;

        const submission = await EvaluationSubmission.findById(submissionId)
            .populate('userId', 'username image email')
            .populate('courseId', 'title')
            .populate('evaluationId', 'title type duration questions pdfUrl linkedCompetencies')
            .lean();

        if (!submission) {
            return NextResponse.json({ error: 'Soumission non trouvée' }, { status: 404 });
        }

        // Vérifier les permissions : helper ou propriétaire
        const isOwner = (submission.userId as any)._id.toString() === user._id.toString();
        const isHelper = await hasPermission(user.role, 'evaluation.grade');

        if (!isOwner && !isHelper) {
            return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
        }

        // Récupérer la correction si elle existe
        const grade = await EvaluationGrade.findOne({ submissionId })
            .populate('evaluatorId', 'username')
            .lean();

        // Récupérer le tirage
        const draw = await EvaluationDraw.findById(submission.drawId).lean();

        return NextResponse.json({
            submission,
            grade: grade || null,
            draw: draw ? {
                trimester: draw.trimester,
                schoolYear: draw.schoolYear,
                drawnAt: draw.drawnAt,
                mustSubmitBefore: draw.mustSubmitBefore,
            } : null,
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur détail soumission');
    }
}
