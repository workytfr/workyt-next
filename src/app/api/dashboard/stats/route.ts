import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Quiz from '@/models/Quiz';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import authMiddleware from '@/middlewares/authMiddleware';

// Forcer le rendu dynamique pour cette route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    await dbConnect();

    try {
        const user = await authMiddleware(req);

        // 🔒 Vérification des permissions (Accès réservé aux Rédacteurs, Correcteurs, Admins)
        if (!user || !['Rédacteur', 'Correcteur', 'Admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const coursesCount = await Course.countDocuments();
        const lessonsCount = await Lesson.countDocuments();
        const quizzesCount = await Quiz.countDocuments();
        const usersCount = await User.countDocuments();
        const questionsCount = await Question.countDocuments();
        const answersCount = await Answer.countDocuments();

        return NextResponse.json({
            courses: coursesCount,
            lessons: lessonsCount,
            quizzes: quizzesCount,
            users: usersCount,
            questions: questionsCount,
            answers: answersCount,
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 });
    }
}
