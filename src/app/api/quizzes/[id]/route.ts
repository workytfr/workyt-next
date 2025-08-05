import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Quiz from '@/models/Quiz';
import QuizCompletion from '@/models/QuizCompletion';
import User from '@/models/User';
import PointTransaction from '@/models/PointTransaction';
import connectDB from '@/lib/mongodb';
import { BadgeService } from '@/lib/badgeService';

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
            questions: quiz.questions.map((q: any) => ({
                question: q.question,
                questionType: q.questionType,
                answers: q.answers,
                point: q.point
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
                lessonId: body.lessonId
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
                    const userAnswerStr = String(userAnswer || '').toLowerCase().trim();
                    const correctAnswerStr = String(question.correctAnswer || '').toLowerCase().trim();
                    isCorrect = userAnswerStr === correctAnswerStr;
                    break;
                    
                case 'Association':
                    const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
                    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                    isCorrect = correctAnswers.length === userAnswers.length &&
                               correctAnswers.every((ans: any) => userAnswers.includes(ans)) &&
                               userAnswers.every((ans: any) => correctAnswers.includes(ans));
                    break;
                    
                case 'Texte à trous':
                    const correctBlanks = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
                    const userBlanks = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                    isCorrect = correctBlanks.length === userBlanks.length &&
                               correctBlanks.every((blank: any) => userBlanks.includes(blank)) &&
                               userBlanks.every((blank: any) => correctBlanks.includes(blank));
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
                pointsEarned: pointsEarned
            });
        }

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

        // Mettre à jour les points de l'utilisateur
        await User.findByIdAndUpdate(user._id, {
            $inc: { points: totalScore }
        });

        // Créer une transaction de points
        if (totalScore > 0) {
            const pointTransaction = new PointTransaction({
                user: user._id,
                action: 'completeQuiz',
                type: 'gain',
                points: totalScore
            });
            await pointTransaction.save();
        }

        // Vérifier les badges après avoir complété le quiz
        await BadgeService.triggerBadgeCheck(user._id.toString());

        return NextResponse.json({
            score: totalScore,
            maxScore: maxScore,
            percentage: Math.round((totalScore / maxScore) * 100),
            answers: evaluatedAnswers
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