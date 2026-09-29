/**
 * Au démarrage du serveur.
 *
 * Les tâches planifiées (newsletter, évaluations, clans, suivi) ne sont PLUS
 * programmées ici : le site est gelé quand il est inactif et peut tourner en
 * plusieurs copies, un cron interne y sautait ou doublait des passages. Elles
 * sont déclenchées par le cron externe de l'hébergeur via /api/cron/<tâche>
 * (voir src/app/api/cron/[job]/route.ts et CRON_JOBS.md).
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
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
