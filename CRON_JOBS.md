# Tâches planifiées (cron externe)

Le site ne programme plus ses tâches lui-même (plus de `node-cron`) : la
plateforme d’hébergement lance une commande `curl` à l’heure voulue, ce qui
réveille le site et exécute la tâche. Voir `src/app/api/cron/[job]/route.ts`.

Remplacer `<CRON_SECRET>` par la valeur de `CRON_SECRET` (variables du site) :
le cron de la plateforme ne voit pas les variables du site.

⚠️ Toujours garder `-A "workyt-cron"` : l'hébergeur bannit automatiquement l'IP
de toute requête dont l'identifiant (User-Agent) est « curl ». Et ne jamais
lancer ces commandes depuis un poste personnel.

## Les 7 tâches à créer

Horaires pour une plateforme en **UTC+2** (heure de Paris l'été). Ils restent
justes l'hiver (Paris = UTC+1) : ils tombent alors une heure plus tôt en heure
de Paris, toujours du bon côté de minuit. Ne pas les changer au changement d'heure.

| Tâche | Horaire | Commande |
|---|---|---|
| Newsletter (mercredi matin, toutes les 15 min) | `*/15 8-11 * * 3` | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/newsletter` |
| Évaluations expirées | `* * * * *` (ou `*/5 * * * *`) | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/evaluations` |
| Clans : formation (lundi) | `5 1 * * 1` | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/clans-formation` |
| Clans : journée (chaque nuit) | `1 1 * * *` | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/clans-jour` |
| Clans : semaine (dimanche soir) | `50 23 * * 0` | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/clans-semaine` |
| Suivi : quotidien | `0 9 * * *` | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/suivi-jour` |
| Suivi : semaine (lundi) | `20 1 * * 1` | `curl -fsS -A "workyt-cron" -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/suivi-semaine` |

Format de l'horaire : `minute heure jour-du-mois mois jour-de-semaine`
(0 = dimanche, 1 = lundi, 3 = mercredi).

La commande affiche le code HTTP et échoue (la plateforme le signale) si le site
répond une erreur. Réponses : `200` fait, `401` mauvais secret, `500` erreur pendant la tâche.

Toutes les tâches supportent un appel en trop : rien n'est fait deux fois.

## Tester à la main

Dans le panneau de la plateforme (pas depuis un poste personnel), lancer la
tâche `evaluations` : elle doit répondre `200` avec `{"success":true,...}`.
