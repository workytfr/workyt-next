import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CompetencyProgress from '@/models/CompetencyProgress';
import CurriculumNode from '@/models/CurriculumNode';
import authMiddleware from '@/middlewares/authMiddleware';

/**
 * POST /api/competencies/record
 * Enregistre une tentative (quiz, exercice, auto-évaluation) sur une compétence
 *
 * Body: { skillId, score, source, sourceId? }
 */
export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        await connectDB();

        const { skillId, score, source, sourceId } = await req.json();

        if (!skillId || score === undefined || !source) {
            return NextResponse.json(
                { error: 'Champs requis: skillId, score, source' },
                { status: 400 }
            );
        }

        if (score < 0 || score > 100) {
            return NextResponse.json(
                { error: 'Le score doit être entre 0 et 100' },
                { status: 400 }
            );
        }

        // Trouver le noeud contenant cette compétence
        const node = await CurriculumNode.findOne({ 'skills.skillId': skillId }).lean();
        if (!node) {
            return NextResponse.json(
                { error: `Compétence "${skillId}" non trouvée dans le programme` },
                { status: 404 }
            );
        }

        // Trouver ou créer la progression
        let progress = await CompetencyProgress.findOne({
            userId: user._id,
            skillId,
        });

        if (!progress) {
            progress = new CompetencyProgress({
                userId: user._id,
                curriculumNodeId: node._id,
                skillId,
            });
        }

        // Ajouter la tentative
        progress.attempts.push({
            date: new Date(),
            score,
            source,
            sourceId: sourceId || undefined,
        });

        // Mettre à jour les scores
        progress.lastScore = score;
        if (score > progress.bestScore) {
            progress.bestScore = score;
        }

        // Mettre à jour les données de révision
        progress.revisionCount += 1;
        progress.lastReviewed = new Date();

        // Monter le niveau SRS si score >= 60
        if (score >= 60 && progress.srsLevel < 5) {
            progress.srsLevel += 1;
        } else if (score < 40 && progress.srsLevel > 0) {
            // Redescendre si échec
            progress.srsLevel = Math.max(0, progress.srsLevel - 2);
        }

        // Le statut est recalculé automatiquement dans le pre-save hook
        await progress.save();

        return NextResponse.json({
            skillId,
            status: progress.status,
            bestScore: progress.bestScore,
            lastScore: progress.lastScore,
            revisionCount: progress.revisionCount,
            srsLevel: progress.srsLevel,
            nextReview: progress.nextReview,
        });
    } catch (error: any) {
        if (error.code === 'JWT_EXPIRED') {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Erreur POST /api/competencies/record:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
