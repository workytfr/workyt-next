import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Quiz, { IQuestion } from "@/models/Quiz";
import QuizCompletion from "@/models/QuizCompletion";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isValidObjectId } from "mongoose";
import { hasPermission } from "@/lib/roles";

/**
 * GET /api/quizzes/[id]
 * 
 * Récupère un quiz avec ses détails complets
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const quiz = await Quiz.findById(id).lean();

        if (!quiz) {
            return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ quiz }, { status: 200 });
    } catch (error: any) {
        console.error("[GET /api/quizzes/[id]] Error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération du quiz" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/quizzes/[id]
 *
 * Soumet les réponses d'un quiz et retourne les résultats
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const quiz = await Quiz.findById(id).lean();
        if (!quiz) {
            return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
        }

        const body = await req.json();
        const { answers: userAnswers, timeSpent } = body;

        if (!Array.isArray(userAnswers)) {
            return NextResponse.json({ error: "Réponses invalides" }, { status: 400 });
        }

        // Grade each question
        const questions = quiz.questions as IQuestion[];
        let score = 0;
        const maxScore = questions.reduce((sum, q) => sum + (q.point || 0), 0);
        const detailedAnswers = questions.map((q, i) => {
            const userAnswer = userAnswers[i];
            const correct: any = q.correctAnswer;
            let isCorrect = false;

            switch (q.questionType) {
                case 'QCM':
                    if (q.answerSelectionType === 'multiple' && Array.isArray(correct)) {
                        isCorrect = Array.isArray(userAnswer) &&
                            correct.length === userAnswer.length &&
                            correct.every((c: any) => userAnswer.includes(Number(c)));
                    } else {
                        // Compare as numbers (index)
                        isCorrect = Number(userAnswer) === Number(correct);
                    }
                    break;

                case 'Vrai/Faux':
                    // Client sends "true"/"false" strings, DB stores "true"/"false" strings
                    isCorrect = String(userAnswer).toLowerCase() === String(correct).toLowerCase();
                    break;

                case 'Réponse courte':
                    isCorrect = typeof userAnswer === 'string' &&
                        String(userAnswer).trim().toLowerCase() === String(correct).trim().toLowerCase();
                    break;

                case 'Texte à trous':
                    if (Array.isArray(correct) && Array.isArray(userAnswer)) {
                        isCorrect = correct.length === userAnswer.length &&
                            correct.every((c: any, idx: number) =>
                                typeof userAnswer[idx] === 'string' &&
                                userAnswer[idx].trim().toLowerCase() === String(c).trim().toLowerCase()
                            );
                    } else if (typeof correct === 'string' && typeof userAnswer === 'string') {
                        isCorrect = userAnswer.trim().toLowerCase() === correct.trim().toLowerCase();
                    }
                    break;

                case 'Classement':
                    if (Array.isArray(correct) && Array.isArray(userAnswer)) {
                        isCorrect = correct.length === userAnswer.length &&
                            correct.every((c: any, idx: number) => Number(userAnswer[idx]) === Number(c));
                    }
                    break;

                case 'Glisser-déposer':
                    if (Array.isArray(correct) && Array.isArray(userAnswer)) {
                        isCorrect = correct.length === userAnswer.length &&
                            correct.every((c: any, idx: number) =>
                                typeof userAnswer[idx] === 'string' &&
                                userAnswer[idx].trim().toLowerCase() === String(c).trim().toLowerCase()
                            );
                    }
                    break;

                case 'Slider': {
                    const tolerance = parseFloat(q.answers[4] || '0');
                    const correctVal = typeof correct === 'number' ? correct : parseFloat(String(correct));
                    const userVal = typeof userAnswer === 'number' ? userAnswer : parseFloat(String(userAnswer));
                    isCorrect = Math.abs(userVal - correctVal) <= tolerance;
                    break;
                }

                case 'Code':
                    if (Array.isArray(correct) && Array.isArray(userAnswer)) {
                        isCorrect = correct.length === userAnswer.length &&
                            correct.every((c: any, idx: number) =>
                                typeof userAnswer[idx] === 'string' &&
                                userAnswer[idx].trim() === String(c).trim()
                            );
                    } else if (typeof correct === 'string' && typeof userAnswer === 'string') {
                        isCorrect = userAnswer.trim() === correct.trim();
                    }
                    break;
            }

            const pointsEarned = isCorrect ? (q.point || 0) : 0;
            score += pointsEarned;

            return {
                questionIndex: i,
                userAnswer,
                isCorrect,
                pointsEarned,
                correctAnswer: correct,
                explanation: q.explanation,
            };
        });

        // Apply time bonus/penalty
        let timeModifier = 0;
        let timeModifierLabel = '';

        if (quiz.timeBonus?.enabled && timeSpent && timeSpent <= quiz.timeBonus.targetTime) {
            timeModifier = quiz.timeBonus.bonusPercent / 100;
            timeModifierLabel = `+${quiz.timeBonus.bonusPercent}% bonus temps`;
        } else if (quiz.timePenalty?.enabled && timeSpent && timeSpent > quiz.timePenalty.maxTime) {
            const overMinutes = (timeSpent - quiz.timePenalty.maxTime) / 60;
            const penalty = Math.min(
                overMinutes * quiz.timePenalty.penaltyPercentPerMin,
                quiz.timePenalty.maxPenaltyPercent
            );
            timeModifier = -(penalty / 100);
            timeModifierLabel = `-${Math.round(penalty)}% malus temps`;
        }

        const adjustedScore = Math.max(0, Math.round(score * (1 + timeModifier)));
        const percentage = maxScore > 0 ? Math.round((adjustedScore / maxScore) * 100) : 0;

        // Save completion (upsert)
        try {
            await QuizCompletion.findOneAndUpdate(
                { userId: session.user.id, quizId: id },
                {
                    userId: session.user.id,
                    quizId: id,
                    courseId: quiz.sectionId ? undefined : undefined,
                    sectionId: quiz.sectionId,
                    score: adjustedScore,
                    maxScore,
                    answers: detailedAnswers.map(a => ({
                        questionIndex: a.questionIndex,
                        userAnswer: a.userAnswer,
                        isCorrect: a.isCorrect,
                        pointsEarned: a.pointsEarned,
                    })),
                    timeSpent,
                    completedAt: new Date(),
                },
                { upsert: true, new: true }
            );
        } catch (saveErr) {
            console.error("[POST /api/quizzes/[id]] Save completion error:", saveErr);
        }

        return NextResponse.json({
            score: adjustedScore,
            maxScore,
            percentage,
            answers: detailedAnswers,
            timeModifier,
            timeModifierLabel: timeModifierLabel || undefined,
        });
    } catch (error: any) {
        console.error("[POST /api/quizzes/[id]] Error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la soumission du quiz" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/quizzes/[id]
 * 
 * Met à jour un quiz (y compris les compétences)
 * Réservé aux admins et rédacteurs
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Check if user is admin or editor
        const userRole = session.user.role;
        if (!(await hasPermission(userRole, 'quiz.edit'))) {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const updates = await req.json();

        // Only allow certain fields to be updated
        const allowedFields = ["title", "description", "questions", "sectionId", "lessonId", "competencies", "timeBonus", "timePenalty"];
        const filteredUpdates: Record<string, any> = {};
        
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            return NextResponse.json({ error: "Aucune mise à jour valide" }, { status: 400 });
        }

        const quiz = await Quiz.findByIdAndUpdate(
            id,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        ).lean();

        if (!quiz) {
            return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ quiz }, { status: 200 });
    } catch (error: any) {
        console.error("[PATCH /api/quizzes/[id]] Error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du quiz" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/quizzes/[id]
 * 
 * Supprime un quiz
 * Réservé aux admins
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Check if user is admin
        if (session.user.role !== "Admin") {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const quiz = await Quiz.findByIdAndDelete(id).lean();

        if (!quiz) {
            return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 });
        }

        return NextResponse.json({ message: "Quiz supprimé avec succès" }, { status: 200 });
    } catch (error: any) {
        console.error("[DELETE /api/quizzes/[id]] Error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression du quiz" },
            { status: 500 }
        );
    }
}
