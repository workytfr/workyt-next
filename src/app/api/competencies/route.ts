import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CompetencyProgress from '@/models/CompetencyProgress';
import CurriculumNode from '@/models/CurriculumNode';
import authMiddleware from '@/middlewares/authMiddleware';

/**
 * GET /api/competencies
 * Retourne la grille de compétences de l'utilisateur connecté
 * Query params: subject, level, cycle
 *
 * Retourne les noeuds du programme avec le statut de progression pour chaque compétence
 */
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const { searchParams } = new URL(req.url);
        const subject = searchParams.get('subject');
        const level = searchParams.get('level');
        const cycle = searchParams.get('cycle');

        if (!subject) {
            return NextResponse.json(
                { error: 'Le paramètre subject est requis' },
                { status: 400 }
            );
        }

        // Filtrer les noeuds du programme
        const nodeFilter: Record<string, string> = { subject };
        if (level) nodeFilter.level = level;
        if (cycle) nodeFilter.cycle = cycle;

        const nodes = await CurriculumNode.find(nodeFilter)
            .sort({ order: 1 })
            .lean();

        // Récupérer toutes les progressions de l'utilisateur pour ces compétences
        const skillIds = nodes.flatMap(n => n.skills.map(s => s.skillId));
        const progressList = await CompetencyProgress.find({
            userId: user._id,
            skillId: { $in: skillIds },
        }).lean();

        // Indexer les progressions par skillId
        const progressMap = new Map(progressList.map(p => [p.skillId, p]));

        // Construire la grille
        const grid = nodes.map(node => {
            const skillsWithProgress = node.skills.map(skill => {
                const progress = progressMap.get(skill.skillId);
                return {
                    skillId: skill.skillId,
                    description: skill.description,
                    difficulty: skill.difficulty,
                    keywords: skill.keywords,
                    // Données de progression
                    status: progress?.status || 'not_started',
                    bestScore: progress?.bestScore || 0,
                    lastScore: progress?.lastScore || 0,
                    revisionCount: progress?.revisionCount || 0,
                    lastReviewed: progress?.lastReviewed || null,
                    nextReview: progress?.nextReview || null,
                    srsLevel: progress?.srsLevel || 0,
                };
            });

            // Stats du chapitre
            const total = skillsWithProgress.length;
            const mastered = skillsWithProgress.filter(s => s.status === 'mastered').length;
            const inProgress = skillsWithProgress.filter(s => s.status === 'in_progress').length;
            const failed = skillsWithProgress.filter(s => s.status === 'failed').length;
            const notStarted = skillsWithProgress.filter(s => s.status === 'not_started').length;

            return {
                nodeId: node.nodeId,
                theme: node.theme,
                chapter: node.chapter,
                subChapter: node.subChapter,
                level: node.level,
                estimatedHours: node.estimatedHours,
                examFrequency: node.examFrequency,
                skills: skillsWithProgress,
                stats: {
                    total,
                    mastered,
                    inProgress,
                    failed,
                    notStarted,
                    completionPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
                },
            };
        });

        // Grouper par thème > chapitre, en dédupliquant les skills par skillId
        // (un même chapitre peut exister pour plusieurs levels, ex: "Fractions" pour 5eme, 4eme, 3eme)
        const themes: Record<string, typeof grid> = {};
        const chapterSeenSkills: Record<string, Set<string>> = {};

        for (const item of grid) {
            if (!themes[item.theme]) themes[item.theme] = [];

            const chapterKey = `${item.theme}::${item.chapter}`;

            if (!chapterSeenSkills[chapterKey]) {
                // Premier node pour ce chapitre — on le garde tel quel
                chapterSeenSkills[chapterKey] = new Set(item.skills.map(s => s.skillId));
                themes[item.theme].push(item);
            } else {
                // Chapitre déjà vu (autre level) — n'ajouter que les skills pas encore vus
                const seen = chapterSeenSkills[chapterKey];
                const newSkills = item.skills.filter(s => !seen.has(s.skillId));
                if (newSkills.length > 0) {
                    // Trouver le chapitre existant et y ajouter les skills
                    const existing = themes[item.theme].find(
                        g => g.theme === item.theme && g.chapter === item.chapter
                    );
                    if (existing) {
                        existing.skills.push(...newSkills);
                        // Recalculer les stats du chapitre
                        const total = existing.skills.length;
                        const mastered = existing.skills.filter(s => s.status === 'mastered').length;
                        const inProgress = existing.skills.filter(s => s.status === 'in_progress').length;
                        const failed = existing.skills.filter(s => s.status === 'failed').length;
                        const notStarted = existing.skills.filter(s => s.status === 'not_started').length;
                        existing.stats = {
                            total, mastered, inProgress, failed, notStarted,
                            completionPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
                        };
                    }
                    for (const s of newSkills) seen.add(s.skillId);
                }
            }
        }

        // Stats globales (basées sur les skills dédupliqués)
        const allChapters = Object.values(themes).flat();
        const totalSkills = allChapters.reduce((acc, g) => acc + g.stats.total, 0);
        const totalMastered = allChapters.reduce((acc, g) => acc + g.stats.mastered, 0);
        const totalInProgress = allChapters.reduce((acc, g) => acc + g.stats.inProgress, 0);
        const totalFailed = allChapters.reduce((acc, g) => acc + g.stats.failed, 0);

        return NextResponse.json({
            subject,
            level: level || 'all',
            cycle: cycle || 'all',
            globalStats: {
                totalSkills,
                mastered: totalMastered,
                inProgress: totalInProgress,
                failed: totalFailed,
                notStarted: totalSkills - totalMastered - totalInProgress - totalFailed,
                completionPercent: totalSkills > 0 ? Math.round((totalMastered / totalSkills) * 100) : 0,
            },
            themes,
        });
    } catch (error: any) {
        if (error.code === 'JWT_EXPIRED') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Erreur GET /api/competencies:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
