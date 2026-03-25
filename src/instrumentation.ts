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
    }
}
