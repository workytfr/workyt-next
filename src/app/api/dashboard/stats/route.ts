import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Exercise from '@/models/Exercise';
import Quiz from '@/models/Quiz';
import User from '@/models/User';
import authMiddleware from '@/middlewares/authMiddleware';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    await dbConnect();

    try {
        const user = await authMiddleware(req);

        if (!user || typeof user.role !== 'string' || !['Helpeur', 'Rédacteur', 'Correcteur', 'Admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // All counts in parallel
        const [
            totalCourses,
            publishedCourses,
            pendingCourses,
            cancelledCourses,
            totalSections,
            totalLessons,
            validatedLessons,
            pendingLessons,
            draftLessons,
            lessonsWithMedia,
            recentLessons,
            totalExercises,
            totalQuizzes,
            totalUsers,
            // Per-user stats (for the logged-in user)
            myCourses,
            myLessons,
            myExercises,
            // By level
            coursesByLevel,
            // By subject
            coursesBySubject,
            // Lessons by status
            lessonsByStatus,
        ] = await Promise.all([
            Course.countDocuments(),
            Course.countDocuments({ status: "publie" }),
            Course.countDocuments({ status: { $in: ["en_attente_publication", "en_attente_verification"] } }),
            Course.countDocuments({ status: "annule" }),
            Section.countDocuments(),
            Lesson.countDocuments(),
            Lesson.countDocuments({ status: "Validée" }),
            Lesson.countDocuments({ status: { $in: ["En attente de correction", "En cours de rédaction"] } }),
            Lesson.countDocuments({ status: "Brouillon" }),
            Lesson.countDocuments({ media: { $exists: true, $ne: [], $not: { $size: 0 } } }),
            Lesson.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Exercise.countDocuments(),
            Quiz.countDocuments(),
            User.countDocuments(),
            Course.countDocuments({ authors: user._id }),
            Lesson.countDocuments({ author: user._id }),
            Exercise.countDocuments({ author: user._id }),
            Course.aggregate([
                { $group: { _id: "$niveau", count: { $sum: 1 } } },
            ]),
            Course.aggregate([
                { $group: { _id: "$matiere", count: { $sum: 1 } } },
            ]),
            Lesson.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
        ]);

        const toMap = (arr: Array<{ _id: string; count: number }>) =>
            arr.reduce((acc, item) => {
                if (item._id) acc[item._id] = item.count;
                return acc;
            }, {} as Record<string, number>);

        return NextResponse.json({
            courses: {
                total: totalCourses,
                published: publishedCourses,
                pending: pendingCourses,
                cancelled: cancelledCourses,
                byLevel: toMap(coursesByLevel),
                bySubject: toMap(coursesBySubject),
            },
            sections: {
                total: totalSections,
            },
            lessons: {
                total: totalLessons,
                validated: validatedLessons,
                pending: pendingLessons,
                draft: draftLessons,
                withMedia: lessonsWithMedia,
                recent: recentLessons,
                byStatus: toMap(lessonsByStatus),
            },
            exercises: {
                total: totalExercises,
            },
            quizzes: {
                total: totalQuizzes,
            },
            users: {
                total: totalUsers,
            },
            my: {
                courses: myCourses,
                lessons: myLessons,
                exercises: myExercises,
            },
        }, { status: 200 });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 });
    }
}
