/**
 * Sérialise des données structurées pour un <script type="application/ld+json">.
 *
 * JSON.stringify n'échappe pas « < » : un titre saisi par un utilisateur comme
 * `</script><img src=x onerror=…>` fermait la balise et exécutait du code chez
 * chaque visiteur (XSS stocké). On encode les caractères sensibles en \uXXXX,
 * ce qui reste du JSON valide pour les moteurs de recherche.
 */
export function jsonLd(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}
