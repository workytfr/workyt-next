import { cache } from "react";
import { isValidObjectId, Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Quiz from "@/models/Quiz";
import CurriculumNode from "@/models/CurriculumNode";
import "@/models/User";
import { extractIdFromSlug } from "@/utils/slugify";
import { hasPermission } from "@/lib/roles";
import type { Curriculum } from "@/app/cours/_components/courseLinks";

/**
 * Lecture d'un cours côté serveur : pages /cours/**, versions imprimables et
 * API de prévisualisation (/api/cours/[courseId]/lecture) partagent ces requêtes.
 *
 * Le public ne voit que les cours publiés et les leçons validées ; `preview`
 * (auteur du cours ou permission course.edit) lève ces deux filtres.
 */

const VALIDATED = "Validée";

/** ObjectId, Date → string : données sérialisables vers un composant client */
function plain<T>(value: unknown): T {
    return JSON.parse(JSON.stringify(value));
}

/** Retrouve un cours par id-slug, id seul ou slug seul (sans filtre de statut) */
export const findCourseByParam = cache(async (param: string) => {
    await dbConnect();
    const objectId = extractIdFromSlug(param);
    const select = "title slug description matiere niveau image status authors verifiedBy createdAt updatedAt";
    let course: any = objectId ? await Course.findById(objectId).select(select).populate("authors", "username").lean() : null;
    if (!course) course = await Course.findOne({ slug: param }).select(select).populate("authors", "username").lean();
    return course as any | null;
});

/** Sommaire du cours : chapitres, titres des leçons, nombre d'exercices et de quiz */
export const getCurriculum = cache(async (courseId: string, preview = false): Promise<Curriculum | null> => {
    await dbConnect();
    if (!isValidObjectId(courseId)) return null;

    const course: any = await Course.findById(courseId)
        .select("title slug description matiere niveau image status authors verifiedBy createdAt updatedAt")
        .populate("authors", "username image")
        .populate("verifiedBy", "username image")
        .lean();
    if (!course || (!preview && course.status !== "publie")) return null;

    const sections: any[] = await Section.find({ courseId }).select("title order").sort({ order: 1 }).lean();
    const sectionIds = sections.map((s) => s._id);

    const [lessons, exerciseCounts, quizCounts] = await Promise.all([
        Lesson.find({ sectionId: { $in: sectionIds }, ...(preview ? {} : { status: VALIDATED }) })
            .select("title order sectionId status")
            .sort({ order: 1 })
            .lean(),
        Exercise.aggregate([
            { $match: { sectionId: { $in: sectionIds } } },
            { $group: { _id: "$sectionId", n: { $sum: 1 } } },
        ]),
        Quiz.aggregate([
            { $match: { sectionId: { $in: sectionIds } } },
            { $group: { _id: "$sectionId", n: { $sum: 1 } } },
        ]),
    ]);

    const countOf = (rows: any[], id: Types.ObjectId) => rows.find((r) => String(r._id) === String(id))?.n ?? 0;

    return plain<Curriculum>({
        ...course,
        verifiedBy: course.verifiedBy ?? null,
        sections: sections.map((s) => ({
            _id: s._id,
            title: s.title,
            lessons: lessons
                .filter((l: any) => String(l.sectionId) === String(s._id))
                .map((l: any) => ({ _id: l._id, title: l.title, ...(preview ? { status: l.status } : {}) })),
            exercisesCount: countOf(exerciseCounts, s._id),
            quizzesCount: countOf(quizCounts, s._id),
        })),
    });
});

/** Le chapitre appartient-il bien au cours ? */
async function findSection(courseId: string, sectionId: string) {
    if (!isValidObjectId(courseId) || !isValidObjectId(sectionId)) return null;
    return Section.findOne({ _id: sectionId, courseId }).select("title").lean() as Promise<any>;
}

export interface LessonData {
    _id: string;
    title: string;
    content: string;
    audioUrl?: string | null;
    status: string;
    sectionId: string;
    sectionTitle: string;
    updatedAt?: string;
    createdAt?: string;
}

/**
 * Une leçon avec son contenu. `"pending"` : la leçon existe mais n'est pas
 * encore validée (visible uniquement en prévisualisation).
 */
export const getLesson = cache(async (courseId: string, lessonId: string, preview = false): Promise<LessonData | "pending" | null> => {
    await dbConnect();
    if (!isValidObjectId(lessonId)) return null;

    const lesson: any = await Lesson.findById(lessonId)
        .select("title content audioUrl status sectionId createdAt validatedAt")
        .lean();
    if (!lesson) return null;

    const section = await findSection(courseId, String(lesson.sectionId));
    if (!section) return null;
    if (!preview && lesson.status !== VALIDATED) return "pending";

    return plain<LessonData>({
        _id: lesson._id,
        title: lesson.title,
        content: lesson.content || "",
        audioUrl: lesson.audioUrl ?? null,
        status: lesson.status,
        sectionId: section._id,
        sectionTitle: section.title,
        createdAt: lesson.createdAt,
        updatedAt: lesson.validatedAt ?? lesson.createdAt,
    });
});

export interface SectionExercises {
    sectionId: string;
    sectionTitle: string;
    exercises: any[];
}

export const getSectionExercises = cache(async (courseId: string, sectionId: string): Promise<SectionExercises | null> => {
    await dbConnect();
    const section = await findSection(courseId, sectionId);
    if (!section) return null;

    const exercises = await Exercise.find({ sectionId })
        .select("title content image correction difficulty author createdAt")
        .populate("author", "username image")
        .sort({ order: 1, createdAt: 1 })
        .lean();

    return plain<SectionExercises>({ sectionId: section._id, sectionTitle: section.title, exercises });
});

export interface SectionQuizzes {
    sectionId: string;
    sectionTitle: string;
    quizzes: any[];
}

/**
 * Quiz d'un chapitre, sans les énoncés ni les corrigés : la carte n'affiche que
 * le nombre de questions et le total de points, le quiz complet est chargé au
 * lancement via /api/quizzes/[id] (qui retire les réponses).
 */
export const getSectionQuizzes = cache(async (courseId: string, sectionId: string): Promise<SectionQuizzes | null> => {
    await dbConnect();
    const section = await findSection(courseId, sectionId);
    if (!section) return null;

    const quizzes: any[] = await Quiz.find({ sectionId })
        .select("title description competencies timeBonus timePenalty questions.point")
        .sort({ order: 1, createdAt: 1 })
        .lean();

    return plain<SectionQuizzes>({ sectionId: section._id, sectionTitle: section.title, quizzes });
});

export interface PrintableQuestion {
    question: string;
    questionType: string;
    answers: string[];
}

export interface PrintableSection {
    _id: string;
    title: string;
    lessons: { _id: string; title: string; content: string }[];
    exercises: any[];
    /** Questions de quiz imprimables (QCM, Vrai/Faux, réponse courte), sans corrigé */
    questions: PrintableQuestion[];
    /** Compétences du programme travaillées dans le chapitre */
    skills: string[];
}

/** Types de questions qui ont un sens sur papier */
const PRINTABLE_QUESTION_TYPES = ["QCM", "Vrai/Faux", "Réponse courte"];

/** Tout le contenu publié d'un cours, pour le manuel imprimable */
export const getPrintableCourse = cache(async (courseId: string, preview = false) => {
    const curriculum = await getCurriculum(courseId, preview);
    if (!curriculum) return null;

    const sectionIds = curriculum.sections.map((s) => s._id);
    const [lessons, exercises, quizzes] = await Promise.all([
        Lesson.find({ sectionId: { $in: sectionIds }, ...(preview ? {} : { status: VALIDATED }) })
            .select("title content order sectionId")
            .sort({ order: 1 })
            .lean(),
        Exercise.find({ sectionId: { $in: sectionIds } })
            .select("title content image correction difficulty sectionId createdAt")
            .sort({ order: 1, createdAt: 1 })
            .lean(),
        // Énoncés seulement : les réponses restent en ligne (le quiz rapporte des points)
        Quiz.find({ sectionId: { $in: sectionIds } })
            .select("sectionId competencies questions.question questions.questionType questions.answers")
            .sort({ order: 1, createdAt: 1 })
            .lean(),
    ]);

    // Libellés des compétences (référentiel du programme)
    const skillIds = [...new Set(quizzes.flatMap((q: any) => q.competencies || []))];
    const skillLabels = new Map<string, string>();
    if (skillIds.length > 0) {
        const nodes: any[] = await CurriculumNode.find({ "skills.skillId": { $in: skillIds } }).select("skills").lean();
        for (const node of nodes) {
            for (const skill of node.skills || []) {
                if (skillIds.includes(skill.skillId)) skillLabels.set(skill.skillId, skill.description);
            }
        }
    }

    const sections: PrintableSection[] = curriculum.sections.map((s) => {
        const sectionQuizzes = quizzes.filter((q: any) => String(q.sectionId) === s._id);
        return {
            _id: s._id,
            title: s.title,
            lessons: plain(lessons.filter((l: any) => String(l.sectionId) === s._id).map((l: any) => ({ _id: l._id, title: l.title, content: l.content || "" }))),
            exercises: plain(exercises.filter((e: any) => String(e.sectionId) === s._id)),
            questions: sectionQuizzes
                .flatMap((q: any) => q.questions || [])
                .filter((q: any) => PRINTABLE_QUESTION_TYPES.includes(q.questionType) && q.question)
                .map((q: any) => ({ question: q.question, questionType: q.questionType, answers: (q.answers || []).map(String) })),
            skills: [...new Set(sectionQuizzes.flatMap((q: any) => q.competencies || []))]
                .map((id) => skillLabels.get(id as string))
                .filter(Boolean) as string[],
        };
    });

    return { curriculum, sections };
});

/** L'utilisateur peut-il voir les brouillons de ce cours ? */
export async function canPreviewCourse(user: any, courseId: string): Promise<boolean> {
    if (!user?._id || !isValidObjectId(courseId)) return false;
    if (await hasPermission(user, "course.edit")) return true;
    const course: any = await Course.findById(courseId).select("authors").lean();
    return !!course?.authors?.some((a: any) => String(a) === String(user._id));
}
