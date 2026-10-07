/**
 * Webhook Discord pour les nouvelles demandes de suivi
 * Même salon que les questions du forum : Env var DISCORD_WEBHOOK_URL
 * Ni nom ni description de l'élève : seulement de quoi intéresser un bénévole.
 */

import { FORMAT_LABELS, GOAL_TYPE_LABELS } from '@/lib/mentorship/config';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const APP_URL = process.env.NEXT_PUBLIC_API_URL || 'https://workyt.fr';

interface RequestData {
    subject: string;
    level: string;
    format: string;
    goalType: string;
    createdAt?: Date;
}

export async function notifySuiviRequestDiscord(d: RequestData): Promise<void> {
    if (!WEBHOOK_URL) return;

    const payload = {
        embeds: [
            {
                title: '🤝 Nouvelle demande de suivi',
                url: `${APP_URL}/suivi`,
                description: 'Un élève cherche un bénévole. Prends sa demande depuis la file d’attente du suivi.',
                fields: [
                    { name: 'Matière', value: d.subject, inline: true },
                    { name: 'Niveau', value: d.level, inline: true },
                    { name: 'Format', value: FORMAT_LABELS[d.format]?.label || d.format, inline: true },
                    { name: 'Objectif', value: GOAL_TYPE_LABELS[d.goalType] || d.goalType, inline: true },
                ],
                timestamp: (d.createdAt || new Date()).toISOString(),
                color: 0xf97316,
            },
        ],
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error('Erreur webhook Discord (suivi):', error);
    }
}
