import { useMemo } from "react";
import { Course, NavigableItem, SelectedContent } from "../types";

export function buildFlatNavigation(course: Course): NavigableItem[] {
    const items: NavigableItem[] = [];

    course.sections.forEach((section, sectionIndex) => {
        // Ajouter chaque lecon
        if (section.lessons && section.lessons.length > 0) {
            section.lessons.forEach((lesson, lessonIndex) => {
                items.push({
                    kind: 'lesson',
                    sectionId: section._id,
                    sectionTitle: section.title,
                    sectionIndex,
                    itemIndex: lessonIndex,
                    label: lesson.title,
                    lesson,
                });
            });
        }

        // Ajouter les exercices comme un seul item
        if (section.exercises && section.exercises.length > 0) {
            items.push({
                kind: 'exercises',
                sectionId: section._id,
                sectionTitle: section.title,
                sectionIndex,
                itemIndex: 0,
                label: `Exercices - ${section.title}`,
                exercises: section.exercises,
            });
        }

        // Ajouter les quiz comme un seul item
        if (section.quizzes && section.quizzes.length > 0) {
            items.push({
                kind: 'quizzes',
                sectionId: section._id,
                sectionTitle: section.title,
                sectionIndex,
                itemIndex: 0,
                label: `Quiz - ${section.title}`,
                quizzes: section.quizzes,
            });
        }
    });

    return items;
}

function findCurrentIndex(items: NavigableItem[], selected: SelectedContent | null): number {
    if (!selected) return -1;

    return items.findIndex(item => {
        if (selected.kind !== item.kind) return false;
        if (selected.sectionId !== item.sectionId) return false;

        if (selected.kind === 'lesson' && item.kind === 'lesson') {
            return selected.lesson._id === item.lesson?._id;
        }

        // Pour exercices et quiz, un seul item par section
        return true;
    });
}

export function useCourseNavigation(course: Course | null, selected: SelectedContent | null) {
    const flatItems = useMemo(() => {
        if (!course) return [];
        return buildFlatNavigation(course);
    }, [course]);

    const currentIndex = useMemo(() => {
        return findCurrentIndex(flatItems, selected);
    }, [flatItems, selected]);

    const prev = currentIndex > 0 ? flatItems[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null;

    return { flatItems, currentIndex, prev, next };
}

/** Convertit un NavigableItem en SelectedContent */
export function navigableToSelected(item: NavigableItem): SelectedContent {
    switch (item.kind) {
        case 'lesson':
            return {
                kind: 'lesson',
                lesson: item.lesson!,
                sectionId: item.sectionId,
                sectionTitle: item.sectionTitle,
            };
        case 'exercises':
            return {
                kind: 'exercises',
                exercises: item.exercises || [],
                sectionId: item.sectionId,
                sectionTitle: item.sectionTitle,
            };
        case 'quizzes':
            return {
                kind: 'quizzes',
                quizzes: item.quizzes || [],
                sectionId: item.sectionId,
                sectionTitle: item.sectionTitle,
            };
    }
}
