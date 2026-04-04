import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import Evaluation from '@/models/Evaluation';
import { hasPermission } from '@/lib/roles';

/**
 * GET /api/evaluations
 * Liste des évaluations (filtrable par courseId).
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.create'))) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const isActive = searchParams.get('isActive');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (courseId) filter.courseId = courseId;
        if (isActive !== null && isActive !== undefined) filter.isActive = isActive === 'true';

        const [evaluations, total] = await Promise.all([
            Evaluation.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('courseId', 'title')
                .populate('createdBy', 'username')
                .lean(),
            Evaluation.countDocuments(filter),
        ]);

        return NextResponse.json({
            evaluations,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur liste évaluations');
    }
}

/**
 * POST /api/evaluations
 * Créer une évaluation (Rédacteur/Admin). Max 50 actives par cours.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.create'))) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const body = await req.json();
        const { courseId, title, description, type, duration, pdfUrl, questions, linkedCompetencies, rewardPoints } = body;

        // Validation de base
        if (!courseId || !title || !type || !duration) {
            return NextResponse.json(
                { error: 'Champs requis : courseId, title, type, duration.' },
                { status: 400 }
            );
        }

        if (!['form', 'pdf'].includes(type)) {
            return NextResponse.json({ error: "Type invalide (form ou pdf)." }, { status: 400 });
        }

        if (type === 'pdf' && !pdfUrl) {
            return NextResponse.json({ error: 'pdfUrl requis pour le type pdf.' }, { status: 400 });
        }

        if (type === 'form' && (!questions || !Array.isArray(questions) || questions.length === 0)) {
            return NextResponse.json({ error: 'Au moins une question requise pour le type form.' }, { status: 400 });
        }

        // Vérifier la limite de 50 évaluations actives par cours
        const activeCount = await Evaluation.countDocuments({ courseId, isActive: true });
        if (activeCount >= 50) {
            return NextResponse.json(
                { error: 'Maximum 50 évaluations actives par cours.' },
                { status: 400 }
            );
        }

        const evaluation = await Evaluation.create({
            courseId,
            title,
            description: description || '',
            type,
            duration,
            pdfUrl: type === 'pdf' ? pdfUrl : undefined,
            questions: type === 'form' ? questions : undefined,
            rewardPoints: typeof rewardPoints === 'number' ? Math.min(500, Math.max(0, rewardPoints)) : 100,
            linkedCompetencies: linkedCompetencies || [],
            isActive: true,
            createdBy: user._id,
        });

        return NextResponse.json({ evaluation }, { status: 201 });
    } catch (error: any) {
        return handleApiError(error, 'Erreur création évaluation');
    }
}
