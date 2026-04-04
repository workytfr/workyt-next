import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import EvaluationDraw from '@/models/EvaluationDraw';
import Evaluation from '@/models/Evaluation';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import { notifyEvaluationDiscord } from '@/lib/discord/evaluationWebhook';
import User from '@/models/User';
import Course from '@/models/Course';

/**
 * POST /api/evaluations/draws/[drawId]/submit
 * Soumet les réponses d'une évaluation.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ drawId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const { drawId } = await params;
        const body = await req.json();

        // 1. Récupérer et vérifier le tirage
        const draw = await EvaluationDraw.findById(drawId);
        if (!draw) {
            return NextResponse.json({ error: 'Tirage non trouvé' }, { status: 404 });
        }

        if (draw.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
        }

        if (draw.status === 'submitted' || draw.status === 'timeout') {
            return NextResponse.json(
                { error: 'Cette évaluation a déjà été soumise ou le temps est écoulé.' },
                { status: 409 }
            );
        }

        // 2. Vérifier la deadline côté serveur
        if (Date.now() > draw.mustSubmitBefore.getTime()) {
            return NextResponse.json(
                { error: 'Le temps est écoulé. Note automatique : 0/20.', code: 'TIMEOUT' },
                { status: 403 }
            );
        }

        // 3. Récupérer l'évaluation
        const evaluation = await Evaluation.findById(draw.evaluationId);
        if (!evaluation) {
            return NextResponse.json({ error: 'Évaluation non trouvée' }, { status: 404 });
        }

        // 4. Valider les données selon le type
        // submittedFiles = URLs R2 des photos de copie (optionnel pour form, requis pour pdf)
        const submittedFiles: string[] = Array.isArray(body.submittedFiles)
            ? body.submittedFiles.filter((u: any) => typeof u === 'string' && u.startsWith('http')).slice(0, 10)
            : [];

        if (evaluation.type === 'form') {
            if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
                return NextResponse.json({ error: 'Réponses requises.' }, { status: 400 });
            }
            if (body.answers.length > 100) {
                return NextResponse.json({ error: 'Trop de réponses.' }, { status: 400 });
            }
            for (const ans of body.answers) {
                if (typeof ans.answer === 'string' && ans.answer.length > 10000) {
                    return NextResponse.json({ error: 'Réponse trop longue (max 10 000 caractères).' }, { status: 400 });
                }
            }
        } else if (evaluation.type === 'pdf') {
            if (submittedFiles.length === 0) {
                return NextResponse.json({ error: 'Veuillez joindre au moins une photo de votre copie.' }, { status: 400 });
            }
        }

        // 5. Calculer le temps passé
        const timeSpent = Math.floor((Date.now() - draw.drawnAt.getTime()) / 1000);

        // 6. Créer la soumission (catch duplicate key si double-submit)
        let submission;
        try {
            submission = await EvaluationSubmission.create({
                drawId: draw._id,
                userId: user._id,
                courseId: draw.courseId,
                evaluationId: draw.evaluationId,
                type: evaluation.type,
                answers: evaluation.type === 'form' ? body.answers : undefined,
                submittedFiles: submittedFiles.length > 0 ? submittedFiles : undefined,
                timeSpent,
                submittedAt: new Date(),
                status: 'pending_review',
            });
        } catch (err: any) {
            if (err.code === 11000) {
                return NextResponse.json({ error: 'Évaluation déjà soumise.' }, { status: 409 });
            }
            throw err;
        }

        // 7. Mettre à jour le tirage
        draw.status = 'submitted';
        draw.submissionId = submission._id;
        await draw.save();

        // 8. Discord webhook (fire & forget)
        try {
            const [student, course] = await Promise.all([
                User.findById(user._id).select('username').lean(),
                Course.findById(draw.courseId).select('title').lean(),
            ]);
            notifyEvaluationDiscord('submission', {
                studentName: student?.username || 'Inconnu',
                courseTitle: (course as any)?.title || 'Inconnu',
                evaluationTitle: evaluation.title,
                evaluationType: evaluation.type,
                timeSpentMin: Math.round(timeSpent / 60),
                submissionId: submission._id.toString(),
                submittedFiles: submittedFiles,
            }).catch(() => {});
        } catch { /* ignore */ }

        return NextResponse.json({
            success: true,
            submission: {
                _id: submission._id,
                status: submission.status,
                submittedAt: submission.submittedAt,
                timeSpent,
            },
        }, { status: 201 });
    } catch (error: any) {
        return handleApiError(error, 'Erreur soumission évaluation');
    }
}
