import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CurriculumNode from '@/models/CurriculumNode';
import StudentAcademicProfile from '@/models/StudentAcademicProfile';
import authMiddleware from '@/middlewares/authMiddleware';

// Matières du tronc commun lycée (2nde + 1ère/Term)
const LYCEE_TRONC_COMMUN = [
    'mathematiques', 'francais', 'histoire-geographie',
    'langues-vivantes', 'eps', 'enseignement-scientifique',
    'emc', 'philosophie',
];

// Matières collège par cycle
const COLLEGE_SUBJECTS: Record<string, string[]> = {
    cycle3: [
        'mathematiques', 'francais', 'histoire-geographie',
        'sciences-et-technologie', 'langues-vivantes',
        'arts-plastiques', 'education-musicale', 'eps',
    ],
    cycle4: [
        'mathematiques', 'francais', 'histoire-geographie',
        'physique-chimie', 'svt', 'technologie',
        'langues-vivantes', 'arts-plastiques',
        'education-musicale', 'eps',
    ],
};

/**
 * GET /api/curriculum/subjects
 * Retourne les matières pertinentes pour l'utilisateur connecté,
 * selon son profil académique.
 *
 * - Collège : toutes les matières du cycle
 * - Lycée 2nde : tronc commun
 * - Lycée 1ère/Term générale : tronc commun + spécialités choisies
 * - Lycée techno/pro : matières liées à la série/filière
 * - Supérieur : matières des CurriculumNodes correspondant au track
 *
 * Fallback : si pas de profil ou pas de données, retourne les matières
 * distinctes de tous les CurriculumNodes (comportement actuel).
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const profile = await StudentAcademicProfile.findOne({ userId: user._id }).lean();

        // Sans profil → retourne toutes les matières disponibles dans la BDD
        if (!profile || !profile.cycle || !profile.currentGrade) {
            const allSubjects = await CurriculumNode.distinct('subject');
            return NextResponse.json({
                subjects: allSubjects.sort(),
                source: 'all',
            });
        }

        const { cycle, currentGrade, track, specialities } = profile;

        // Collège : matières statiques du cycle
        if (cycle === 'cycle3' || cycle === 'cycle4') {
            const staticSubjects = COLLEGE_SUBJECTS[cycle] || [];
            // Aussi chercher dans la BDD au cas où il y a des matières importées supplémentaires
            const dbSubjects = await CurriculumNode.distinct('subject', { cycle });
            const merged = [...new Set([...staticSubjects, ...dbSubjects])].sort();
            return NextResponse.json({
                subjects: merged,
                source: 'cycle',
                cycle,
            });
        }

        // Lycée
        if (cycle === 'lycee') {
            let subjects: string[] = [...LYCEE_TRONC_COMMUN];

            // 2nde : tronc commun seulement
            if (currentGrade === '2nde') {
                const dbSubjects = await CurriculumNode.distinct('subject', {
                    cycle: 'lycee',
                    level: '2nde',
                });
                subjects = [...new Set([...subjects, ...dbSubjects])].sort();
                return NextResponse.json({
                    subjects,
                    source: 'lycee-2nde',
                });
            }

            // 1ère/Term générale : tronc commun + spécialités choisies
            if (track === 'generale' && specialities && specialities.length > 0) {
                subjects = [...subjects, ...specialities];
                // Chercher aussi dans la BDD les matières importées pour ces spé
                const dbSubjects = await CurriculumNode.distinct('subject', {
                    cycle: 'lycee',
                    level: { $in: ['1ere', 'terminale', currentGrade] },
                    $or: [
                        { track: 'generale' },
                        { track: { $exists: false } },
                        { subject: { $in: specialities } },
                    ],
                });
                subjects = [...new Set([...subjects, ...dbSubjects])].sort();
                return NextResponse.json({
                    subjects,
                    source: 'lycee-generale',
                    specialities,
                });
            }

            // Lycée techno/pro : tronc commun + matières du track dans la BDD
            if (track === 'technologique' || track === 'professionnelle') {
                const trackValue = specialities?.[0]; // La série est stockée dans specialities[0]
                if (trackValue) {
                    const dbSubjects = await CurriculumNode.distinct('subject', {
                        cycle: 'lycee',
                        $or: [
                            { track: trackValue },
                            { track: track },
                            { level: currentGrade, track: { $exists: false } },
                        ],
                    });
                    subjects = [...new Set([...subjects, ...dbSubjects])].sort();
                }
                return NextResponse.json({
                    subjects,
                    source: `lycee-${track}`,
                });
            }

            // Lycée sans track précis : tout le lycée
            const dbSubjects = await CurriculumNode.distinct('subject', { cycle: 'lycee' });
            subjects = [...new Set([...subjects, ...dbSubjects])].sort();
            return NextResponse.json({
                subjects,
                source: 'lycee-all',
            });
        }

        // Études supérieures : UNIQUEMENT les matières correspondant au track de l'étudiant
        if (cycle === 'superieur') {
            const filter: Record<string, any> = { cycle: 'superieur' };

            if (track) {
                // Chercher les matières pour ce track spécifique
                filter.track = track;
            }

            const dbSubjects = await CurriculumNode.distinct('subject', filter);

            // Si aucune matière trouvée pour ce track, élargir la recherche au level
            if (dbSubjects.length === 0 && currentGrade) {
                const fallbackSubjects = await CurriculumNode.distinct('subject', {
                    cycle: 'superieur',
                    level: currentGrade,
                });
                return NextResponse.json({
                    subjects: fallbackSubjects.sort(),
                    source: 'superieur-level-fallback',
                    track,
                    level: currentGrade,
                });
            }

            return NextResponse.json({
                subjects: dbSubjects.sort(),
                source: 'superieur-track',
                track,
            });
        }

        // Fallback général
        const allSubjects = await CurriculumNode.distinct('subject');
        return NextResponse.json({
            subjects: allSubjects.sort(),
            source: 'fallback',
        });
    } catch (error: any) {
        if (error.code === 'JWT_EXPIRED') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Erreur GET /api/curriculum/subjects:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
