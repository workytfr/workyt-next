// Helper partagé : compter les dessins (tldraw) embarqués dans le markdown.
// Utilisé uniquement sur le forum pour appliquer le quota et le malus.

// L'éditeur insère les dessins comme `![dessin](url)` avec alt="dessin".
const DRAWING_REGEX = /!\[dessin\]\([^)]+\)/g;

export function countDrawings(markdown: string | null | undefined): number {
    if (!markdown) return 0;
    const matches = markdown.match(DRAWING_REGEX);
    return matches ? matches.length : 0;
}

export function countDrawingsAcross(...markdowns: Array<string | null | undefined>): number {
    return markdowns.reduce((sum: number, md) => sum + countDrawings(md), 0);
}
