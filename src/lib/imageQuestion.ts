/**
 * Géométrie des questions visuelles : « Point sur image », « Zone sur image »
 * et « Graphique ».
 *
 * Partagé par le lecteur de quiz et la correction serveur, pour qu'une réponse
 * jugée juste à l'écran le soit exactement de la même façon à la correction.
 *
 * Toutes les coordonnées d'image sont en **pourcentage** (0-100) de la largeur
 * et de la hauteur : elles restent valables quelle que soit la taille
 * d'affichage, du mobile au grand écran.
 */

// ---------------------------------------------------------------------------
// Point sur image (Pin)
// ---------------------------------------------------------------------------

export interface PinTarget {
    /** Centre de la cible, en % de la largeur / hauteur. */
    x: number;
    y: number;
    /** Rayon de tolérance, en % de la plus petite dimension. */
    radius: number;
}

export interface PinAnswer {
    x: number;
    y: number;
}

const DEFAULT_PIN_RADIUS = 8;

export function parsePinTarget(raw: any): PinTarget | null {
    if (!raw || typeof raw !== "object") return null;
    const x = Number(raw.x);
    const y = Number(raw.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    const radius = Number(raw.radius);
    return {
        x,
        y,
        radius: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_PIN_RADIUS,
    };
}

export function parsePinAnswer(raw: any): PinAnswer | null {
    if (!raw || typeof raw !== "object") return null;
    const x = Number(raw.x);
    const y = Number(raw.y);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/** Le marqueur posé tombe-t-il dans le rayon de tolérance ? */
export function pinMatches(userAnswer: any, correctAnswer: any): boolean {
    const target = parsePinTarget(correctAnswer);
    const answer = parsePinAnswer(userAnswer);
    if (!target || !answer) return false;

    const dx = answer.x - target.x;
    const dy = answer.y - target.y;
    return Math.sqrt(dx * dx + dy * dy) <= target.radius;
}

// ---------------------------------------------------------------------------
// Zone sur image (Image Marking)
// ---------------------------------------------------------------------------

export interface ZoneTarget {
    /** Coin supérieur gauche, en % de la largeur / hauteur. */
    x: number;
    y: number;
    /** Dimensions, en % également. */
    w: number;
    h: number;
    /** Recouvrement minimal exigé, en % de la zone attendue (0-100). */
    minOverlap: number;
}

export type ZoneAnswer = Omit<ZoneTarget, "minOverlap">;

const DEFAULT_MIN_OVERLAP = 60;

export function parseZone(raw: any): ZoneTarget | null {
    if (!raw || typeof raw !== "object") return null;

    const x = Number(raw.x);
    const y = Number(raw.y);
    const w = Number(raw.w);
    const h = Number(raw.h);
    if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;

    const minOverlap = Number(raw.minOverlap);
    return {
        x,
        y,
        w,
        h,
        minOverlap:
            Number.isFinite(minOverlap) && minOverlap > 0 ? minOverlap : DEFAULT_MIN_OVERLAP,
    };
}

/**
 * Part de la zone attendue couverte par la zone tracée, pénalisée par les
 * débordements — autrement dit l'intersection rapportée à l'union (IoU),
 * exprimée en %.
 *
 * L'union plutôt que la seule zone attendue : sinon entourer toute l'image
 * garantirait 100 % de recouvrement.
 */
export function zoneOverlapPercent(userAnswer: any, correctAnswer: any): number {
    const target = parseZone(correctAnswer);
    const answer = parseZone({ ...userAnswer, minOverlap: 1 });
    if (!target || !answer) return 0;

    const left = Math.max(target.x, answer.x);
    const top = Math.max(target.y, answer.y);
    const right = Math.min(target.x + target.w, answer.x + answer.w);
    const bottom = Math.min(target.y + target.h, answer.y + answer.h);

    if (right <= left || bottom <= top) return 0;

    const intersection = (right - left) * (bottom - top);
    const union = target.w * target.h + answer.w * answer.h - intersection;
    return union > 0 ? (intersection / union) * 100 : 0;
}

/** Le tracé couvre-t-il suffisamment la zone attendue ? */
export function zoneMatches(userAnswer: any, correctAnswer: any): boolean {
    const target = parseZone(correctAnswer);
    if (!target) return false;
    return zoneOverlapPercent(userAnswer, correctAnswer) >= target.minOverlap;
}

// ---------------------------------------------------------------------------
// Graphique (points sur un repère)
// ---------------------------------------------------------------------------

export interface GraphPoint {
    x: number;
    y: number;
}

export interface GraphSettings {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    /** Pas de la grille, en unités du repère. */
    step: number;
    /** Écart accepté entre un point placé et le point attendu, en unités. */
    tolerance: number;
}

const DEFAULT_GRAPH: GraphSettings = {
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5,
    step: 1,
    tolerance: 0.5,
};

/** Réglages du repère, stockés dans `answers` sous forme de chaînes. */
export function parseGraphSettings(answers: string[] | undefined): GraphSettings {
    const read = (index: number, fallback: number) => {
        const value = parseFloat(answers?.[index] ?? "");
        return Number.isFinite(value) ? value : fallback;
    };

    const settings: GraphSettings = {
        xMin: read(0, DEFAULT_GRAPH.xMin),
        xMax: read(1, DEFAULT_GRAPH.xMax),
        yMin: read(2, DEFAULT_GRAPH.yMin),
        yMax: read(3, DEFAULT_GRAPH.yMax),
        step: read(4, DEFAULT_GRAPH.step),
        tolerance: read(5, DEFAULT_GRAPH.tolerance),
    };

    // Bornes incohérentes : on retombe sur le repère par défaut plutôt que de
    // produire une grille impossible à afficher.
    if (settings.xMax <= settings.xMin) {
        settings.xMin = DEFAULT_GRAPH.xMin;
        settings.xMax = DEFAULT_GRAPH.xMax;
    }
    if (settings.yMax <= settings.yMin) {
        settings.yMin = DEFAULT_GRAPH.yMin;
        settings.yMax = DEFAULT_GRAPH.yMax;
    }
    if (settings.step <= 0) settings.step = DEFAULT_GRAPH.step;
    if (settings.tolerance < 0) settings.tolerance = DEFAULT_GRAPH.tolerance;

    return settings;
}

export function parseGraphPoints(raw: any): GraphPoint[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

/**
 * Tous les points attendus sont-ils placés, à la tolérance près ?
 *
 * L'ordre n'a pas d'importance — placer les points d'une courbe de droite à
 * gauche reste juste — mais chaque point attendu doit être couvert par un
 * point distinct : un appariement un pour un, sans réutilisation.
 */
export function graphMatches(userAnswer: any, correctAnswer: any, tolerance: number): boolean {
    const expected = parseGraphPoints(correctAnswer);
    const given = parseGraphPoints(userAnswer);

    if (expected.length === 0) return false;
    if (given.length !== expected.length) return false;

    const used = new Set<number>();

    return expected.every((target) => {
        const matchIndex = given.findIndex(
            (point, index) =>
                !used.has(index) &&
                Math.abs(point.x - target.x) <= tolerance &&
                Math.abs(point.y - target.y) <= tolerance
        );

        if (matchIndex === -1) return false;
        used.add(matchIndex);
        return true;
    });
}
