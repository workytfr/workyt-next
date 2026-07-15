import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import DailyQuiz from '@/models/DailyQuiz';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { normalizeDate } from '@/lib/dailyQuizService';

export const dynamic = 'force-dynamic';

// Rôles autorisés à déposer un quiz du jour, alignés sur /api/quizzes
const AUTHORIZED_ROLES = ['Admin', 'Rédacteur', 'Correcteur', 'Helpeur'];

/**
 * Valide le corps d'un quiz du jour. Retourne un message d'erreur ou null.
 */
function validatePayload(body: any): string | null {
    if (!body || typeof body !== 'object') return 'Corps de requête invalide';

    if (typeof body.question !== 'string' || body.question.trim().length === 0) {
        return 'La question est requise';
    }
    if (body.question.length > 500) {
        return 'La question ne doit pas dépasser 500 caractères';
    }
    if (!Array.isArray(body.answers) || body.answers.length !== 4) {
        return 'Il faut exactement 4 propositions';
    }
    if (!body.answers.every((a: any) => typeof a === 'string' && a.trim().length > 0)) {
        return 'Les 4 propositions doivent être remplies';
    }
    if (!body.answers.every((a: string) => a.length <= 80)) {
        return 'Chaque proposition doit faire 80 caractères maximum (contrainte des boutons Discord)';
    }
    if (new Set(body.answers.map((a: string) => a.trim())).size !== 4) {
        return 'Les propositions doivent être différentes les unes des autres';
    }
    if (!Number.isInteger(body.correctAnswer) || body.correctAnswer < 0 || body.correctAnswer > 3) {
        return 'La bonne réponse doit être l\'index d\'une des 4 propositions';
    }
    if (!body.date) return 'La date de publication est requise';
    if (Number.isNaN(new Date(body.date).getTime())) return 'Date invalide';

    return null;
}

/**
 * GET /api/daily-quiz — liste des quiz du jour (dashboard bénévoles).
 * `?from=YYYY-MM-DD` et `?to=YYYY-MM-DD` pour borner, sinon les 60 prochains jours.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (!session.user.role || !AUTHORIZED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const from = fromParam ? new Date(fromParam) : new Date();
        const to = toParam
            ? new Date(toParam)
            : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
        }

        const quizzes = await DailyQuiz.find({
            date: { $gte: normalizeDate(from), $lte: normalizeDate(to) }
        })
            .populate('author', 'username email')
            .sort({ date: 1 });

        return NextResponse.json({ quizzes });
    } catch (error) {
        console.error('Erreur GET /api/daily-quiz:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * POST /api/daily-quiz — déposer un quiz pour une date donnée.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (!session.user.role || !AUTHORIZED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await connectDB();

        const body = await req.json().catch(() => null);
        const error = validatePayload(body);
        if (error) return NextResponse.json({ error }, { status: 400 });

        const date = normalizeDate(new Date(body.date));
        const today = normalizeDate(new Date());

        if (date < today) {
            return NextResponse.json(
                { error: 'Impossible de programmer un quiz dans le passé' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // L'index unique sur `date` garantit un seul quiz par jour, mais on renvoie
        // un message clair plutôt qu'une erreur Mongo brute.
        const existing = await DailyQuiz.findOne({ date });
        if (existing) {
            return NextResponse.json(
                { error: 'Un quiz est déjà programmé pour cette date' },
                { status: 409 }
            );
        }

        const quiz = await DailyQuiz.create({
            date,
            question: body.question.trim(),
            answers: body.answers.map((a: string) => a.trim()),
            correctAnswer: body.correctAnswer,
            explanation: body.explanation?.trim() || undefined,
            author: user._id
        });

        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error: any) {
        if (error?.code === 11000) {
            return NextResponse.json(
                { error: 'Un quiz est déjà programmé pour cette date' },
                { status: 409 }
            );
        }
        console.error('Erreur POST /api/daily-quiz:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
