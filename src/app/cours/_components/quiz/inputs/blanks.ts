/**
 * Outils communs aux questions à trous (« Texte à trous » et « Code »).
 * Les deux partagent le même gabarit : un texte où chaque `{{blank}}` marque
 * un champ à compléter.
 */

const BLANK_MARKER = /\{\{blank\}\}/g;

export interface ParsedTemplate {
    /** Segments de texte entre les trous (toujours `blankCount + 1` éléments). */
    parts: string[];
    /** Nombre de trous à compléter. */
    blankCount: number;
}

export function parseTemplate(template: string): ParsedTemplate {
    const blankCount = (template.match(BLANK_MARKER) || []).length;
    return { parts: template.split("{{blank}}"), blankCount };
}

/**
 * Normalise la valeur courante en tableau de la bonne longueur.
 * Le lecteur transmet une chaîne quand il n'y a qu'un trou et un tableau
 * au-delà : cette fonction absorbe les deux formes.
 */
export function toBlankValues(value: any, blankCount: number): string[] {
    if (Array.isArray(value)) {
        const filled = [...value];
        filled.length = blankCount;
        return Array.from(filled, (v) => v ?? "");
    }

    const single = typeof value === "string" ? value : "";
    return Array.from({ length: blankCount }, (_, i) => (i === 0 ? single : ""));
}

/** Largeur du champ ajustée au contenu saisi. */
export function blankWidth(value: string, minimum: number): string {
    return `${Math.max(minimum, value.length * 9 + 20)}px`;
}
