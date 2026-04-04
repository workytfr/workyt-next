import connectDB from '@/lib/mongodb';
import EvaluationDraw from '@/models/EvaluationDraw';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import EvaluationGrade from '@/models/EvaluationGrade';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import Course from '@/models/Course';
import { NotificationService } from '@/lib/notificationService';
import { notifyEvaluationDiscord } from '@/lib/discord/evaluationWebhook';

/**
 * Vérifie les tirages expirés et les passe en timeout avec note 0/20.
 * Appelé toutes les minutes par le cron dans instrumentation.ts.
 */
export async function checkEvaluationTimeouts(): Promise<{ processed: number; errors: number }> {
    await connectDB();

    const expiredDraws = await EvaluationDraw.find({
        status: { $in: ['drawn', 'in_progress'] },
        mustSubmitBefore: { $lte: new Date() },
    });

    let processed = 0;
    let errors = 0;

    for (const draw of expiredDraws) {
        try {
            // 1. Mettre à jour le statut du tirage
            draw.status = 'timeout';

            // 2. Récupérer l'évaluation pour le type
            const evaluation = await Evaluation.findById(draw.evaluationId).lean();
            const evalType = evaluation?.type || 'form';

            // 3. Créer une soumission vide (timeout)
            const submission = await EvaluationSubmission.create({
                drawId: draw._id,
                userId: draw.userId,
                courseId: draw.courseId,
                evaluationId: draw.evaluationId,
                type: evalType,
                answers: [],
                timeSpent: Math.floor((draw.mustSubmitBefore.getTime() - draw.drawnAt.getTime()) / 1000),
                submittedAt: draw.mustSubmitBefore,
                status: 'graded',
                grade: 0,
            });

            // 4. Créer la correction automatique 0/20
            await EvaluationGrade.create({
                submissionId: submission._id,
                evaluatorId: undefined,
                grade: 0,
                feedback: 'Non soumis dans le temps imparti. Note automatique : 0/20.',
                photoLinks: [],
                validatedCompetencies: [],
                invalidatedCompetencies: evaluation?.linkedCompetencies || [],
                isAutoGraded: true,
                gradedAt: new Date(),
            });

            // 5. Mettre à jour le tirage avec la soumission
            draw.submissionId = submission._id;
            await draw.save();

            // 6. Notifier l'élève
            try {
                const course = await Course.findById(draw.courseId).select('title').lean();
                const courseTitle = (course as any)?.title || 'Cours';

                await NotificationService.notifyEvaluationTimeout(
                    draw.userId.toString(),
                    courseTitle,
                    submission._id.toString()
                );

                // Discord
                const student = await User.findById(draw.userId).select('username').lean();
                await notifyEvaluationDiscord('timeout', {
                    studentName: student?.username || 'Inconnu',
                    courseTitle,
                    evaluationTitle: evaluation?.title || 'Évaluation',
                });
            } catch { /* notification failure shouldn't block */ }

            processed++;
        } catch (err) {
            console.error(`[EvalTimeout] Erreur draw ${draw._id}:`, err);
            errors++;
        }
    }

    return { processed, errors };
}
