/**
 * Logique SEO partagée pour les cours Workyt.
 * Utilisée par :
 *  - l'assistant SEO de l'éditeur de cours (dashboard gestion, onglet SEO)
 *  - l'audit SEO global (/api/courses/seo-audit)
 *
 * Les critères suivent les bonnes pratiques Google :
 * le titre Google est composé automatiquement par Workyt
 * ("<Titre> - Cours <Matière> <Niveau> | Workyt"), donc on évalue la
 * longueur du titre FINAL, la meta description ~120-160, l'image OG,
 * le contenu, et les signaux de confiance (E-E-A-T).
 */

export interface SeoCheckInput {
    title: string;
    description: string;
    image?: string | null;
    matiere: string;
    niveau: string;
    status: string;
    verifiedBy?: unknown;
    sectionsCount: number;
    lessonsCount: number;
}

export type SeoCheckStatus = 'ok' | 'warning' | 'error';

export interface SeoCheck {
    id: string;
    label: string;
    status: SeoCheckStatus;
    advice: string;
    weight: number;
}

export interface SeoAuditResult {
    score: number; // 0-100
    checks: SeoCheck[];
}

function normalize(text: string): string {
    return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function auditCourseSeo(input: SeoCheckInput): SeoAuditResult {
    const checks: SeoCheck[] = [];
    const title = (input.title || '').trim();
    const description = (input.description || '').trim();
    const titleLen = title.length;
    const descLen = description.length;
    const nDesc = normalize(description);
    const nMatiere = normalize(input.matiere || '');

    // Le titre vu par Google est composé automatiquement par Workyt :
    // "<Titre du cours> - Cours <Matière> <Niveau> | Workyt"
    // Le rédacteur n'a donc PAS besoin d'y mettre la matière ou le niveau :
    // son titre doit être court et clair pour laisser de la place au suffixe.
    const googleSuffix = ` - Cours ${input.matiere} ${input.niveau} | Workyt`;
    const googleTitleLen = titleLen + googleSuffix.length;

    // 1. Longueur du titre Google final (affichage Google : ~60-65 caractères)
    checks.push({
        id: 'title-length',
        label: 'Longueur du titre (Google)',
        status:
            titleLen >= 15 && googleTitleLen <= 65
                ? 'ok'
                : (titleLen >= 8 && titleLen < 15) || (googleTitleLen > 65 && googleTitleLen <= 75)
                  ? 'warning'
                  : 'error',
        advice:
            googleTitleLen > 65
                ? `Le titre Google complet fera ${googleTitleLen} car. ("${title}${googleSuffix}") et sera coupé. Raccourcissez le titre du cours — la matière et le niveau sont ajoutés automatiquement.`
                : titleLen < 15
                  ? `Titre très court (${titleLen} car.). Soyez plus précis, ex : "Les fractions — additions et comparaisons".`
                  : `Titre optimal : ${googleTitleLen} caractères au total dans Google (matière et niveau ajoutés automatiquement).`,
        weight: 15,
    });

    // 2. Titre spécifique (pas un titre générique dupliqué partout)
    const genericTitles = ['cours', 'lecon', 'leçon', 'chapitre', 'maths', 'mathematiques', 'nouveau cours'];
    const isGeneric =
        titleLen === 0 || genericTitles.includes(normalize(title));
    checks.push({
        id: 'title-specific',
        label: 'Titre précis et descriptif',
        status: titleLen === 0 ? 'error' : isGeneric ? 'error' : titleLen < 8 ? 'warning' : 'ok',
        advice:
            titleLen === 0
                ? 'Aucun titre : impossible de référencer le cours.'
                : isGeneric
                  ? 'Titre trop générique : Google ne saura pas le distinguer des autres. Mettez la notion exacte, ex : "Théorème de Pythagore".'
                  : titleLen < 8
                    ? 'Titre très court : précisez la notion exacte couverte.'
                    : 'Le titre décrit précisément la notion du cours.',
        weight: 10,
    });

    // 3. Meta description (c'est elle qui s'affiche sous le titre dans Google)
    checks.push({
        id: 'description-length',
        label: 'Description (meta Google)',
        status:
            descLen >= 120 && descLen <= 160
                ? 'ok'
                : descLen === 0
                  ? 'error'
                  : (descLen >= 80 && descLen < 120) || (descLen > 160 && descLen <= 220)
                    ? 'warning'
                    : 'error',
        advice:
            descLen === 0
                ? 'Aucune description : Google affichera un extrait aléatoire. Rédigez 120-160 caractères.'
                : descLen < 120
                  ? `Description courte (${descLen} car.). Visez 120-160 caractères avec les notions clés du cours.`
                  : descLen > 160
                    ? `Description longue (${descLen} car.), elle sera coupée. Visez 120-160 caractères.`
                    : `Description optimale (${descLen} caractères).`,
        weight: 20,
    });

    // 4. Mot-clé dans la description (la matière est déjà dans le titre
    // automatique : ici c'est pour renforcer le snippet sous le titre Google)
    const matiereInDesc = nMatiere.length > 0 && nDesc.includes(nMatiere);
    checks.push({
        id: 'description-keyword',
        label: 'Matière dans la description',
        status: matiereInDesc ? 'ok' : 'warning',
        advice: matiereInDesc
            ? 'La matière apparaît dans la description.'
            : `Citez "${input.matiere}" dans la description pour renforcer la pertinence du résumé Google.`,
        weight: 15,
    });

    // 6. Image de couverture (Open Graph + rich results)
    checks.push({
        id: 'image',
        label: 'Image de couverture',
        status: input.image ? 'ok' : 'error',
        advice: input.image
            ? 'Image présente (partages sociaux et rich results).'
            : 'Ajoutez une image de couverture : elle apparaît dans les partages et améliore le taux de clic.',
        weight: 15,
    });

    // 7. Structure : au moins 3 sections
    checks.push({
        id: 'sections',
        label: 'Structure du cours',
        status:
            input.sectionsCount >= 3
                ? 'ok'
                : input.sectionsCount >= 1
                  ? 'warning'
                  : 'error',
        advice:
            input.sectionsCount >= 3
                ? `${input.sectionsCount} sections : bonne structure.`
                : input.sectionsCount >= 1
                  ? `Seulement ${input.sectionsCount} section(s). Visez au moins 3 sections pour un cours bien structuré.`
                  : 'Aucune section : un cours vide ne se référencera pas.',
        weight: 10,
    });

    // 8. Contenu : assez de leçons
    checks.push({
        id: 'lessons',
        label: 'Quantité de contenu',
        status:
            input.lessonsCount >= input.sectionsCount * 2
                ? 'ok'
                : input.lessonsCount >= 1
                  ? 'warning'
                  : 'error',
        advice:
            input.lessonsCount >= input.sectionsCount * 2
                ? `${input.lessonsCount} leçons : contenu riche.`
                : input.lessonsCount >= 1
                  ? `${input.lessonsCount} leçon(s) : étoffez le cours (visez ~2 leçons par section).`
                  : 'Aucune leçon : ajoutez du contenu avant de publier.',
        weight: 10,
    });

    // 9. E-E-A-T : cours publié et vérifié par un correcteur
    const isPublished = input.status === 'publie';
    const isVerified = Boolean(input.verifiedBy);
    checks.push({
        id: 'trust',
        label: 'Confiance (publication + vérification)',
        status: isPublished && isVerified ? 'ok' : isPublished ? 'warning' : 'error',
        advice:
            isPublished && isVerified
                ? 'Cours publié et vérifié par un correcteur : signal de qualité affiché publiquement.'
                : isPublished
                  ? 'Cours publié mais non vérifié : faites-le vérifier par un correcteur (badge "✓ Vérifié par").'
                  : 'Cours non publié : invisible pour Google tant qu’il n’est pas publié.',
        weight: 5,
    });

    // Score pondéré : poids complet si ok, moitié si warning
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const earned = checks.reduce(
        (sum, c) => sum + (c.status === 'ok' ? c.weight : c.status === 'warning' ? c.weight / 2 : 0),
        0
    );
    const score = Math.round((earned / totalWeight) * 100);

    return { score, checks };
}

/** Nombre de problèmes bloquants (error) — utile pour le tri de l'audit global */
export function countSeoErrors(result: SeoAuditResult): number {
    return result.checks.filter((c) => c.status === 'error').length;
}
