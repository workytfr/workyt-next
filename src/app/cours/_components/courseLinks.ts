/**
 * Modèle de lecture d'un cours et ses adresses, partagé entre composants
 * serveur et client (aucune dépendance serveur ici).
 *
 *   /cours/<cours>                       accueil du cours
 *   /cours/<cours>/<leçon>               une leçon
 *   /cours/<cours>/exercices/<chapitre>  exercices d'un chapitre
 *   /cours/<cours>/quiz/<chapitre>       quiz d'un chapitre
 *   /cours/<cours>/imprimer[/exercices]  versions imprimables (PDF)
 *
 * Chaque segment est un « id-slug » : l'ObjectId fait foi, le slug sert au SEO.
 */
import { buildIdSlug } from "@/utils/slugify";

export interface CurriculumLesson {
    _id: string;
    title: string;
    /** Absent pour le public : seules les leçons validées sont listées */
    status?: string;
}

export interface CurriculumSection {
    _id: string;
    title: string;
    lessons: CurriculumLesson[];
    exercisesCount: number;
    quizzesCount: number;
}

export interface CurriculumPerson {
    _id: string;
    username: string;
    image?: string;
}

export interface Curriculum {
    _id: string;
    title: string;
    slug: string;
    description: string;
    matiere: string;
    niveau: string;
    image?: string;
    status: string;
    authors: CurriculumPerson[];
    verifiedBy?: CurriculumPerson | null;
    createdAt?: string;
    updatedAt?: string;
    sections: CurriculumSection[];
}

export type NavKind = "lesson" | "exercises" | "quizzes";

export interface NavItem {
    kind: NavKind;
    /** Leçon : id de la leçon ; exercices / quiz : id du chapitre */
    id: string;
    href: string;
    label: string;
    sectionId: string;
    sectionTitle: string;
}

export function courseHref(course: Pick<Curriculum, "_id" | "title" | "slug">) {
    return `/cours/${buildIdSlug(course._id, course.slug || course.title)}`;
}

export function lessonHref(course: Pick<Curriculum, "_id" | "title" | "slug">, lesson: { _id: string; title: string }) {
    return `${courseHref(course)}/${buildIdSlug(lesson._id, lesson.title)}`;
}

export function exercisesHref(course: Pick<Curriculum, "_id" | "title" | "slug">, section: { _id: string; title: string }) {
    return `${courseHref(course)}/exercices/${buildIdSlug(section._id, section.title)}`;
}

export function quizzesHref(course: Pick<Curriculum, "_id" | "title" | "slug">, section: { _id: string; title: string }) {
    return `${courseHref(course)}/quiz/${buildIdSlug(section._id, section.title)}`;
}

/** Parcours linéaire du cours : leçons, puis exercices et quiz de chaque chapitre */
export function flattenCurriculum(course: Curriculum): NavItem[] {
    const items: NavItem[] = [];
    for (const section of course.sections) {
        const base = { sectionId: section._id, sectionTitle: section.title };
        for (const lesson of section.lessons) {
            items.push({ ...base, kind: "lesson", id: lesson._id, href: lessonHref(course, lesson), label: lesson.title });
        }
        if (section.exercisesCount > 0) {
            items.push({ ...base, kind: "exercises", id: section._id, href: exercisesHref(course, section), label: `Exercices · ${section.title}` });
        }
        if (section.quizzesCount > 0) {
            items.push({ ...base, kind: "quizzes", id: section._id, href: quizzesHref(course, section), label: `Quiz · ${section.title}` });
        }
    }
    return items;
}

/** Élément courant, précédent et suivant dans le parcours */
export function findNeighbours(course: Curriculum, kind: NavKind, id: string) {
    const items = flattenCurriculum(course);
    const index = items.findIndex((i) => i.kind === kind && i.id === id);
    return {
        current: index >= 0 ? items[index] : null,
        prev: index > 0 ? items[index - 1] : null,
        next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
        isLast: index >= 0 && index === items.length - 1,
    };
}

export function countLessons(course: Curriculum) {
    return course.sections.reduce((n, s) => n + s.lessons.length, 0);
}
