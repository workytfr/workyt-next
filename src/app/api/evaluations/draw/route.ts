import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import { getCurrentTrimester } from '@/lib/trimester';
import Evaluation from '@/models/Evaluation';
import EvaluationDraw from '@/models/EvaluationDraw';
import CourseProgress from '@/models/CourseProgress';
import Section from '@/models/Section';

/**
 * POST /api/evaluations/draw
 * Tire aléatoirement une évaluation pour un cours.
 * Crée un EvaluationDraw avec deadline = now + duration.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const { courseId } = await req.json();
        if (!courseId || !isValidObjectId(courseId)) {
            return NextResponse.json({ error: 'courseId invalide.' }, { status: 400 });
        }

        // 1. Vérifier le trimestre
        const trimesterInfo = getCurrentTrimester();
        if (!trimesterInfo) {
            return NextResponse.json(
                { error: "Période de vacances — pas d'évaluation disponible." },
                { status: 403 }
            );
        }

        // 2. Vérifier la complétion du cours
        const [progress, totalSections] = await Promise.all([
            CourseProgress.findOne({ userId: user._id, courseId }).lean(),
            Section.countDocuments({ courseId }),
        ]);

        if (!progress || totalSections === 0 || progress.sectionsCompleted.length < totalSections) {
            return NextResponse.json(
                { error: 'Vous devez terminer le cours avant de passer une évaluation.' },
                { status: 403 }
            );
        }

        // 3. Vérifier si un tirage en cours existe (retourner le tirage existant)
        const existingDraw = await EvaluationDraw.findOne({
            userId: user._id,
            courseId,
            trimester: trimesterInfo.trimester,
            schoolYear: trimesterInfo.schoolYear,
        }).populate('evaluationId');

        if (existingDraw) {
            // Si le tirage est encore en cours et pas expiré, le retourner
            if ((existingDraw.status === 'drawn' || existingDraw.status === 'in_progress')
                && existingDraw.mustSubmitBefore.getTime() > Date.now()) {
                const evaluation = existingDraw.evaluationId as any;
                return NextResponse.json({
                    success: true,
                    existing: true,
                    message: 'Vous avez déjà un tirage en cours.',
                    draw: {
                        _id: existingDraw._id,
                        mustSubmitBefore: existingDraw.mustSubmitBefore,
                        status: existingDraw.status,
                    },
                    evaluation: {
                        _id: evaluation._id,
                        title: evaluation.title,
                        type: evaluation.type,
                        duration: evaluation.duration,
                        questions: evaluation.type === 'form' ? evaluation.questions?.map((q: any) => ({
                            questionText: q.questionText,
                            questionType: q.questionType,
                            options: q.options,
                            points: q.points,
                            order: q.order,
                        })) : undefined,
                        pdfUrl: evaluation.type === 'pdf' ? evaluation.pdfUrl : undefined,
                    },
                });
            }

            // Déjà soumis ou timeout
            return NextResponse.json(
                { error: 'Vous avez déjà passé une évaluation ce trimestre.', code: 'ALREADY_DRAWN' },
                { status: 409 }
            );
        }

        // 4. Récupérer les évaluations actives
        const evaluations = await Evaluation.find({ courseId, isActive: true });
        if (evaluations.length === 0) {
            return NextResponse.json(
                { error: "Aucune évaluation disponible pour ce cours." },
                { status: 404 }
            );
        }

        // 5. Tirage aléatoire
        const selected = evaluations[Math.floor(Math.random() * evaluations.length)];

        // 6. Créer le tirage
        const now = new Date();
        const deadline = new Date(now.getTime() + selected.duration * 60 * 1000);

        let draw;
        try {
            draw = await EvaluationDraw.create({
                userId: user._id,
                courseId,
                evaluationId: selected._id,
                trimester: trimesterInfo.trimester,
                schoolYear: trimesterInfo.schoolYear,
                drawnAt: now,
                mustSubmitBefore: deadline,
                status: 'drawn',
            });
        } catch (err: any) {
            // Duplicate key = race condition, déjà tiré ce trimestre
            if (err.code === 11000) {
                return NextResponse.json(
                    { error: 'Vous avez déjà tiré une évaluation ce trimestre.', code: 'ALREADY_DRAWN' },
                    { status: 409 }
                );
            }
            throw err;
        }

        return NextResponse.json({
            success: true,
            existing: false,
            draw: {
                _id: draw._id,
                mustSubmitBefore: draw.mustSubmitBefore,
                status: draw.status,
            },
            evaluation: {
                _id: selected._id,
                title: selected.title,
                type: selected.type,
                duration: selected.duration,
                questions: selected.type === 'form' ? selected.questions?.map((q: any) => ({
                    questionText: q.questionText,
                    questionType: q.questionType,
                    options: q.options,
                    points: q.points,
                    order: q.order,
                })) : undefined,
                pdfUrl: selected.type === 'pdf' ? selected.pdfUrl : undefined,
            },
        }, { status: 201 });
    } catch (error: any) {
        return handleApiError(error, 'Erreur tirage évaluation');
    }
}
