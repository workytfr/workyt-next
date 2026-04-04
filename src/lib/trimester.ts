/**
 * Utilitaire de gestion des trimestres scolaires
 *
 * T1 Automne : Septembre - Novembre (mois 9-11)
 * T2 Hiver   : Décembre - Février  (mois 12, 1, 2)
 * T3 Printemps : Mars - Juin        (mois 3-6)
 * Vacances   : Juillet - Août       (mois 7-8) → pas d'évaluation
 */

export type TrimesterCode = 'T1' | 'T2' | 'T3';

export interface TrimesterInfo {
    trimester: TrimesterCode;
    name: string;
    schoolYear: string;     // "2025-2026"
    startDate: Date;
    endDate: Date;
}

/**
 * Calcule l'année scolaire pour une date donnée.
 * Les mois 1-8 (jan-août) appartiennent à l'année scolaire commencée en septembre de l'année précédente.
 */
export function getSchoolYear(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month >= 9) {
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

/**
 * Retourne les informations du trimestre courant, ou null si vacances d'été (juillet-août).
 */
export function getCurrentTrimester(date: Date = new Date()): TrimesterInfo | null {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month >= 9 && month <= 11) {
        return {
            trimester: 'T1',
            name: 'Automne',
            schoolYear: `${year}-${year + 1}`,
            startDate: new Date(year, 8, 1),    // 1er sept
            endDate: new Date(year, 10, 30),     // 30 nov
        };
    }

    if (month === 12) {
        return {
            trimester: 'T2',
            name: 'Hiver',
            schoolYear: `${year}-${year + 1}`,
            startDate: new Date(year, 11, 1),    // 1er déc
            endDate: new Date(year + 1, 1, 28),  // 28 fév (approx)
        };
    }

    if (month >= 1 && month <= 2) {
        return {
            trimester: 'T2',
            name: 'Hiver',
            schoolYear: `${year - 1}-${year}`,
            startDate: new Date(year - 1, 11, 1),
            endDate: new Date(year, 1, 28),
        };
    }

    if (month >= 3 && month <= 6) {
        return {
            trimester: 'T3',
            name: 'Printemps',
            schoolYear: `${year - 1}-${year}`,
            startDate: new Date(year, 2, 1),     // 1er mars
            endDate: new Date(year, 5, 30),      // 30 juin
        };
    }

    // Juillet-Août : vacances
    return null;
}

/**
 * Vérifie si on est en période d'évaluation (pas en vacances d'été).
 */
export function isEvaluationPeriod(date: Date = new Date()): boolean {
    return getCurrentTrimester(date) !== null;
}

/**
 * Retourne les infos du prochain trimestre (pour afficher "prochaine évaluation disponible").
 */
export function getNextTrimester(date: Date = new Date()): TrimesterInfo {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Après T1 (sept-nov) ou pendant vacances d'été → T1 de la prochaine année scolaire
    if (month >= 7 && month <= 8) {
        return {
            trimester: 'T1',
            name: 'Automne',
            schoolYear: `${year}-${year + 1}`,
            startDate: new Date(year, 8, 1),
            endDate: new Date(year, 10, 30),
        };
    }

    if (month >= 9 && month <= 11) {
        return {
            trimester: 'T2',
            name: 'Hiver',
            schoolYear: `${year}-${year + 1}`,
            startDate: new Date(year, 11, 1),
            endDate: new Date(year + 1, 1, 28),
        };
    }

    if (month === 12 || (month >= 1 && month <= 2)) {
        const sy = month === 12 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        const springYear = month === 12 ? year + 1 : year;
        return {
            trimester: 'T3',
            name: 'Printemps',
            schoolYear: sy,
            startDate: new Date(springYear, 2, 1),
            endDate: new Date(springYear, 5, 30),
        };
    }

    // Mars-Juin → prochain T1 en septembre
    return {
        trimester: 'T1',
        name: 'Automne',
        schoolYear: `${year}-${year + 1}`,
        startDate: new Date(year, 8, 1),
        endDate: new Date(year, 10, 30),
    };
}
