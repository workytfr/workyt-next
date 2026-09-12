/**
 * Normalisation des réponses de code avant comparaison.
 *
 * La correction d'une question « Code » était une égalité de chaînes stricte :
 * un espace en trop, une apostrophe droite au lieu d'une typographique, un
 * point-virgule final, et une réponse juste était comptée fausse. Ces règles
 * neutralisent les écarts qui ne changent rien au sens du code, sans jamais
 * toucher à ce qui en change un — la casse et l'ordre des caractères restent
 * significatifs.
 *
 * Ce qui est neutralisé :
 *  - fins de ligne (CRLF / CR → LF) et espaces en fin de ligne ;
 *  - indentation et lignes vides ;
 *  - guillemets typographiques et apostrophes courbes → droits ;
 *  - guillemets simples → doubles (les deux délimitent une chaîne dans la
 *    plupart des langages enseignés) ;
 *  - espaces multiples consécutifs → un seul ;
 *  - point-virgule ou virgule en fin d'expression.
 */

/** Guillemets et apostrophes typographiques vers leurs équivalents ASCII. */
const SMART_QUOTES: Record<string, string> = {
    "‘": "'",
    "’": "'",
    "‚": "'",
    "‛": "'",
    "“": '"',
    "”": '"',
    "„": '"',
    "‟": '"',
    "«": '"',
    "»": '"',
    "′": "'",
    "″": '"',
};

export function normalizeCodeAnswer(value: unknown): string {
    if (value === undefined || value === null) return "";

    let text = String(value);

    // Guillemets typographiques, puis unification simple → double
    text = text.replace(/[‘’‚‛“”„‟«»′″]/g,
        (char) => SMART_QUOTES[char] ?? char);
    text = text.replace(/'/g, '"');

    // Espaces insécables et tabulations comme espaces ordinaires
    text = text.replace(/[  \t]/g, " ");

    const lines = text
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 0)
        // Point-virgule ou virgule terminale : sans effet sur le sens.
        // Retrim ensuite, sinon « return x ; » et « return x; » diffèrent
        // encore par l'espace laissé devant le séparateur.
        .map((line) => line.replace(/[\s;,]+$/, ""));

    return lines.join("\n");
}

/** Les deux réponses de code sont-elles équivalentes ? */
export function codeAnswersMatch(userAnswer: unknown, expected: unknown): boolean {
    const normalizedExpected = normalizeCodeAnswer(expected);
    if (normalizedExpected === "") return false;
    return normalizeCodeAnswer(userAnswer) === normalizedExpected;
}
