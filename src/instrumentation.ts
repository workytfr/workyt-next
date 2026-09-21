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

        // ---- Guerre des Clans ----
        // Lundi 00h05 : formation des clans de la semaine.
        // 5 minutes après minuit pour laisser passer la résolution du dimanche.
        const { formClans } = await import('@/lib/clanService');
        cron.default.schedule('5 0 * * 1', async () => {
            try {
                const r = await formClans();
                console.log('[Clans] Formation :', r);
            } catch (error) {
                console.error('[Clans] Erreur formation:', error);
            }
        }, { timezone: 'Europe/Paris' });

        // Chaque jour à 00h01 : résolution de la journée écoulée.
        // Idempotent — l'index unique {clan, day} protège d'un double passage.
        const { resolveDay } = await import('@/lib/clanResolution');
        cron.default.schedule('1 0 * * *', async () => {
            try {
                const r = await resolveDay();
                if (r.resolved) console.log(`[Clans] Journée ${r.day} résolue — ${r.pairs} affrontement(s)`);
            } catch (error) {
                console.error('[Clans] Erreur résolution:', error);
            }
        }, { timezone: 'Europe/Paris' });

        // Dimanche 23h50 : dernière journée PUIS bilan de la semaine.
        // ⚠️ L'ordre est impératif. Le passage quotidien de 00h01 résout la
        // veille : dimanche 00h01 il traite samedi (jour 6). Le jour 7 —
        // dimanche lui-même — n'a donc jamais son passage. On le résout ici,
        // avant le bilan, sinon la dernière journée ne compterait pour personne.
        const { resolveWeek } = await import('@/lib/clanWeekly');
        cron.default.schedule('50 23 * * 0', async () => {
            try {
                const d = await resolveDay();
                console.log('[Clans] Jour 7 :', d);
                const r = await resolveWeek();
                console.log('[Clans] Semaine résolue :', r);
            } catch (error) {
                console.error('[Clans] Erreur résolution hebdomadaire:', error);
            }
        }, { timezone: 'Europe/Paris' });

        console.log('[Clans] Crons programmés : formation lundi 00h05, résolution quotidienne 00h01, bilan dimanche 23h50');

        // ---- Suivi personnalisé ----
        // Chaque jour à 9h : alertes de file, relais automatique, rappels,
        // points d'étape. 9h plutôt que minuit : les notifications arrivent
        // à une heure où l'on peut y répondre.
        const { runMentorshipDaily, runMentorshipWeekly } = await import('@/lib/cron/mentorship');
        cron.default.schedule('0 9 * * *', async () => {
            try {
                const r = await runMentorshipDaily();
                console.log('[Suivi] Passage quotidien :', r);
            } catch (error) {
                console.error('[Suivi] Erreur passage quotidien:', error);
            }
        }, { timezone: 'Europe/Paris' });

        // Lundi 00h20 : série du binôme pour la semaine écoulée (idempotent).
        cron.default.schedule('20 0 * * 1', async () => {
            try {
                const r = await runMentorshipWeekly();
                console.log('[Suivi] Séries des binômes :', r);
            } catch (error) {
                console.error('[Suivi] Erreur séries des binômes:', error);
            }
        }, { timezone: 'Europe/Paris' });

        console.log('[Suivi] Crons programmés : relances quotidiennes 9h, séries du binôme lundi 00h20');

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
