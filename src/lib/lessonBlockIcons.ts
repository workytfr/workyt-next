/**
 * Icônes des blocs pédagogiques des leçons (définition, propriété, théorème,
 * remarque, attention, exemple), en SVG texte pour le HTML des leçons.
 * Utilisées par lib/lessonHtml et affichées dans la charte graphique.
 * Les dessins viennent du paquet workyt-icons ; `currentColor` : la couleur
 * vient de la variante CSS du bloc, la taille de .wk-block__icon svg.
 */
import { iAttention, iDefinition, iExemple, iPropriete, iRemarque, iTheoreme, type IconNode, toSvg } from "workyt-icons";

const BLOCKS: Record<string, IconNode> = {
    definition: iDefinition, // une clé : la définition ouvre le sens du mot
    propriete: iPropriete, // un rouage : une règle qui tourne toujours de la même façon
    theoreme: iTheoreme, // un temple : ce qui est démontré tient debout
    remarque: iRemarque, // un œil : ce qu'il faut remarquer
    attention: iAttention, // le « ! » fait d'une feuille et d'un point
    exemple: iExemple, // une ampoule : avec un exemple, l'idée s'allume
};

export function getIconSVG(type: string) {
    return toSvg(BLOCKS[type] ?? [["M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0Z"]]);
}

/** Les types de blocs, dans l'ordre de la charte */
export const LESSON_BLOCK_TYPES = ["definition", "propriete", "theoreme", "remarque", "attention", "exemple"] as const;
