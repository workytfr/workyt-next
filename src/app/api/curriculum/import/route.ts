import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CurriculumNode from '@/models/CurriculumNode';
import { adminAuthMiddleware } from '@/middlewares/authMiddleware';

interface SeedSkill {
    id: string;
    description: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    keywords?: string[];
    prerequisites?: string[];
}

interface SeedChapter {
    name: string;
    subChapter?: string;
    levels?: string[];
    estimatedHours?: number;
    examFrequency?: number;
    order?: number;
    skills: SeedSkill[];
}

interface SeedTheme {
    name: string;
    order: number;
    chapters: SeedChapter[];
}

interface SeedPayload {
    version: string;
    cycle: 'cycle3' | 'cycle4' | 'lycee' | 'superieur';
    level: string | string[];
    subject: string;
    track?: string;
    sourceReference?: string;
    themes: SeedTheme[];
}

/**
 * POST /api/curriculum/import
 * Import en masse de noeuds de programme depuis un JSON structuré (admin seulement)
 * Supporte l'upsert : met à jour les noeuds existants si le nodeId existe déjà
 */
export async function POST(req: NextRequest) {
    try {
        const user = await adminAuthMiddleware(req);
        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const payload: SeedPayload = await req.json();

        // Validation de base
        if (!payload.version || !payload.cycle || !payload.level || !payload.subject || !payload.themes) {
            return NextResponse.json(
                { error: 'Champs requis: version, cycle, level, subject, themes' },
                { status: 400 }
            );
        }

        const levels = Array.isArray(payload.level) ? payload.level : [payload.level];
        const results = { created: 0, updated: 0, errors: [] as string[] };
        let globalOrder = 0;

        for (const theme of payload.themes) {
            for (const chapter of theme.chapters) {
                // Un chapitre peut s'appliquer à plusieurs niveaux
                const chapterLevels = chapter.levels || levels;

                for (const level of chapterLevels) {
                    globalOrder++;
                    // Générer un nodeId unique basé sur la hiérarchie
                    const nodeId = generateNodeId(payload.cycle, payload.subject, theme.name, chapter.name, level);

                    const nodeData = {
                        nodeId,
                        version: payload.version,
                        cycle: payload.cycle,
                        level,
                        track: payload.track,
                        subject: payload.subject,
                        theme: theme.name,
                        chapter: chapter.name,
                        subChapter: chapter.subChapter,
                        skills: chapter.skills.map(s => ({
                            skillId: s.id,
                            description: s.description,
                            difficulty: s.difficulty || 2,
                            keywords: s.keywords || [],
                        })),
                        estimatedHours: chapter.estimatedHours || 0,
                        order: chapter.order ?? globalOrder,
                        prerequisites: chapter.skills.flatMap(s => s.prerequisites || []),
                        examFrequency: chapter.examFrequency || 0,
                        sourceReference: payload.sourceReference,
                    };

                    try {
                        const existing = await CurriculumNode.findOne({ nodeId });
                        if (existing) {
                            await CurriculumNode.updateOne({ nodeId }, { $set: nodeData });
                            results.updated++;
                        } else {
                            await CurriculumNode.create(nodeData);
                            results.created++;
                        }
                    } catch (err: any) {
                        results.errors.push(`${nodeId}: ${err.message}`);
                    }
                }
            }
        }

        return NextResponse.json({
            message: 'Import terminé',
            ...results,
        });
    } catch (error: any) {
        console.error('Erreur POST /api/curriculum/import:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Génère un nodeId unique à partir de la hiérarchie
 * Ex: "C4-MATH-nombres_et_calculs-calcul_litteral-3eme"
 */
function generateNodeId(cycle: string, subject: string, theme: string, chapter: string, level: string): string {
    const normalize = (s: string) =>
        s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

    const cycleCode = cycle === 'cycle3' ? 'C3' : cycle === 'cycle4' ? 'C4' : cycle === 'lycee' ? 'LYC' : 'SUP';
    return `${cycleCode}-${normalize(subject)}-${normalize(theme)}-${normalize(chapter)}-${normalize(level)}`;
}
