/**
 * Webhook Discord pour les notifications d'évaluation
 * Salon Discord : 1489994699992465429
 * Env var : DISCORD_EVALUATION_WEBHOOK_URL
 */

const WEBHOOK_URL = process.env.DISCORD_EVALUATION_WEBHOOK_URL;
const APP_URL = process.env.NEXT_PUBLIC_API_URL || 'https://workyt.fr';

interface SubmissionData {
    studentName: string;
    courseTitle: string;
    evaluationTitle: string;
    evaluationType: string;
    timeSpentMin: number;
    submissionId: string;
    submittedFiles?: string[];
}

interface TimeoutData {
    studentName: string;
    courseTitle: string;
    evaluationTitle: string;
}

interface GradedData {
    studentName: string;
    courseTitle: string;
    evaluationTitle: string;
    grade: number;
    evaluatorName: string;
    photoLinks?: string[];
}

export async function notifyEvaluationDiscord(
    type: 'submission' | 'timeout' | 'graded',
    data: SubmissionData | TimeoutData | GradedData
): Promise<void> {
    if (!WEBHOOK_URL) return;

    const embeds: Record<string, any>[] = [];

    if (type === 'submission') {
        const d = data as SubmissionData;
        const mainEmbed: Record<string, any> = {
            title: '📝 Nouvelle évaluation soumise',
            color: 0x22c55e,
            fields: [
                { name: 'Élève', value: d.studentName, inline: true },
                { name: 'Cours', value: d.courseTitle, inline: true },
                { name: 'Type', value: d.evaluationType === 'form' ? 'Formulaire' : 'PDF', inline: true },
                { name: 'Temps passé', value: `${d.timeSpentMin} min`, inline: true },
                { name: 'Corriger', value: `[Ouvrir la correction](${APP_URL}/dashboard/evaluations/${d.submissionId})` },
            ],
            timestamp: new Date().toISOString(),
        };

        // Ajouter la première image soumise comme thumbnail
        if (d.submittedFiles?.length) {
            mainEmbed.image = { url: d.submittedFiles[0] };
            if (d.submittedFiles.length > 1) {
                mainEmbed.fields.push({
                    name: 'Fichiers joints',
                    value: `${d.submittedFiles.length} fichier(s) soumis`,
                });
            }
        }

        embeds.push(mainEmbed);

        // Ajouter les images supplementaires comme embeds séparés (Discord supporte jusqu'à 10)
        if (d.submittedFiles && d.submittedFiles.length > 1) {
            for (let i = 1; i < Math.min(d.submittedFiles.length, 5); i++) {
                embeds.push({
                    image: { url: d.submittedFiles[i] },
                    color: 0x22c55e,
                });
            }
        }
    } else if (type === 'timeout') {
        const d = data as TimeoutData;
        embeds.push({
            title: '⏰ Évaluation expirée (timeout)',
            color: 0xef4444,
            fields: [
                { name: 'Élève', value: d.studentName, inline: true },
                { name: 'Cours', value: d.courseTitle, inline: true },
                { name: 'Note', value: '0/20 (automatique)', inline: true },
            ],
            timestamp: new Date().toISOString(),
        });
    } else {
        const d = data as GradedData;
        const mainEmbed: Record<string, any> = {
            title: '✅ Évaluation corrigée',
            color: 0x3b82f6,
            fields: [
                { name: 'Élève', value: d.studentName, inline: true },
                { name: 'Cours', value: d.courseTitle, inline: true },
                { name: 'Note', value: `${d.grade}/20`, inline: true },
                { name: 'Correcteur', value: d.evaluatorName, inline: true },
            ],
            timestamp: new Date().toISOString(),
        };

        if (d.photoLinks?.length) {
            mainEmbed.image = { url: d.photoLinks[0] };
        }

        embeds.push(mainEmbed);

        if (d.photoLinks && d.photoLinks.length > 1) {
            for (let i = 1; i < Math.min(d.photoLinks.length, 5); i++) {
                embeds.push({
                    image: { url: d.photoLinks[i] },
                    color: 0x3b82f6,
                });
            }
        }
    }

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds }),
        });
    } catch (error) {
        console.error('[Discord] Erreur webhook évaluation:', error);
    }
}
