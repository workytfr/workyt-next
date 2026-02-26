import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Quiz from "@/models/Quiz";
import Revision from "@/models/Revision";
import Answer from "@/models/Answer";

// Types pour les contributeurs
interface ContributorStats {
  courses: number;
  lessons: number;
  exercises: number;
  quizzes: number;
  fiches: number;
  forumResponses: number;
}

interface Contributor {
  _id: string;
  name: string;
  email: string;
  role: string;
  username: string;
  stats: ContributorStats;
  lastActivity: Date | null | undefined;
  activityScore: number;
  activityScoreLastMonth: number;
  scoreEvolution: number; // +5 ou -3 (pts) ; % affiché côté client
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Accès non autorisé. Admin uniquement." },
        { status: 403 }
      );
    }

    await dbConnect();

    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Récupérer tous les contributeurs
    const contributors = await User.find({
      role: { $in: ["Rédacteur", "Correcteur", "Helpeur", "Modérateur"] }
    }).select("_id name email role username createdAt").lean();

    // Récupérer toutes les stats en parallèle (+ stats ce mois / mois dernier)
    const [
      coursesCount,
      lessonsCount,
      exercisesCount,
      quizzesCount,
      fichesCount,
      answersCount,
      coursesThisMonth,
      lessonsThisMonth,
      exercisesThisMonth,
      fichesThisMonth,
      answersThisMonth,
      coursesLastMonth,
      lessonsLastMonth,
      exercisesLastMonth,
      fichesLastMonth,
      answersLastMonth
    ] = await Promise.all([
      Course.aggregate([{ $unwind: "$authors" }, { $group: { _id: "$authors", count: { $sum: 1 } } }]),
      Lesson.aggregate([{ $group: { _id: "$author", count: { $sum: 1 } } }]),
      Exercise.aggregate([{ $group: { _id: "$author", count: { $sum: 1 } } }]),
      Quiz.countDocuments(),
      Revision.aggregate([{ $group: { _id: "$author", count: { $sum: 1 } } }]),
      Answer.aggregate([{ $group: { _id: "$user", count: { $sum: 1 } } }]),
      Course.aggregate([
        { $match: { createdAt: { $gte: startThisMonth } } },
        { $unwind: "$authors" },
        { $group: { _id: "$authors", count: { $sum: 1 } } }
      ]),
      Lesson.aggregate([
        { $match: { createdAt: { $gte: startThisMonth } } },
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      Exercise.aggregate([
        { $match: { createdAt: { $gte: startThisMonth } } },
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      Revision.aggregate([
        { $match: { createdAt: { $gte: startThisMonth } } },
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      Answer.aggregate([
        { $match: { createdAt: { $gte: startThisMonth } } },
        { $group: { _id: "$user", count: { $sum: 1 } } }
      ]),
      Course.aggregate([
        { $match: { createdAt: { $gte: startLastMonth, $lt: startThisMonth } } },
        { $unwind: "$authors" },
        { $group: { _id: "$authors", count: { $sum: 1 } } }
      ]),
      Lesson.aggregate([
        { $match: { createdAt: { $gte: startLastMonth, $lt: startThisMonth } } },
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      Exercise.aggregate([
        { $match: { createdAt: { $gte: startLastMonth, $lt: startThisMonth } } },
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      Revision.aggregate([
        { $match: { createdAt: { $gte: startLastMonth, $lt: startThisMonth } } },
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      Answer.aggregate([
        { $match: { createdAt: { $gte: startLastMonth, $lt: startThisMonth } } },
        { $group: { _id: "$user", count: { $sum: 1 } } }
      ])
    ]);

    const toMap = (arr: { _id: any; count: number }[]) =>
      new Map(arr.map(x => [x._id.toString(), x.count]));
    const coursesMap = toMap(coursesCount);
    const lessonsMap = toMap(lessonsCount);
    const exercisesMap = toMap(exercisesCount);
    const fichesMap = toMap(fichesCount);
    const answersMap = toMap(answersCount);
    const coursesThisMap = toMap(coursesThisMonth);
    const lessonsThisMap = toMap(lessonsThisMonth);
    const exercisesThisMap = toMap(exercisesThisMonth);
    const fichesThisMap = toMap(fichesThisMonth);
    const answersThisMap = toMap(answersThisMonth);
    const coursesLastMap = toMap(coursesLastMonth);
    const lessonsLastMap = toMap(lessonsLastMonth);
    const exercisesLastMap = toMap(exercisesLastMonth);
    const fichesLastMap = toMap(fichesLastMonth);
    const answersLastMap = toMap(answersLastMonth);

    // Récupérer la dernière activité
    const lastActivities = await Promise.all(
      contributors.map(async (user) => {
        const [lastLesson, lastCourse, lastExercise, lastFiche, lastAnswer] = await Promise.all([
          Lesson.findOne({ author: user._id }).sort({ createdAt: -1 }).select("createdAt").lean(),
          Course.findOne({ authors: user._id }).sort({ createdAt: -1 }).select("createdAt").lean(),
          Exercise.findOne({ author: user._id }).sort({ createdAt: -1 }).select("createdAt").lean(),
          Revision.findOne({ author: user._id }).sort({ createdAt: -1 }).select("createdAt").lean(),
          Answer.findOne({ user: user._id }).sort({ createdAt: -1 }).select("createdAt").lean()
        ]);

        const dates = [
          lastLesson?.createdAt,
          lastCourse?.createdAt,
          lastExercise?.createdAt,
          lastFiche?.createdAt,
          (lastAnswer as any)?.createdAt,
          user.createdAt
        ].filter(Boolean);

        return {
          userId: user._id.toString(),
          lastActivity: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d!).getTime()))) : null
        };
      })
    );

    const lastActivityMap = new Map(lastActivities.map(la => [la.userId, la.lastActivity]));

    // Helper: calculer score brut par rôle (sans plafond ni pénalité)
    const rawScore = (c: number, l: number, e: number, f: number, a: number, role: string) => {
      if (role === "Rédacteur") return c * 20 + l * 1 + e * 2 + f * 3;
      if (role === "Correcteur") return e * 3 + c * 5 + l * 2 + f * 2;
      if (role === "Helpeur") return f * 5 + a * 3 + e * 2;
      return 0;
    };

    const formattedContributors: Contributor[] = contributors.map(user => {
      const userId = user._id.toString();
      
      const stats: ContributorStats = {
        courses: coursesMap.get(userId) || 0,
        lessons: lessonsMap.get(userId) || 0,
        exercises: exercisesMap.get(userId) || 0,
        quizzes: 0,
        fiches: fichesMap.get(userId) || 0,
        forumResponses: answersMap.get(userId) || 0
      };

      const c = stats.courses, l = stats.lessons, e = stats.exercises;
      const f = stats.fiches, a = stats.forumResponses;

      let activityScore = 0;
      if (user.role === "Rédacteur") activityScore = Math.min(100, rawScore(c, l, e, f, a, user.role));
      else if (user.role === "Correcteur") activityScore = Math.min(100, rawScore(c, l, e, f, a, user.role));
      else if (user.role === "Helpeur") activityScore = Math.min(100, rawScore(c, l, e, f, a, user.role));

      const lastActivity = lastActivityMap.get(userId) || null;
      if (lastActivity) {
        const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) activityScore = Math.max(0, activityScore - 20);
        else if (daysSince > 14) activityScore = Math.max(0, activityScore - 10);
        else if (daysSince > 7) activityScore = Math.max(0, activityScore - 5);
      } else {
        activityScore = 0;
      }

      const cThis = coursesThisMap.get(userId) || 0, lThis = lessonsThisMap.get(userId) || 0;
      const eThis = exercisesThisMap.get(userId) || 0, fThis = fichesThisMap.get(userId) || 0;
      const aThis = answersThisMap.get(userId) || 0;
      const cLast = coursesLastMap.get(userId) || 0, lLast = lessonsLastMap.get(userId) || 0;
      const eLast = exercisesLastMap.get(userId) || 0, fLast = fichesLastMap.get(userId) || 0;
      const aLast = answersLastMap.get(userId) || 0;

      const scoreThisMonth = rawScore(cThis, lThis, eThis, fThis, aThis, user.role);
      const scoreLastMonth = rawScore(cLast, lLast, eLast, fLast, aLast, user.role);
      const activityScoreLastMonth = Math.min(100, scoreLastMonth);
      const scoreEvolution = scoreLastMonth > 0
        ? Math.round(((scoreThisMonth - scoreLastMonth) / scoreLastMonth) * 100)
        : (scoreThisMonth > 0 ? 100 : 0);

      return {
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        stats,
        lastActivity,
        activityScore: Math.round(activityScore),
        activityScoreLastMonth,
        scoreEvolution
      };
    });

    return NextResponse.json({
      contributors: formattedContributors,
      total: formattedContributors.length,
      stats: {
        totalRedacteurs: formattedContributors.filter(c => c.role === "Rédacteur").length,
        totalCorrecteurs: formattedContributors.filter(c => c.role === "Correcteur").length,
        totalHelpeurs: formattedContributors.filter(c => c.role === "Helpeur").length,
        avgActivity: Math.round(
          formattedContributors.reduce((acc, c) => acc + c.activityScore, 0) / 
          (formattedContributors.length || 1)
        )
      }
    });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
