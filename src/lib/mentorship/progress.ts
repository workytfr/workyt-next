import mongoose from 'mongoose';
import QuizCompletion from '@/models/QuizCompletion';
import Quiz from '@/models/Quiz';
import CourseProgress from '@/models/CourseProgress';
import Course from '@/models/Course';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import Streak from '@/models/Streak';
import StudentAcademicProfile from '@/models/StudentAcademicProfile';

/**
 * Ce que le bénévole voit du travail réel de l'élève sur Workyt.
 *
 * C'est ce qui distingue un suivi Workyt d'un simple tchat : le bénévole ne
 * travaille pas à l'aveugle, il voit que l'élève a raté 3 questions du quiz
 * sur les fractions et rebondit dessus.
 *
 * Réservé au bénévole EN CHARGE et à la modération (la route vérifie). On ne
 * remonte que du scolaire : pas d'établissement, pas de coordonnées.
 */
export async function studentProgress(studentId: string) {
  const userId = new mongoose.Types.ObjectId(studentId);
  const since = new Date(Date.now() - 45 * 24 * 3600 * 1000);

  const [quizzes, courses, evaluations, streak, profile] = await Promise.all([
    QuizCompletion.find({ userId, completedAt: { $gte: since } })
      .sort({ completedAt: -1 })
      .limit(12)
      .select('quizId courseId score maxScore answers completedAt')
      .lean<any[]>(),
    CourseProgress.find({ userId })
      .sort({ lastAccessedAt: -1 })
      .limit(6)
      .select('courseId lessonsRead sectionsCompleted lastAccessedAt')
      .lean<any[]>(),
    EvaluationSubmission.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(6)
      .select('courseId status grade submittedAt')
      .lean<any[]>(),
    Streak.findOne({ user: userId }).select('currentStreak longestStreak lastActivityDate').lean<any>(),
    StudentAcademicProfile.findOne({ userId }).select('currentGrade track specialities upcomingExams').lean<any>()
  ]);

  const quizTitles = new Map(
    (await Quiz.find({ _id: { $in: quizzes.map((q) => q.quizId) } }).select('title').lean<any[]>())
      .map((q) => [String(q._id), q.title as string])
  );
  const courseIds = [...courses.map((c) => c.courseId), ...evaluations.map((e) => e.courseId), ...quizzes.map((q) => q.courseId)];
  const courseTitles = new Map(
    (await Course.find({ _id: { $in: courseIds } }).select('title matiere').lean<any[]>())
      .map((c) => [String(c._id), { title: c.title as string, subject: c.matiere as string }])
  );

  const upcomingExams = (profile?.upcomingExams || [])
    .filter((e: any) => e.date && new Date(e.date).getTime() >= Date.now())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((e: any) => ({ subject: e.subject, type: e.type, date: new Date(e.date).toISOString() }));

  return {
    grade: profile?.currentGrade || null,
    track: profile?.track || null,
    specialities: profile?.specialities || [],
    upcomingExams,
    streak: streak
      ? { current: streak.currentStreak || 0, longest: streak.longestStreak || 0, lastActivity: streak.lastActivityDate || null }
      : null,
    quizzes: quizzes.map((q) => ({
      title: quizTitles.get(String(q.quizId)) || 'Quiz',
      course: courseTitles.get(String(q.courseId))?.title || null,
      score: q.score,
      maxScore: q.maxScore,
      wrong: (q.answers || []).filter((a: any) => !a.isCorrect).length,
      total: (q.answers || []).length,
      completedAt: q.completedAt
    })),
    courses: courses.map((c) => ({
      title: courseTitles.get(String(c.courseId))?.title || 'Cours',
      subject: courseTitles.get(String(c.courseId))?.subject || null,
      lessonsRead: (c.lessonsRead || []).length,
      sectionsCompleted: (c.sectionsCompleted || []).length,
      lastAccessedAt: c.lastAccessedAt
    })),
    evaluations: evaluations.map((e) => ({
      course: courseTitles.get(String(e.courseId))?.title || 'Cours',
      status: e.status,
      grade: typeof e.grade === 'number' ? e.grade : null,
      submittedAt: e.submittedAt
    }))
  };
}
