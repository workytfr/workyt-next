import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CurriculumNode from '@/models/CurriculumNode';

/**
 * GET /api/curriculum/skills/search?q=calcul&cycle=cycle4&subject=mathematiques
 * Recherche de compétences par texte, avec filtres optionnels.
 * Retourne les skills regroupés par theme > chapter pour un affichage clair.
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') || '';
        const cycle = searchParams.get('cycle');
        const level = searchParams.get('level');
        const subject = searchParams.get('subject');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

        const filter: Record<string, any> = {};
        if (cycle) filter.cycle = cycle;
        if (level) filter.level = level;
        if (subject) filter.subject = subject;

        // Si pas de recherche textuelle, retourne les premiers résultats filtrés
        const nodes = await CurriculumNode.find(filter)
            .select('nodeId cycle level subject theme chapter skills')
            .sort({ order: 1 })
            .lean();

        // Aplatir les skills et filtrer par texte
        const qLower = q.toLowerCase();
        const results: {
            skillId: string;
            description: string;
            difficulty: number;
            keywords: string[];
            nodeId: string;
            theme: string;
            chapter: string;
            subject: string;
            cycle: string;
            level: string;
        }[] = [];

        for (const node of nodes) {
            for (const skill of node.skills) {
                if (q) {
                    const matches =
                        skill.description.toLowerCase().includes(qLower) ||
                        skill.skillId.toLowerCase().includes(qLower) ||
                        skill.keywords.some((k: string) => k.toLowerCase().includes(qLower)) ||
                        node.theme.toLowerCase().includes(qLower) ||
                        node.chapter.toLowerCase().includes(qLower);
                    if (!matches) continue;
                }

                results.push({
                    skillId: skill.skillId,
                    description: skill.description,
                    difficulty: skill.difficulty,
                    keywords: skill.keywords,
                    nodeId: node.nodeId,
                    theme: node.theme,
                    chapter: node.chapter,
                    subject: node.subject,
                    cycle: node.cycle,
                    level: node.level,
                });

                if (results.length >= limit) break;
            }
            if (results.length >= limit) break;
        }

        // Grouper par theme > chapter pour l'affichage
        const grouped: Record<string, {
            theme: string;
            chapters: Record<string, {
                chapter: string;
                skills: typeof results;
            }>;
        }> = {};

        for (const r of results) {
            if (!grouped[r.theme]) {
                grouped[r.theme] = { theme: r.theme, chapters: {} };
            }
            if (!grouped[r.theme].chapters[r.chapter]) {
                grouped[r.theme].chapters[r.chapter] = { chapter: r.chapter, skills: [] };
            }
            grouped[r.theme].chapters[r.chapter].skills.push(r);
        }

        return NextResponse.json({
            results,
            grouped,
            total: results.length,
        });
    } catch (error: any) {
        console.error('Erreur GET /api/curriculum/skills/search:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
