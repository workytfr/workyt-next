import CurriculumNode from '@/models/CurriculumNode';
import CompetencyProgress from '@/models/CompetencyProgress';
import mongoose from 'mongoose';

/**
 * Service pour mettre à jour la progression des compétences
 * après un quiz, exercice ou auto-évaluation
 */
export const CompetencyService = {
    /**
     * Met à jour les compétences liées à un quiz après soumission
     * Cherche les CurriculumNode dont linkedContent.quizzes contient le quizId
     * et enregistre le score pour chaque compétence associée
     */
    async recordQuizCompletion(
        userId: string,
        quizId: string,
        scorePercent: number
    ): Promise<{ updated: number; skills: string[] }> {
        try {
            // Trouver tous les noeuds liés à ce quiz
            const nodes = await CurriculumNode.find({
                'linkedContent.quizzes': new mongoose.Types.ObjectId(quizId),
            }).lean();

            if (nodes.length === 0) {
                return { updated: 0, skills: [] };
            }

            const updatedSkills: string[] = [];

            for (const node of nodes) {
                for (const skill of node.skills) {
                    await this.recordAttempt(
                        userId,
                        node._id.toString(),
                        skill.skillId,
                        scorePercent,
                        'quiz',
                        quizId
                    );
                    updatedSkills.push(skill.skillId);
                }
            }

            return { updated: updatedSkills.length, skills: updatedSkills };
        } catch (error) {
            console.error('CompetencyService.recordQuizCompletion error:', error);
            return { updated: 0, skills: [] };
        }
    },

    /**
     * Enregistre une tentative sur une compétence spécifique
     */
    async recordAttempt(
        userId: string,
        curriculumNodeId: string,
        skillId: string,
        score: number,
        source: 'quiz' | 'exercise' | 'self_assessment',
        sourceId?: string
    ): Promise<void> {
        let progress = await CompetencyProgress.findOne({ userId, skillId });

        if (!progress) {
            progress = new CompetencyProgress({
                userId,
                curriculumNodeId,
                skillId,
            });
        }

        // Ajouter la tentative
        progress.attempts.push({
            date: new Date(),
            score,
            source,
            sourceId: sourceId ? new mongoose.Types.ObjectId(sourceId) : undefined,
        } as any);

        // Mettre à jour les scores
        progress.lastScore = score;
        if (score > progress.bestScore) {
            progress.bestScore = score;
        }

        // Mise à jour SRS
        progress.revisionCount += 1;
        progress.lastReviewed = new Date();

        if (score >= 60 && progress.srsLevel < 5) {
            progress.srsLevel += 1;
        } else if (score < 40 && progress.srsLevel > 0) {
            progress.srsLevel = Math.max(0, progress.srsLevel - 2);
        }

        // Le statut est recalculé automatiquement dans le pre-save hook
        await progress.save();
    },
};
