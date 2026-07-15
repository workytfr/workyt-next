import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import mongoose from 'mongoose';
import DailyQuiz from '@/models/DailyQuiz';
import DailyQuizAttempt from '@/models/DailyQuizAttempt';
import connectDB from '@/lib/mongodb';
import { normalizeDate } from '@/lib/dailyQuizService';

export const dynamic = 'force-dynamic';

const AUTHORIZED_ROLES = ['Admin', 'Rédacteur', 'Correcteur', 'Helpeur'];

/**
 * Un quiz déjà passé (ou celui du jour, déjà posté sur Discord et joué) ne doit
 * plus bouger : le modifier fausserait les tentatives déjà enregistrées.
 * Seul un quiz strictement futur est éditable.
 */
function isEditable(quizDate: Date): boolean {
    return normalizeDate(quizDate) > normalizeDate(new Date());
}

async function authorize() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };
    }
    if (!session.user.role || !AUTHORIZED_ROLES.includes(session.user.role)) {
        return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
    }
    return { session };
}

/**
 * PUT /api/daily-quiz/[id] — modifier un quiz encore à venir.
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (auth.error) return auth.error;

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        await connectDB();

        const quiz = await DailyQuiz.findById(id);
        if (!quiz) {
            return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
        }
        if (!isEditable(quiz.date)) {
            return NextResponse.json(
                { error: 'Un quiz déjà publié ne peut plus être modifié' },
                { status: 409 }
            );
        }

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

        if (typeof body.question === 'string') {
            const question = body.question.trim();
            if (!question || question.length > 500) {
                return NextResponse.json({ error: 'Question invalide' }, { status: 400 });
            }
            quiz.question = question;
        }

        if (body.answers !== undefined) {
            if (
                !Array.isArray(body.answers) ||
                body.answers.length !== 4 ||
                !body.answers.every((a: any) => typeof a === 'string' && a.trim() && a.length <= 80) ||
                new Set(body.answers.map((a: string) => a.trim())).size !== 4
            ) {
                return NextResponse.json(
                    { error: '4 propositions distinctes, non vides, de 80 caractères max' },
                    { status: 400 }
                );
            }
            quiz.answers = body.answers.map((a: string) => a.trim());
        }

        if (body.correctAnswer !== undefined) {
            if (
                !Number.isInteger(body.correctAnswer) ||
                body.correctAnswer < 0 ||
                body.correctAnswer > 3
            ) {
                return NextResponse.json({ error: 'Bonne réponse invalide' }, { status: 400 });
            }
            quiz.correctAnswer = body.correctAnswer;
        }

        if (body.explanation !== undefined) {
            quiz.explanation = body.explanation?.trim() || undefined;
        }

        if (body.date !== undefined) {
            const newDate = new Date(body.date);
            if (Number.isNaN(newDate.getTime())) {
                return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
            }
            const normalized = normalizeDate(newDate);
            if (normalized <= normalizeDate(new Date())) {
                return NextResponse.json(
                    { error: 'La nouvelle date doit être dans le futur' },
                    { status: 400 }
                );
            }
            const clash = await DailyQuiz.findOne({ date: normalized, _id: { $ne: quiz._id } });
            if (clash) {
                return NextResponse.json(
                    { error: 'Un quiz est déjà programmé pour cette date' },
                    { status: 409 }
                );
            }
            quiz.date = normalized;
        }

        await quiz.save();
        return NextResponse.json({ quiz });
    } catch (error: any) {
        if (error?.code === 11000) {
            return NextResponse.json(
                { error: 'Un quiz est déjà programmé pour cette date' },
                { status: 409 }
            );
        }
        console.error('Erreur PUT /api/daily-quiz/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * DELETE /api/daily-quiz/[id] — supprimer un quiz encore à venir.
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (auth.error) return auth.error;

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
        }

        await connectDB();

        const quiz = await DailyQuiz.findById(id);
        if (!quiz) {
            return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
        }
        if (!isEditable(quiz.date)) {
            return NextResponse.json(
                { error: 'Un quiz déjà publié ne peut plus être supprimé' },
                { status: 409 }
            );
        }

        // Rien ne devrait exister pour un quiz futur, mais on évite les orphelins.
        await DailyQuizAttempt.deleteMany({ dailyQuiz: quiz._id });
        await quiz.deleteOne();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur DELETE /api/daily-quiz/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
