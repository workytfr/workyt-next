import mongoose from 'mongoose';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Exercise from '@/models/Exercise';
import Quiz from '@/models/Quiz';
import Revision from '@/models/Revision';
import Evaluation from '@/models/Evaluation';
import QuizCompletion from '@/models/QuizCompletion';
import CourseProgress from '@/models/CourseProgress';
import EvaluationSubmission from '@/models/EvaluationSubmission';
import { QuestService } from '@/lib/questService';
import { buildIdSlug } from '@/utils/slugify';
import type { AssignmentKind } from '@/models/Mentorship';

/**
 * Le catalogue Workyt vu depuis un suivi : chercher une ressource à assigner,
 * en retrouver le titre et le lien, et savoir si l'élève l'a terminée.
 *
 * Le titre et le lien d'une ressource assignée sont TOUJOURS résolus ici, côté
 * serveur, à partir de son id : le client ne fournit que (type, id). Un lien
 * forgé ne peut donc jamais atterrir dans un suivi.
 */

export interface ResourceHit {
  kind: AssignmentKind;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function courseUrl(course: { _id: unknown; slug?: string; title: string }) {
  return `/cours/${buildIdSlug(String(course._id), course.slug || course.title)}`;
}

/** Cours publiés, indexés par id, pour construire les liens de section */
async function publishedCoursesById(ids: unknown[]) {
  const courses = await Course.find({ _id: { $in: ids }, status: 'publie' })
    .select('title slug matiere niveau')
    .lean<{ _id: mongoose.Types.ObjectId; title: string; slug?: string; matiere: string; niveau: string }[]>();
  return new Map(courses.map((c) => [c._id.toString(), c]));
}

/** Pour une liste de sections : section → cours publié (les autres sont écartées) */
async function sectionsWithCourse(sectionIds: unknown[]) {
  const sections = await Section.find({ _id: { $in: sectionIds } })
    .select('title courseId')
    .lean<{ _id: mongoose.Types.ObjectId; title: string; courseId: mongoose.Types.ObjectId }[]>();
  const courses = await publishedCoursesById(sections.map((s) => s.courseId));
  const map = new Map<string, { sectionTitle: string; course: NonNullable<ReturnType<typeof courses.get>> }>();
  for (const s of sections) {
    const course = courses.get(s.courseId.toString());
    if (course) map.set(s._id.toString(), { sectionTitle: s.title, course });
  }
  return map;
}

function sectionUrl(course: { _id: unknown; slug?: string; title: string }, sectionId: string) {
  return `${courseUrl(course)}/sections/${sectionId}`;
}

/**
 * Recherche dans le catalogue, pour le sélecteur de ressources du bénévole.
 * `subject` (facultatif) oriente les cours vers la matière du suivi.
 */
export async function searchResources(
  kind: AssignmentKind,
  q: string,
  subject?: string
): Promise<ResourceHit[]> {
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;
  const LIMIT = 12;

  if (kind === 'course' || kind === 'evaluation') {
    const filter: Record<string, unknown> = { status: 'publie' };
    if (rx) filter.title = rx;
    else if (subject) filter.matiere = subject;

    if (kind === 'evaluation') {
      // Seuls les cours qui ont au moins une évaluation active
      const courseIds = await Evaluation.distinct('courseId', { isActive: true });
      filter._id = { $in: courseIds };
    }

    const courses = await Course.find(filter)
      .select('title slug matiere niveau')
      .sort({ updatedAt: -1 })
      .limit(LIMIT)
      .lean<{ _id: mongoose.Types.ObjectId; title: string; slug?: string; matiere: string; niveau: string }[]>();

    return courses.map((c) =>
      kind === 'course'
        ? { kind, id: c._id.toString(), title: c.title, subtitle: `${c.matiere} · ${c.niveau}`, url: courseUrl(c) }
        : {
            kind,
            id: c._id.toString(),
            title: `Évaluation — ${c.title}`,
            subtitle: `${c.matiere} · ${c.niveau}`,
            url: `/evaluation/draw?courseId=${c._id.toString()}`
          }
    );
  }

  if (kind === 'fiche') {
    const fiches = await Revision.find(rx ? { title: rx } : subject ? { subject } : {})
      .select('title slug subject level')
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .lean<{ _id: mongoose.Types.ObjectId; title: string; slug?: string; subject: string; level: string }[]>();
    return fiches.map((f) => ({
      kind,
      id: f._id.toString(),
      title: f.title,
      subtitle: `${f.subject} · ${f.level}`,
      url: f.slug ? `/fiches/${f.slug}` : `/fiches/${f._id.toString()}`
    }));
  }

  // Leçons, exercices, quiz : rattachés à une section d'un cours publié.
  // On surcharge la recherche (×4) puis on écarte ce qui n'est pas publié.
  const docs =
    kind === 'lesson'
      ? await Lesson.find({ ...(rx ? { title: rx } : {}), status: 'Validée' })
          .select('title sectionId').sort({ createdAt: -1 }).limit(LIMIT * 4)
          .lean<{ _id: mongoose.Types.ObjectId; title: string; sectionId?: mongoose.Types.ObjectId }[]>()
      : kind === 'exercise'
        ? await Exercise.find(rx ? { title: rx } : {})
            .select('title sectionId difficulty').sort({ createdAt: -1 }).limit(LIMIT * 4)
            .lean<{ _id: mongoose.Types.ObjectId; title: string; sectionId?: mongoose.Types.ObjectId; difficulty?: string }[]>()
        : await Quiz.find(rx ? { title: rx } : {})
            .select('title sectionId lessonId').sort({ createdAt: -1 }).limit(LIMIT * 4)
            .lean<{ _id: mongoose.Types.ObjectId; title: string; sectionId?: mongoose.Types.ObjectId; lessonId?: mongoose.Types.ObjectId }[]>();

  // Un quiz rattaché à une leçon hérite de la section de cette leçon
  const lessonIdsForQuiz = docs
    .filter((d: any) => !d.sectionId && d.lessonId)
    .map((d: any) => d.lessonId);
  const lessonSections = lessonIdsForQuiz.length
    ? new Map(
        (await Lesson.find({ _id: { $in: lessonIdsForQuiz } }).select('sectionId').lean<any[]>())
          .map((l) => [l._id.toString(), l.sectionId?.toString()])
      )
    : new Map<string, string>();

  const sectionIdOf = (d: any): string | undefined =>
    d.sectionId?.toString() || (d.lessonId ? lessonSections.get(d.lessonId.toString()) : undefined);

  const sections = await sectionsWithCourse(docs.map(sectionIdOf).filter(Boolean));

  const hits: ResourceHit[] = [];
  for (const d of docs as any[]) {
    const sid = sectionIdOf(d);
    const ctx = sid ? sections.get(sid) : undefined;
    if (!ctx) continue;
    if (!rx && subject && ctx.course.matiere !== subject) continue;
    hits.push({
      kind,
      id: d._id.toString(),
      title: d.title,
      subtitle: `${ctx.course.title} · ${ctx.sectionTitle}${d.difficulty ? ` · ${d.difficulty}` : ''}`,
      url: sectionUrl(ctx.course, sid!)
    });
    if (hits.length >= LIMIT) break;
  }
  return hits;
}

/** Titre et lien faisant foi d'une ressource, ou null si elle n'existe pas / n'est pas publiée */
export async function resolveResource(
  kind: AssignmentKind,
  id: string
): Promise<{ title: string; url: string } | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  if (kind === 'course' || kind === 'evaluation') {
    const course = await Course.findOne({ _id: id, status: 'publie' })
      .select('title slug')
      .lean<{ _id: mongoose.Types.ObjectId; title: string; slug?: string }>();
    if (!course) return null;
    if (kind === 'course') return { title: course.title, url: courseUrl(course) };
    const hasEval = await Evaluation.exists({ courseId: id, isActive: true });
    if (!hasEval) return null;
    return { title: `Évaluation — ${course.title}`, url: `/evaluation/draw?courseId=${id}` };
  }

