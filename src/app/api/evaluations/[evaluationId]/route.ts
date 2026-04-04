import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import Evaluation from '@/models/Evaluation';
import { hasPermission } from '@/lib/roles';

/**
 * GET /api/evaluations/[evaluationId]
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ evaluationId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.create'))) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const { evaluationId } = await params;
        const evaluation = await Evaluation.findById(evaluationId)
            .populate('courseId', 'title')
            .populate('createdBy', 'username')
            .lean();

        if (!evaluation) {
            return NextResponse.json({ error: 'Évaluation non trouvée.' }, { status: 404 });
        }

        return NextResponse.json({ evaluation });
    } catch (error: any) {
        return handleApiError(error, 'Erreur récupération évaluation');
    }
}

/**
 * PUT /api/evaluations/[evaluationId]
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ evaluationId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.create'))) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const { evaluationId } = await params;
        const evaluation = await Evaluation.findById(evaluationId);
        if (!evaluation) {
            return NextResponse.json({ error: 'Évaluation non trouvée.' }, { status: 404 });
        }

        // Seul le créateur ou un admin peut modifier
        if (evaluation.createdBy.toString() !== user._id.toString() && user.role !== 'Admin') {
            return NextResponse.json({ error: 'Seul le créateur peut modifier.' }, { status: 403 });
        }

        const body = await req.json();
        const allowedFields = ['title', 'description', 'type', 'duration', 'pdfUrl', 'questions', 'rewardPoints', 'linkedCompetencies', 'isActive'];

        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                (evaluation as any)[key] = body[key];
            }
        }

        await evaluation.save();

        return NextResponse.json({ evaluation });
    } catch (error: any) {
        return handleApiError(error, 'Erreur modification évaluation');
    }
}

/**
 * DELETE /api/evaluations/[evaluationId]
 * Soft-delete : désactive l'évaluation (isActive = false).
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ evaluationId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.delete'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const { evaluationId } = await params;
        const evaluation = await Evaluation.findByIdAndUpdate(
            evaluationId,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );

        if (!evaluation) {
            return NextResponse.json({ error: 'Évaluation non trouvée.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Évaluation désactivée.', evaluation });
    } catch (error: any) {
        return handleApiError(error, 'Erreur suppression évaluation');
    }
}
