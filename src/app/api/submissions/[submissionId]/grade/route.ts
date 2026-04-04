import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import { handleApiError } from '@/utils/apiErrorResponse';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import EvaluationGrade from '@/models/EvaluationGrade';
import EvaluationDraw from '@/models/EvaluationDraw';
import Evaluation from '@/models/Evaluation';
import CompetencyProgress from '@/models/CompetencyProgress';
import CurriculumNode from '@/models/CurriculumNode';
import Course from '@/models/Course';
import User from '@/models/User';
import { NotificationService } from '@/lib/notificationService';
import { notifyEvaluationDiscord } from '@/lib/discord/evaluationWebhook';
import { addPointsWithBoost } from '@/lib/pointsService';
import { hasPermission } from '@/lib/roles';

/**
 * POST /api/submissions/[submissionId]/grade
 * Corriger une soumission d'évaluation.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        if (!(await hasPermission(user.role, 'evaluation.grade'))) {
            return NextResponse.json({ error: 'Permission refusée.' }, { status: 403 });
        }

        const { submissionId } = await params;
        const body = await req.json();

        const { grade, feedback, photoLinks, validatedCompetencies, invalidatedCompetencies } = body;

        // Validation
        if (typeof grade !== 'number' || grade < 0 || grade > 20) {
            return NextResponse.json({ error: 'Note invalide (0-20).' }, { status: 400 });
        }

        if (feedback && typeof feedback === 'string' && feedback.length > 5000) {
            return NextResponse.json({ error: 'Feedback trop long (max 5000 caractères).' }, { status: 400 });
        }

        // Sanitize photoLinks : n'accepter que http/https
        const sanitizedPhotoLinks = (photoLinks || []).filter((link: any) => {
            if (typeof link !== 'string') return false;
            try { const u = new URL(link); return u.protocol === 'http:' || u.protocol === 'https:'; }
            catch { return false; }
        }).slice(0, 10);

        // Récupérer la soumission
        const submission = await EvaluationSubmission.findById(submissionId);
        if (!submission) {
            return NextResponse.json({ error: 'Soumission non trouvée.' }, { status: 404 });
        }

        if (submission.status === 'graded') {
            return NextResponse.json({ error: 'Déjà corrigée.' }, { status: 409 });
        }

        // Créer la notation (catch duplicate key pour race condition entre correcteurs)
        let evaluationGrade;
        try {
            evaluationGrade = await EvaluationGrade.create({
                submissionId,
                evaluatorId: user._id,
                grade,
                feedback: feedback || '',
                photoLinks: sanitizedPhotoLinks,
                validatedCompetencies: validatedCompetencies || [],
                invalidatedCompetencies: invalidatedCompetencies || [],
                isAutoGraded: false,
                gradedAt: new Date(),
            });
        } catch (err: any) {
            if (err.code === 11000) {
                return NextResponse.json({ error: 'Cette soumission a déjà été corrigée.' }, { status: 409 });
            }
            throw err;
        }

        // Mettre à jour la soumission
        submission.status = 'graded';
        submission.grade = grade;
        await submission.save();

        // Mettre à jour le tirage
        await EvaluationDraw.findByIdAndUpdate(submission.drawId, { status: 'submitted' });

        // Mettre à jour les compétences de l'élève
        if (validatedCompetencies?.length || invalidatedCompetencies?.length) {
            await updateCompetencyProgress(
                submission.userId.toString(),
                validatedCompetencies || [],
                invalidatedCompetencies || [],
                submission.evaluationId.toString()
            );
        }

        // Attribuer des points proportionnels à la note (ex: 15/20 avec 100 rewardPoints = 75 pts)
        if (grade > 0) {
            const evaluation = await Evaluation.findById(submission.evaluationId).select('rewardPoints').lean();
            const maxPoints = (evaluation as any)?.rewardPoints ?? 100;
            const earnedPoints = Math.round((grade / 20) * maxPoints);
            if (earnedPoints > 0) {
                await addPointsWithBoost(
                    submission.userId.toString(),
                    earnedPoints,
                    'completeEvaluation'
                );
            }
        }

        // Notifications (fire & forget)
        try {
            const course = await Course.findById(submission.courseId).select('title').lean();
            const courseTitle = (course as any)?.title || 'Cours';

            await NotificationService.notifyEvaluationGraded(
                submission.userId.toString(),
                user._id.toString(),
                grade,
                courseTitle,
                submissionId
            );

            const student = await User.findById(submission.userId).select('username').lean();
            await notifyEvaluationDiscord('graded', {
                studentName: student?.username || 'Inconnu',
                courseTitle,
                evaluationTitle: 'Évaluation',
                grade,
                evaluatorName: user.username || 'Correcteur',
                photoLinks: sanitizedPhotoLinks,
            });
        } catch { /* ignore */ }

        return NextResponse.json({
            success: true,
            grade: evaluationGrade,
        });
    } catch (error: any) {
        return handleApiError(error, 'Erreur correction évaluation');
    }
}

/**
 * Met à jour le CompetencyProgress pour les compétences validées/invalidées.
 */
async function updateCompetencyProgress(
    userId: string,
    validated: string[],
    invalidated: string[],
    evaluationId: string
) {
    // Traiter les compétences validées (score = 100)
    for (const skillId of validated) {
        const node = await CurriculumNode.findOne({ 'skills.skillId': skillId }).lean();
        if (!node) continue;

        await CompetencyProgress.findOneAndUpdate(
            { userId, skillId },
            {
                $push: {
                    attempts: {
                        date: new Date(),
                        score: 100,
                        source: 'evaluation',
                        sourceId: evaluationId,
                    },
                },
                $set: { updatedAt: new Date() },
                $setOnInsert: {
                    curriculumNodeId: node._id,
                    skillId,
                    userId,
                    bestScore: 0,
                    lastScore: 0,
                    revisionCount: 0,
                    srsLevel: 0,
                    status: 'not_started',
                    createdAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );
    }

    // Traiter les compétences invalidées (score = 0)
    for (const skillId of invalidated) {
        const node = await CurriculumNode.findOne({ 'skills.skillId': skillId }).lean();
        if (!node) continue;

        await CompetencyProgress.findOneAndUpdate(
            { userId, skillId },
            {
                $push: {
                    attempts: {
                        date: new Date(),
                        score: 0,
                        source: 'evaluation',
                        sourceId: evaluationId,
                    },
                },
                $set: { updatedAt: new Date() },
                $setOnInsert: {
                    curriculumNodeId: node._id,
                    skillId,
                    userId,
                    bestScore: 0,
                    lastScore: 0,
                    revisionCount: 0,
                    srsLevel: 0,
                    status: 'not_started',
                    createdAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );
    }
}
