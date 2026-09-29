# Tâches planifiées (cron externe)

Le site ne programme plus ses tâches lui-même (plus de `node-cron`) : la
plateforme d'hébergement lance une commande `curl` à l'heure voulue, ce qui
réveille le site et exécute la tâche. Voir `src/app/api/cron/[job]/route.ts`.

Remplacer `<CRON_SECRET>` par la valeur de la variable `CRON_SECRET` du site.

## Les 7 tâches à créer

Horaires pour une plateforme en **UTC+2** (heure de Paris l'été). Ils restent
justes l'hiver (Paris = UTC+1) : ils tombent alors une heure plus tôt en heure
de Paris, toujours du bon côté de minuit. Ne pas les changer au changement d'heure.

| Tâche | Horaire | Commande |
|---|---|---|
| Newsletter (mercredi matin, toutes les 15 min) | `*/15 8-11 * * 3` | `curl -fsS --max-time 600 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/newsletter` |
| Évaluations expirées | `* * * * *` (ou `*/5 * * * *`) | `curl -fsS --max-time 120 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/evaluations` |
| Clans : formation (lundi) | `5 1 * * 1` | `curl -fsS --max-time 300 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/clans-formation` |
| Clans : journée (chaque nuit) | `1 1 * * *` | `curl -fsS --max-time 300 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/clans-jour` |
| Clans : semaine (dimanche soir) | `50 23 * * 0` | `curl -fsS --max-time 300 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/clans-semaine` |
| Suivi : quotidien | `0 9 * * *` | `curl -fsS --max-time 300 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/suivi-jour` |
| Suivi : semaine (lundi) | `20 1 * * 1` | `curl -fsS --max-time 300 -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/suivi-semaine` |

Format de l'horaire : `minute heure jour-du-mois mois jour-de-semaine`
(0 = dimanche, 1 = lundi, 3 = mercredi).

`-fsS` : la commande échoue (et la plateforme le signale) si le site répond une
erreur. Réponses : `200` fait, `401` mauvais secret, `500` erreur pendant la tâche.

Toutes les tâches supportent un appel en trop : rien n'est fait deux fois.

## Tester à la main

```sh
curl -i -H "x-cron-secret: <CRON_SECRET>" https://workyt.fr/api/cron/evaluations
```

Doit répondre `200` avec `{"success":true,...}`.
