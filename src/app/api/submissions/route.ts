import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import { hasPermission } from '@/lib/roles';

/**
 * GET /api/submissions
 * Liste des soumissions d'évaluations (pour helpers/correcteurs).
 * Query params: status, courseId, page, limit
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.grade'))) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const courseId = searchParams.get('courseId');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;
        if (courseId) filter.courseId = courseId;

        const [submissions, total] = await Promise.all([
            EvaluationSubmission.find(filter)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username image')
                .populate('courseId', 'title')
                .populate('evaluationId', 'title type duration')
                .lean(),
            EvaluationSubmission.countDocuments(filter),
        ]);

        return NextResponse.json({
            submissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur liste soumissions');
    }
}
