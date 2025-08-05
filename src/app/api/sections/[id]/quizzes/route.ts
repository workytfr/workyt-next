import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Quiz from '@/models/Quiz';
import QuizCompletion from '@/models/QuizCompletion';
import connectDB from '@/lib/mongodb';

// GET - Récupérer tous les quiz d'une section
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        await connectDB();

        const resolvedParams = await params;
        const quizzes = await Quiz.find({ sectionId: resolvedParams.id })
            .populate('sectionId', 'title courseId')
            .sort({ createdAt: 1 });

        if (!session?.user?.email) {
            // Retourner les quiz sans les informations de completion pour les utilisateurs non connectés
            return NextResponse.json(quizzes.map(quiz => ({
                _id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                sectionId: quiz.sectionId,
                questionsCount: quiz.questions.length,
                totalPoints: quiz.questions.reduce((sum: number, q: any) => sum + q.point, 0)
            })));
        }

        // Pour les utilisateurs connectés, inclure les informations de completion
        const userCompletions = await QuizCompletion.find({
            userId: session.user.id,
            quizId: { $in: quizzes.map((q: any) => q._id) }
        });

        const quizzesWithCompletion = quizzes.map((quiz: any) => {
            const completion = userCompletions.find(c => c.quizId.toString() === quiz._id.toString());
            return {
                _id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                sectionId: quiz.sectionId,
                questionsCount: quiz.questions.length,
                totalPoints: quiz.questions.reduce((sum: number, q: any) => sum + q.point, 0),
                completed: !!completion,
                score: completion?.score || 0,
                maxScore: completion?.maxScore || 0,
                percentage: completion ? Math.round((completion.score / completion.maxScore) * 100) : 0
            };
        });

        return NextResponse.json(quizzesWithCompletion);
    } catch (error) {
        console.error('Erreur lors de la récupération des quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
} 