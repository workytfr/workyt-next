export async function register() {
    // Le cron ne tourne que cote serveur Node.js (pas dans le edge runtime ni le build)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { sendNewsletterBatch } = await import('@/lib/newsletter/sendBatch');

        // Chaque mercredi a 8h
        // Format: minute heure jour-du-mois mois jour-de-semaine (3 = mercredi)
        cron.default.schedule('0 8 * * 3', async () => {
            console.log(`[Newsletter] Demarrage du batch - ${new Date().toISOString()}`);
            try {
                const result = await sendNewsletterBatch(450);
                console.log(`[Newsletter] Resultat:`, {
                    envoyes: result.sent,
                    ignores: result.skipped,
                    erreurs: result.errors,
                    termine: result.completed,
                });
            } catch (error) {
                console.error(`[Newsletter] Erreur:`, error);
            }
        }, {
            timezone: 'Europe/Paris',
        });

        console.log('[Newsletter] Cron programme : chaque mercredi a 8h, timezone Europe/Paris');

        // Vérification des évaluations expirées (timeout) — toutes les minutes
        const { checkEvaluationTimeouts } = await import('@/lib/cron/evaluationTimeout');
        cron.default.schedule('* * * * *', async () => {
            try {
                const result = await checkEvaluationTimeouts();
                if (result.processed > 0) {
                    console.log(`[EvalTimeout] ${result.processed} timeout(s) traité(s), ${result.errors} erreur(s)`);
                }
            } catch (error) {
                console.error('[EvalTimeout] Erreur:', error);
            }
        }, {
            timezone: 'Europe/Paris',
        });

        console.log('[EvalTimeout] Cron programme : chaque minute, timezone Europe/Paris');

        // Seed des rôles par défaut
        const { seedRoles } = await import('@/lib/roles');
        try {
            await seedRoles();
            console.log('[Roles] Rôles par défaut vérifiés/créés');
        } catch (error) {
            console.error('[Roles] Erreur seed:', error);
        }
    }
}
