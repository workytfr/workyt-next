import { educationData } from '@/data/educationData'
import { slugify } from './slugify'

// Cache des paires (slug, matière originale) construit une fois
const SUBJECT_PAIRS: Array<[string, string]> = educationData.subjects.map((s) => [slugify(s), s])
const LEVEL_PAIRS: Array<[string, string]> = educationData.levels.map((l) => [slugify(l), l])

export function subjectToSlug(subject: string): string {
    return slugify(subject)
}

export function levelToSlug(level: string): string {
    return slugify(level)
}

/**
 * Retrouve la matière originale ("Mathématiques", "Physique-Chimie"…)
 * à partir de son slug ("mathematiques", "physique-chimie").
 * Retourne null si le slug ne correspond à aucune matière connue.
 */
export function slugToSubject(slug: string): string | null {
    const found = SUBJECT_PAIRS.find(([s]) => s === slug)
    return found ? found[1] : null
}

/**
 * Retrouve le niveau scolaire original ("Seconde", "Terminale"…)
 * à partir de son slug ("seconde", "terminale").
 */
export function slugToLevel(slug: string): string | null {
    const found = LEVEL_PAIRS.find(([s]) => s === slug)
    return found ? found[1] : null
}

export function getAllSubjectSlugs(): string[] {
    return SUBJECT_PAIRS.map(([s]) => s)
}

export function getAllLevelSlugs(): string[] {
    return LEVEL_PAIRS.map(([s]) => s)
}
