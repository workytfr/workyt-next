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

    // Récupérer tous les contributeurs
    const contributors = await User.find({
      role: { $in: ["Rédacteur", "Correcteur", "Helpeur", "Modérateur"] }
    }).select("_id name email role username createdAt").lean();

    // Récupérer toutes les stats en parallèle
    const [
      coursesCount,
      lessonsCount,
      exercisesCount,
      quizzesCount,
      fichesCount,
      answersCount
    ] = await Promise.all([
      // Cours par auteur
      Course.aggregate([
        { $unwind: "$authors" },
        { $group: { _id: "$authors", count: { $sum: 1 } } }
      ]),
      // Leçons par auteur
      Lesson.aggregate([
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      // Exercices par auteur
      Exercise.aggregate([
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      // Quiz (on compte juste le total car pas d'auteur)
      Quiz.countDocuments(),
      // Fiches par auteur
      Revision.aggregate([
        { $group: { _id: "$author", count: { $sum: 1 } } }
      ]),
      // Réponses forum par utilisateur
      Answer.aggregate([
        { $group: { _id: "$user", count: { $sum: 1 } } }
      ])
    ]);

    // Maps pour accès rapide
    const coursesMap = new Map(coursesCount.map(c => [c._id.toString(), c.count]));
    const lessonsMap = new Map(lessonsCount.map(l => [l._id.toString(), l.count]));
    const exercisesMap = new Map(exercisesCount.map(e => [e._id.toString(), e.count]));
    const fichesMap = new Map(fichesCount.map(f => [f._id.toString(), f.count]));
    const answersMap = new Map(answersCount.map(a => [a._id.toString(), a.count]));

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

    // Calculer les scores
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

      let activityScore = 0;
      
      if (user.role === "Rédacteur") {
        // Cours: 20pts, Leçons: 1pt, Exercices: 2pts, Fiches: 3pts
        activityScore = Math.min(100, 
          (stats.courses * 20) + 
          (stats.lessons * 1) + 
          (stats.exercises * 2) +
          (stats.fiches * 3)
        );
      } else if (user.role === "Correcteur") {
        // Exercices: 3pts, Cours revus: 5pts, Fiches: 2pts
        activityScore = Math.min(100, 
          (stats.exercises * 3) + 
          (stats.courses * 5) +
          (stats.lessons * 2) +
          (stats.fiches * 2)
        );
      } else if (user.role === "Helpeur") {
        // Fiches: 5pts, Réponses forum: 3pts, Exercices: 2pts
        activityScore = Math.min(100, 
          (stats.fiches * 5) + 
          (stats.forumResponses * 3) +
          (stats.exercises * 2)
        );
      }

      // Pénalité inactivité
      const lastActivity = lastActivityMap.get(userId) || null;
      if (lastActivity) {
        const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) activityScore = Math.max(0, activityScore - 20);
        else if (daysSince > 14) activityScore = Math.max(0, activityScore - 10);
        else if (daysSince > 7) activityScore = Math.max(0, activityScore - 5);
      } else {
        activityScore = 0;
      }

      return {
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        stats,
        lastActivity,
        activityScore: Math.round(activityScore)
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