  if (kind === 'fiche') {
    const f = await Revision.findById(id).select('title slug').lean<{ _id: mongoose.Types.ObjectId; title: string; slug?: string }>();
    if (!f) return null;
    return { title: f.title, url: f.slug ? `/fiches/${f.slug}` : `/fiches/${id}` };
  }

  let doc: any = null;
  if (kind === 'lesson') doc = await Lesson.findOne({ _id: id, status: 'Validée' }).select('title sectionId').lean();
  if (kind === 'exercise') doc = await Exercise.findById(id).select('title sectionId').lean();
  if (kind === 'quiz') doc = await Quiz.findById(id).select('title sectionId lessonId').lean();
  if (!doc) return null;

  let sectionId: string | undefined = doc.sectionId?.toString();
  if (!sectionId && doc.lessonId) {
    const lesson = await Lesson.findById(doc.lessonId).select('sectionId').lean<any>();
    sectionId = lesson?.sectionId?.toString();
  }
  if (!sectionId) return null;

  const ctx = (await sectionsWithCourse([sectionId])).get(sectionId);
  if (!ctx) return null;
  return { title: doc.title, url: sectionUrl(ctx.course, sectionId) };
}

export interface CompletionResult {
  done: boolean;
  score?: number;
  maxScore?: number;
}

/**
 * L'élève a-t-il terminé cette ressource ?
 *
 * `since` : date d'assignation. Pour un quiz ou une évaluation, seule une
 * tentative postérieure compte (refaire un quiz déjà fait, c'est le but).
 * Pour une leçon ou un cours, la progression n'est pas datée : une ressource
 * déjà terminée avant l'assignation est détectée comme terminée — l'appelant
 * la marque alors `alreadyDone`, sans points.
 *
 * Exercices et fiches n'ont pas de trace de progression : jamais détectés.
 */
export async function checkCompletion(
  kind: AssignmentKind,
  refId: string,
  studentId: string,
  since?: Date
): Promise<CompletionResult> {
  const userId = new mongoose.Types.ObjectId(studentId);

  if (kind === 'quiz') {
    const q: Record<string, unknown> = { userId, quizId: refId };
    if (since) q.completedAt = { $gte: since };
    const c = await QuizCompletion.findOne(q)
      .sort({ completedAt: -1 })
      .select('score maxScore')
      .lean<{ score: number; maxScore: number }>();
    return c ? { done: true, score: c.score, maxScore: c.maxScore } : { done: false };
  }

  if (kind === 'lesson') {
    const found = await CourseProgress.exists({ userId, lessonsRead: refId });
    return { done: !!found };
  }

  if (kind === 'course') {
    return { done: await QuestService.checkCourseCompletion(studentId, refId) };
  }

  if (kind === 'evaluation') {
    const q: Record<string, unknown> = { userId, courseId: refId };
    if (since) q.submittedAt = { $gte: since };
    const s = await EvaluationSubmission.findOne(q)
      .sort({ submittedAt: -1 })
      .select('grade status')
      .lean<{ grade?: number; status: string }>();
    if (!s) return { done: false };
    return typeof s.grade === 'number' ? { done: true, score: s.grade, maxScore: 20 } : { done: true };
  }

  return { done: false };
}
