/**
 * Logique SEO partagée pour les cours Workyt.
 * Utilisée par :
 *  - l'assistant SEO de l'éditeur de cours (dashboard gestion, onglet SEO)
 *  - l'audit SEO global (/api/courses/seo-audit)
 *
 * Les critères suivent les bonnes pratiques Google :
 * title ~40-65 caractères, meta description ~120-160, image OG,
 * contenu suffisant, mot-clé (matière) dans titre + description, E-E-A-T.
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
    const nTitle = normalize(title);
    const nDesc = normalize(description);
    const nMatiere = normalize(input.matiere || '');
    const nNiveau = normalize(input.niveau || '');

    // 1. Longueur du titre (affichage Google : ~50-60 caractères)
    checks.push({
        id: 'title-length',
        label: 'Longueur du titre',
        status:
            titleLen >= 40 && titleLen <= 65
                ? 'ok'
                : (titleLen >= 30 && titleLen < 40) || (titleLen > 65 && titleLen <= 75)
                  ? 'warning'
                  : 'error',
        advice:
            titleLen < 40
                ? `Titre trop court (${titleLen} car.). Visez 40-65 caractères, ex : "${title} — ${input.matiere} ${input.niveau}".`
                : titleLen > 65
                  ? `Titre trop long (${titleLen} car.), il sera coupé dans Google. Visez 40-65 caractères.`
                  : `Titre optimal (${titleLen} caractères).`,
        weight: 15,
    });

    // 2. Mot-clé (matière) dans le titre
    const matiereInTitle = nMatiere.length > 0 && nTitle.includes(nMatiere);
    checks.push({
        id: 'title-keyword',
        label: 'Matière dans le titre',
        status: matiereInTitle ? 'ok' : 'warning',
        advice: matiereInTitle
            ? 'La matière apparaît dans le titre.'
            : `Ajoutez "${input.matiere}" dans le titre : c'est le mot-clé principal recherché par les élèves.`,
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

    // 4. Mot-clé dans la description
    const matiereInDesc = nMatiere.length > 0 && nDesc.includes(nMatiere);
    checks.push({
        id: 'description-keyword',
        label: 'Matière dans la description',
        status: matiereInDesc ? 'ok' : 'warning',
        advice: matiereInDesc
            ? 'La matière apparaît dans la description.'
            : `Citez "${input.matiere}" dans la description pour renforcer la pertinence.`,
        weight: 10,
    });

    // 5. Niveau scolaire dans titre ou description
    const niveauPresent =
        nNiveau.length > 0 && (nTitle.includes(nNiveau) || nDesc.includes(nNiveau));
    checks.push({
        id: 'niveau-keyword',
        label: 'Niveau scolaire mentionné',
        status: niveauPresent ? 'ok' : 'warning',
        advice: niveauPresent
            ? 'Le niveau scolaire est mentionné.'
            : `Mentionnez "${input.niveau}" dans le titre ou la description : les élèves cherchent "cours X ${input.niveau}".`,
        weight: 5,
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
