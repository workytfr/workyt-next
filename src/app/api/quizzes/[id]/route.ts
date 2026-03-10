import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Quiz from '@/models/Quiz';
import QuizCompletion from '@/models/QuizCompletion';
import User from '@/models/User';
import PointTransaction from '@/models/PointTransaction';
import connectDB from '@/lib/mongodb';
import { BadgeService } from '@/lib/badgeService';

// Normalise une chaîne pour comparaison tolérante :
// supprime accents, ponctuation, espaces multiples, puis lowercase + trim
function normalizeForComparison(str: string): string {
    return str
        .normalize('NFD')                          // décompose les accents (é → e + ́)
        .replace(/[\u0300-\u036f]/g, '')           // supprime les diacritiques
        .replace(/[''`]/g, '')                     // supprime apostrophes typographiques
        .replace(/[^\w\s]/g, '')                   // supprime toute ponctuation restante
        .replace(/\s+/g, ' ')                      // normalise les espaces multiples
        .toLowerCase()
        .trim();
}

// GET - Récupérer un quiz spécifique (sans les bonnes réponses pour les utilisateurs)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const resolvedParams = await params;
        const quiz = await Quiz.findById(resolvedParams.id).populate('sectionId', 'title courseId');
        
        if (!quiz) {
            return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
        }

        // Retourner le quiz sans les bonnes réponses pour les utilisateurs
        const quizForUser = {
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            sectionId: quiz.sectionId,
            timeBonus: quiz.timeBonus?.enabled ? quiz.timeBonus : undefined,
            timePenalty: quiz.timePenalty?.enabled ? quiz.timePenalty : undefined,
            questions: quiz.questions.map((q: any) => ({
                question: q.question,
                questionType: q.questionType,
                questionPic: q.questionPic || null,
                answerSelectionType: q.answerSelectionType || 'single',
                answers: q.answers,
                point: q.point,
                explanation: q.explanation || null
                // On ne retourne pas correctAnswer pour les utilisateurs
            }))
        };

        return NextResponse.json(quizForUser);
    } catch (error) {
        console.error('Erreur lors de la récupération du quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// PUT - Modifier un quiz existant
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const resolvedParams = await params;
        const body = await request.json();

        // Validation des données
        if (!body.title || !body.questions || body.questions.length === 0) {
            return NextResponse.json(
                { error: 'Titre et questions sont requis' },
                { status: 400 }
            );
        }

        // Validation des questions
        for (const question of body.questions) {
            if (!question.question || !question.questionType || !question.point) {
                return NextResponse.json(
                    { error: 'Chaque question doit avoir un texte, un type et des points' },
                    { status: 400 }
                );
            }

            if (question.questionType === 'QCM' && (!question.answers || question.answers.length < 2)) {
                return NextResponse.json(
                    { error: 'Les questions QCM doivent avoir au moins 2 réponses' },
                    { status: 400 }
                );
            }

            if (question.questionType === 'QCM' && (question.correctAnswer === undefined || question.correctAnswer === null)) {
                return NextResponse.json(
                    { error: 'Les questions QCM doivent avoir une bonne réponse' },
                    { status: 400 }
                );
            }
            
            if (question.questionType === 'QCM' && (question.correctAnswer < 0 || question.correctAnswer >= question.answers.length)) {
                return NextResponse.json(
                    { error: 'Index de réponse correcte invalide pour une question QCM' },
                    { status: 400 }
                );
            }
            
            // Ajouter answerSelectionType si manquant pour les QCM
            if (question.questionType === 'QCM' && !question.answerSelectionType) {
                question.answerSelectionType = 'single';
            }
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            resolvedParams.id,
            {
                title: body.title,
                description: body.description || '',
                questions: body.questions,
                sectionId: body.sectionId,
                lessonId: body.lessonId,
                timeBonus: body.timeBonus || { enabled: false },
                timePenalty: body.timePenalty || { enabled: false }
            },
            { new: true }
        ).populate('sectionId', 'title courseId');

        if (!updatedQuiz) {
            return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
        }

        return NextResponse.json(updatedQuiz);
    } catch (error) {
        console.error('Erreur lors de la modification du quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// POST - Soumettre les réponses d'un quiz
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const resolvedParams = await params;
        const { answers, timeSpent } = await request.json();

        // Récupérer l'utilisateur
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Récupérer le quiz
        const quiz = await Quiz.findById(resolvedParams.id).populate('sectionId', 'title courseId');
        if (!quiz) {
            return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur a déjà complété ce quiz
        const existingCompletion = await QuizCompletion.findOne({
            userId: user._id,
            quizId: quiz._id
        });

        if (existingCompletion) {
            return NextResponse.json({ error: 'Vous avez déjà complété ce quiz' }, { status: 400 });
        }

        // Évaluer les réponses
        let totalScore = 0;
        let maxScore = 0;
        const evaluatedAnswers = [];

        for (let i = 0; i < quiz.questions.length; i++) {
            const question = quiz.questions[i];
            const userAnswer = answers[i];
            let isCorrect = false;
            let pointsEarned = 0;

            maxScore += question.point;

            switch (question.questionType) {
                case 'QCM':
                    // Convertir en nombres pour la comparaison
                    const userAnswerNum = parseInt(String(userAnswer));
                    const correctAnswerNum = parseInt(String(question.correctAnswer));
                    isCorrect = userAnswerNum === correctAnswerNum;
                    break;
                    
                case 'Vrai/Faux':
                    // Normaliser les réponses
                    const userAnswerVf = String(userAnswer).toLowerCase();
                    const correctAnswerVf = String(question.correctAnswer).toLowerCase();
                    const userAnswerBool = userAnswerVf === 'true' || userAnswerVf === '1';
                    const correctAnswerBool = correctAnswerVf === 'true' || correctAnswerVf === '1';
                    isCorrect = userAnswerBool === correctAnswerBool;
                    break;
                    
                case 'Réponse courte':
                    const userAnswerNorm = normalizeForComparison(String(userAnswer || ''));
                    // Support array of accepted answers (alternatives)
                    const acceptedAnswers = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.map((a: any) => normalizeForComparison(String(a || '')))
                        : [normalizeForComparison(String(question.correctAnswer || ''))];
                    isCorrect = acceptedAnswers.some((accepted: string) => accepted === userAnswerNorm);
                    break;
                    
                case 'Texte à trous':
                    const correctBlanks = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.map((c: any) => String(c).trim().toLowerCase())
                        : [String(question.correctAnswer || '').trim().toLowerCase()];
                    const userBlanks = Array.isArray(userAnswer)
                        ? userAnswer.map((c: any) => String(c).trim().toLowerCase())
                        : [String(userAnswer || '').trim().toLowerCase()];
                    isCorrect = correctBlanks.length === userBlanks.length &&
                               correctBlanks.every((val: string, idx: number) => val === userBlanks[idx]);
                    break;

                case 'Classement':
                    // correctAnswer = correct order as array of indices [0,1,2,...]
                    // userAnswer = user's ordering as array of indices
                    const correctOrder = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                    const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
                    isCorrect = correctOrder.length === userOrder.length &&
                               correctOrder.every((val: any, idx: number) => String(val) === String(userOrder[idx]));
                    break;

                case 'Glisser-déposer':
                    // correctAnswer = array of right-side strings matching each left item
                    // userAnswer = array of user-selected right-side strings
                    const correctPairs = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                    const userPairs = Array.isArray(userAnswer) ? userAnswer : [];
                    isCorrect = correctPairs.length === userPairs.length &&
                               correctPairs.every((val: any, idx: number) =>
                                   String(val).toLowerCase().trim() === String(userPairs[idx] || '').toLowerCase().trim()
                               );
                    break;

                case 'Slider':
                    // correctAnswer = target number, answers[4] = tolerance (optional)
                    const targetValue = parseFloat(String(question.correctAnswer));
                    const userValue = parseFloat(String(userAnswer));
                    const tolerance = question.answers[4] ? parseFloat(question.answers[4]) : 0;
                    isCorrect = !isNaN(targetValue) && !isNaN(userValue) && Math.abs(userValue - targetValue) <= tolerance;
                    break;

                case 'Code':
                    // correctAnswer = expected code string(s)
                    const correctCode = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.map((c: any) => String(c).trim())
                        : [String(question.correctAnswer || '').trim()];
                    const userCode = Array.isArray(userAnswer)
                        ? userAnswer.map((c: any) => String(c).trim())
                        : [String(userAnswer || '').trim()];
                    isCorrect = correctCode.length === userCode.length &&
                               correctCode.every((val: string, idx: number) => val === userCode[idx]);
                    break;

                default:
                    isCorrect = false;
            }

            pointsEarned = isCorrect ? question.point : 0;
            totalScore += pointsEarned;

            evaluatedAnswers.push({
                questionIndex: i,
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                pointsEarned: pointsEarned,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || null
            });
        }

        // Appliquer le bonus/malus temps
        let timeModifier = 0; // en pourcentage (+15 ou -10)
        let timeModifierLabel = '';

        const tb = quiz.timeBonus;
        const tp = quiz.timePenalty;

        if (tb?.enabled && tb.targetTime > 0 && tb.bonusPercent > 0) {
            if (timeSpent <= tb.targetTime) {
                timeModifier = tb.bonusPercent;
                timeModifierLabel = `Bonus temps +${tb.bonusPercent}%`;
            }
        }

        if (tp?.enabled && tp.maxTime > 0 && tp.penaltyPercentPerMin > 0) {
            if (timeSpent > tp.maxTime) {
                const overtimeMinutes = (timeSpent - tp.maxTime) / 60;
                const penalty = Math.min(
                    overtimeMinutes * tp.penaltyPercentPerMin,
                    tp.maxPenaltyPercent || 50
                );
                timeModifier -= penalty;
                timeModifierLabel = timeModifierLabel
                    ? `${timeModifierLabel}, Malus temps -${Math.round(penalty)}%`
                    : `Malus temps -${Math.round(penalty)}%`;
            }
        }

        if (timeModifier !== 0) {
            totalScore = totalScore * (1 + timeModifier / 100);
            // Le score ne peut pas être négatif ni dépasser maxScore
            totalScore = Math.max(0, Math.min(totalScore, maxScore));
        }

        // Arrondir le score total à un entier (les points par question peuvent être décimaux)
        totalScore = Math.round(totalScore);
        maxScore = Math.round(maxScore);

        // Créer l'enregistrement de completion
        const sectionData = quiz.sectionId as any;
        const completion = new QuizCompletion({
            userId: user._id,
            quizId: quiz._id,
            courseId: sectionData?.courseId || '',
            sectionId: sectionData?._id || '',
            score: totalScore,
            maxScore: maxScore,
            answers: evaluatedAnswers,
            timeSpent: timeSpent
        });

        await completion.save();

        // Mettre à jour les points de l'utilisateur (avec boost)
        if (totalScore > 0) {
            const { addPointsWithBoost } = await import('@/lib/pointsService');
            await addPointsWithBoost(user._id.toString(), totalScore, 'completeQuiz');
        }

        // Vérifier les badges après avoir complété le quiz
        await BadgeService.triggerBadgeCheck(user._id.toString());

        // Mettre à jour la progression des quêtes
        const { QuestService } = await import('@/lib/questService');
        await QuestService.updateQuestProgress(user._id.toString(), 'quiz_complete');
        // Mettre à jour aussi pour les quêtes avec score minimum
        const percentage = Math.round((totalScore / maxScore) * 100);
        if (percentage >= 80) {
            await QuestService.updateQuestProgress(user._id.toString(), 'quiz_score', { quizScore: percentage });
        }
        
        // Vérifier si le cours est complété après ce quiz
        if (sectionData?.courseId) {
            await QuestService.updateCourseCompletionQuest(user._id.toString(), sectionData.courseId.toString());
        }

        return NextResponse.json({
            score: totalScore,
            maxScore: maxScore,
            percentage: percentage,
            answers: evaluatedAnswers,
            timeModifier: timeModifier !== 0 ? timeModifier : undefined,
            timeModifierLabel: timeModifierLabel || undefined
        });
    } catch (error) {
        console.error('Erreur lors de la soumission du quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// DELETE - Supprimer un quiz
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const resolvedParams = await params;
        
        const deletedQuiz = await Quiz.findByIdAndDelete(resolvedParams.id);
        if (!deletedQuiz) {
            return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
        }

        // Supprimer aussi les completions associées
        await QuizCompletion.deleteMany({ quizId: resolvedParams.id });

        return NextResponse.json({ message: 'Quiz supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}