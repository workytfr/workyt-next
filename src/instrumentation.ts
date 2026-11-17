/**
 * Au démarrage du serveur.
 *
 * Les tâches planifiées (newsletter, évaluations, clans, suivi) ne sont PLUS
 * programmées ici : le site est gelé quand il est inactif et peut tourner en
 * plusieurs copies, un cron interne y sautait ou doublait des passages. Elles
 * sont déclenchées par le cron externe de l'hébergeur via /api/cron/<tâche>
 * (voir src/app/api/cron/[job]/route.ts et CRON_JOBS.md).
 *
 * IMPORTANT : Next.js attend la fin de `register()` avant de servir la moindre
 * requête, pages statiques comprises. On n'y attend donc JAMAIS la base : le
 * 14/11/2026, une connexion MongoDB bloquée a gardé une instance sans réponse
 * (toutes les requêtes en attente, RAM saturée, redémarrages en boucle).
 * Le seed des rôles part en arrière-plan, avec un délai maximal.
 */
const SEED_TIMEOUT_MS = 30_000;

export async function register() {
    // ⚠️ L'import doit rester DANS ce `if` : webpack compile aussi ce fichier
    // pour l'edge, et seul un bloc conditionnel est éliminé. Avec un
    // `return` anticipé, il embarquait mongoose et `crypto` côté edge, et
    // `next dev` plantait sur toutes les pages (« Can't resolve 'crypto' »).
    if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Volontairement sans `await` : le serveur répond tout de suite.
    void (async () => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            const { seedRoles } = await import('@/lib/roles');
            await Promise.race([
                seedRoles(),
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error(`délai de ${SEED_TIMEOUT_MS / 1000} s dépassé`)), SEED_TIMEOUT_MS);
                }),
            ]);
            console.log('[Roles] Rôles par défaut vérifiés/créés');
        } catch (error) {
            // Sans gravité : les rôles existent déjà en base, le prochain démarrage réessaie.
            console.error('[Roles] Seed non effectué :', error instanceof Error ? error.message : error);
        } finally {
            if (timer) clearTimeout(timer);
        }
    })();
    }
}
