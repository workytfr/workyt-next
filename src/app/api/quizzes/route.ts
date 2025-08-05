import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Quiz from '@/models/Quiz';
import connectDB from '@/lib/mongodb';

// GET - Récupérer tous les quiz (pour le dashboard)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const sectionId = searchParams.get('sectionId');
        const lessonId = searchParams.get('lessonId');

        let query: any = {};
        if (sectionId) query.sectionId = sectionId;
        if (lessonId) query.lessonId = lessonId;

        const quizzes = await Quiz.find(query)
            .populate('sectionId', 'title')
            .populate('lessonId', 'title')
            .sort({ createdAt: -1 });

        return NextResponse.json(quizzes);
    } catch (error) {
        console.error('Erreur lors de la récupération des quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// POST - Créer un nouveau quiz
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        
        // Validation des données
        if (!body.title || !body.questions || body.questions.length === 0) {
            return NextResponse.json(
                { error: 'Titre et questions requis' },
                { status: 400 }
            );
        }

        // Validation des questions
        for (let i = 0; i < body.questions.length; i++) {
            const question = body.questions[i];
            if (!question.question || !question.questionType || !question.point) {
                return NextResponse.json(
                    { error: `Question ${i + 1}: données manquantes` },
                    { status: 400 }
                );
            }

            // Validation selon le type de question
            switch (question.questionType) {
                case 'QCM':
                    if (!question.answers || question.answers.length < 2) {
                        return NextResponse.json(
                            { error: `Question ${i + 1}: QCM nécessite au moins 2 réponses` },
                            { status: 400 }
                        );
                    }
                    if (question.correctAnswer === undefined || question.correctAnswer === null) {
                        return NextResponse.json(
                            { error: `Question ${i + 1}: réponse correcte requise` },
                            { status: 400 }
                        );
                    }
                    // Vérifier que la réponse correcte est valide
                    if (question.correctAnswer < 0 || question.correctAnswer >= question.answers.length) {
                        return NextResponse.json(
                            { error: `Question ${i + 1}: index de réponse correcte invalide` },
                            { status: 400 }
                        );
                    }
                    // Ajouter answerSelectionType si manquant
                    if (!question.answerSelectionType) {
                        question.answerSelectionType = 'single';
                    }
                    break;

                case 'Vrai/Faux':
                    if (question.correctAnswer === undefined || question.correctAnswer === null) {
                        return NextResponse.json(
                            { error: `Question ${i + 1}: réponse correcte requise` },
                            { status: 400 }
                        );
                    }
                    break;

                case 'Réponse courte':
                    if (!question.correctAnswer || question.correctAnswer === undefined || question.correctAnswer === null) {
                        return NextResponse.json(
                            { error: `Question ${i + 1}: réponse correcte requise` },
                            { status: 400 }
                        );
                    }
                    break;

                default:
                    return NextResponse.json(
                        { error: `Question ${i + 1}: type de question non supporté` },
                        { status: 400 }
                    );
            }
        }

        const quiz = new Quiz(body);
        await quiz.save();

        return NextResponse.json(quiz, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du quiz:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
