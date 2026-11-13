/**
 * Foxy, la mascotte de Workyt, en illustration (fichiers dans public/foxy/).
 * Chaque pose porte un objet qu'on reconnaît d'un coup d'œil :
 *   bonjour        accueil, inscription
 *   lecture        cours, reprise de lecture
 *   fiche-validee  fiche publiée ou certifiée
 *   reflechit      quiz, chargement, question sans réponse
 *   bravo          bonne réponse, quiz réussi, badge
 *   cherche        recherche, forum, aucun résultat
 *   diplome        cours terminé, certificat, évaluation réussie
 *   serie          série de jours
 *   points         points reçus, récompense
 *   pause          liste vide, rien à afficher
 *   oups           erreur, page introuvable, mauvaise réponse
 * Sans hook : utilisable en composant serveur comme client.
 */

export const FOXY_POSES = [
    "bonjour",
    "lecture",
    "fiche-validee",
    "reflechit",
    "bravo",
    "cherche",
    "diplome",
    "serie",
    "points",
    "pause",
    "oups",
] as const;

export type FoxyPose = (typeof FOXY_POSES)[number];

const ALT: Record<FoxyPose, string> = {
    bonjour: "Foxy fait coucou",
    lecture: "Foxy lit un livre",
    "fiche-validee": "Foxy montre une fiche validée",
    reflechit: "Foxy réfléchit",
    bravo: "Foxy fête sa réussite",
    cherche: "Foxy cherche avec une loupe",
    diplome: "Foxy en diplômé",
    serie: "Foxy tient une flamme",
    points: "Foxy brandit une pièce",
    pause: "Foxy fait une sieste",
    oups: "Foxy est embêté",
};

export default function Foxy({
    pose,
    size = 160,
    className = "",
    decorative = true,
    eager = false,
}: {
    pose: FoxyPose;
    /** Largeur en pixels (la hauteur suit). */
    size?: number;
    className?: string;
    /** true quand le texte autour dit déjà tout (alt vide). */
    decorative?: boolean;
    /** true quand Foxy est visible dès l'arrivée sur la page (pas de chargement différé). */
    eager?: boolean;
}) {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- SVG statique, pas d'optimisation utile
        <img
            src={`/foxy/${pose}.svg`}
            alt={decorative ? "" : ALT[pose]}
            width={size}
            height={Math.round((size * 258) / 252)}
            loading={eager ? "eager" : "lazy"}
            draggable={false}
            className={`select-none ${className}`}
        />
    );
}
