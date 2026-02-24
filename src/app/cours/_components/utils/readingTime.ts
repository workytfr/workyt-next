/**
 * Estime le temps de lecture en minutes a partir de contenu HTML.
 * Vitesse moyenne de lecture en francais : ~200 mots/minute.
 */
export function estimateReadingTime(htmlContent: string): number {
    if (!htmlContent) return 1;
    // Supprimer les tags HTML
    const text = htmlContent.replace(/<[^>]*>/g, '');
    // Compter les mots
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / 200);
    return Math.max(1, minutes);
}
