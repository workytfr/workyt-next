import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import { getCurrentTrimester, getNextTrimester } from '@/lib/trimester';
import EvaluationDraw from '@/models/EvaluationDraw';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import EvaluationGrade from '@/models/EvaluationGrade';
import Evaluation from '@/models/Evaluation';
import CourseProgress from '@/models/CourseProgress';
import Section from '@/models/Section';

/**
 * GET /api/evaluations/status?courseId=xxx
 * Vérifie si l'élève peut tirer une évaluation pour un cours donné.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const courseId = new URL(req.url).searchParams.get('courseId');
        if (!courseId || !isValidObjectId(courseId)) {
            return NextResponse.json({ error: 'courseId invalide.' }, { status: 400 });
        }

        // 1. Vérifier le trimestre
        const now = new Date();
        const trimesterInfo = getCurrentTrimester(now);

        if (!trimesterInfo) {
            const next = getNextTrimester(now);
            return NextResponse.json({
                canDraw: false,
                reason: 'vacation_period',
                message: "Période de vacances — pas d'évaluation disponible.",
                nextAvailable: { trimester: next.trimester, name: next.name, startsAt: next.startDate },
            });
        }

        // 2. Vérifier la complétion du cours
        const [progress, totalSections] = await Promise.all([
            CourseProgress.findOne({ userId: user._id, courseId }).lean(),
            Section.countDocuments({ courseId }),
        ]);

        const courseCompleted = progress && totalSections > 0
            && progress.sectionsCompleted.length >= totalSections;

        if (!courseCompleted) {
            return NextResponse.json({
                canDraw: false,
                reason: 'course_not_completed',
                message: 'Vous devez terminer le cours avant de passer une évaluation.',
                currentTrimester: { number: trimesterInfo.trimester, name: trimesterInfo.name, schoolYear: trimesterInfo.schoolYear },
            });
        }

        // 3. Vérifier si un tirage existe ce trimestre
        const existingDraw = await EvaluationDraw.findOne({
            userId: user._id,
            courseId,
            trimester: trimesterInfo.trimester,
            schoolYear: trimesterInfo.schoolYear,
        }).lean();

        if (existingDraw) {
            const next = getNextTrimester(now);
            const result: any = {
                canDraw: false,
                reason: 'already_drawn',
                currentTrimester: { number: trimesterInfo.trimester, name: trimesterInfo.name, schoolYear: trimesterInfo.schoolYear },
                existingDraw: {
                    _id: existingDraw._id,
                    status: existingDraw.status,
                    drawnAt: existingDraw.drawnAt,
                    mustSubmitBefore: existingDraw.mustSubmitBefore,
                },
                nextAvailable: { trimester: next.trimester, name: next.name, startsAt: next.startDate },
            };

            // Si en cours, ajouter le temps restant
            if (existingDraw.status === 'drawn' || existingDraw.status === 'in_progress') {
                const remaining = existingDraw.mustSubmitBefore.getTime() - Date.now();
                if (remaining > 0) {
                    result.existingDraw.remainingMs = remaining;
                    result.message = 'Vous avez une évaluation en cours.';
                } else {
                    result.message = "Temps écoulé. L'évaluation sera automatiquement notée 0/20.";
                }
            }

            // Si soumis ou corrigé, ajouter la note
            if (existingDraw.status === 'submitted' || existingDraw.status === 'timeout') {
                const submission = await EvaluationSubmission.findOne({ drawId: existingDraw._id }).lean();
                if (submission) {
                    result.existingDraw.submissionId = submission._id;
                    result.existingDraw.grade = submission.grade;
                    result.existingDraw.submissionStatus = submission.status;

                    if (submission.status === 'graded') {
                        const grade = await EvaluationGrade.findOne({ submissionId: submission._id }).lean();
                        if (grade) {
                            result.existingDraw.grade = grade.grade;
                            result.existingDraw.feedback = grade.feedback;
                        }
                    }
                }

                result.message = existingDraw.status === 'timeout'
                    ? 'Temps dépassé — note automatique 0/20.'
                    : submission?.status === 'graded'
                        ? `Évaluation corrigée : ${result.existingDraw.grade}/20`
                        : 'Évaluation soumise, en attente de correction.';
            }

            return NextResponse.json(result);
        }

        // 4. Vérifier s'il y a des évaluations actives
        const activeCount = await Evaluation.countDocuments({ courseId, isActive: true });
        if (activeCount === 0) {
            return NextResponse.json({
                canDraw: false,
                reason: 'no_evaluations',
                message: "Aucune évaluation n'est encore disponible pour ce cours.",
                currentTrimester: { number: trimesterInfo.trimester, name: trimesterInfo.name, schoolYear: trimesterInfo.schoolYear },
            });
        }

        // 5. Tout est OK
        return NextResponse.json({
            canDraw: true,
            currentTrimester: { number: trimesterInfo.trimester, name: trimesterInfo.name, schoolYear: trimesterInfo.schoolYear },
            evaluationCount: activeCount,
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur vérification statut évaluation');
    }
}
