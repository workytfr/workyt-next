# Déploiement — Architecture séparée Next (standalone) + microservice Socket.IO

L'hébergeur gère le build Next en `output: "standalone"` (build + start standard,
haute dispo). Socket.IO ne peut plus vivre dans le même process → c'est un
**microservice séparé** déployé sur Pterodactyl, dans le repo **`workyt-socket`**
(`socket-server.mjs`, repo voisin de celui-ci).

## Architecture

```
Navigateur ──/socket.io (ws)──> reverse proxy ──> microservice socket-server.mjs (PORT 3001)
Routes API Next ──/internal/emit (HTTP + secret)──> microservice
Admin dashboard ──/api/admin/realtime-metrics──> Next ──/internal/stats──> microservice
```

- **Next** : build standalone standard, lancé par l'hébergeur (`npm run build` / `next start`).
- **Microservice Socket.IO** : `node socket-server.mjs` — écoute sur `PORT` (défaut `3001`), host `0.0.0.0`.
- **Routage navigateur** : soit same-origin via `workyt.fr/socket.io` (proxy avec
  transmission des en-têtes `Upgrade`/`Connection`), soit URL dédiée
  (`NEXT_PUBLIC_SOCKET_URL` côté client + `SOCKET_CORS_ORIGINS` côté microservice).

## Variables d'environnement

| Variable | Où | Rôle |
|---|---|---|
| `JWT_SECRET` | les deux | Auth des sockets (handshake `auth.token`) |
| `REALTIME_SERVICE_URL` | Next | URL interne du microservice pour émettre (`http://127.0.0.1:3001`) |
| `REALTIME_INTERNAL_SECRET` | les deux | Protège `/internal/emit` et `/internal/stats` |
| `SOCKET_CORS_ORIGINS` | microservice | Origines navigateur autorisées (si URL dédiée) |
| `NEXT_PUBLIC_SOCKET_URL` | Next (public) | URL navigateur du microservice (si pas de routage same-origin) |

## Egg Pterodactyl (microservice)

Le serveur Pterodactyl héberge le repo **`workyt-socket`** (pas celui-ci).
Admin Pterodactyl → **Nests** → egg « NodeJS … git » → **Startup Command**.
Remplace la fin de la commande par :

> - ❌ avant : `… npm run build; /usr/local/bin/npx next ${NODE_RUN_ENV} -p {{SERVER_PORT}}`
> - ✅ après : `… npm run build; cd /home/container && PORT={{SERVER_PORT}} HOST=0.0.0.0 /usr/local/bin/node socket-server.mjs`

```bash
if [ ! "$(ls -A /home/container)" ]; then echo -e "/home/container is empty.\ncloning files into repo"; if [ -z ${GIT_BRANCH} ]; then echo -e "cloning default branch"; git clone ${GIT_URL} /home/container; else echo -e "cloning ${GIT_BRANCH}'"; git clone --single-branch --branch ${GIT_BRANCH} ${GIT_URL} /home/container; fi; else echo -e "/home/container is not empty."; cd /home/container; if [ -d .git ]; then echo -e ".git directory exists"; git reset --hard; git fetch origin; git checkout ${GIT_BRANCH}; git pull origin ${GIT_BRANCH}; else echo -e "Not a git repository. Removing existing files and cloning again."; rm -rf /home/container/* /home/container/.* 2>/dev/null; if [ -n "${USERNAME}" ] && [ -n "${ACCESS_TOKEN}" ]; then GIT_URL="https://${USERNAME}:${ACCESS_TOKEN}@$(echo -e ${GIT_URL} | cut -d/ -f3-)"; fi; git clone ${GIT_URL} /home/container; fi; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; cd /home/container && PORT={{SERVER_PORT}} HOST=0.0.0.0 /usr/local/bin/node socket-server.mjs
```

(Le `npm run build` n'est plus nécessaire ici : le microservice n'a pas de build.)

## Console attendue (succès)

```
> Microservice Socket.IO prêt sur http://0.0.0.0:3001 — ws sur /socket.io (cors=…)
```

## Vérification finale

- `GET https://<hôte-microservice>/health` → `{"ok":true,...}`
- Le handshake navigateur passe : dans la console réseau, requêtes ws `…/socket.io/?EIO=4&transport=websocket` en 101.
- Dashboard admin : `/api/admin/realtime-metrics` renvoie `realtimeActive: true` et le nombre de sockets.

## Notes

- **WebSocket** : le transport est websocket-only. Le vhost nginx qui route vers le
  microservice doit transmettre l'upgrade :
  `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;`,
  `proxy_set_header Connection "upgrade";`.
- **Résilience** : si le microservice est down, le site Next fonctionne normalement,
  le temps réel est simplement inactif (no-op silencieux + `realtimeActive: false`).
- **Port** : le microservice écoute sur `process.env.PORT` (défaut `3001`).

## Scripts npm liés

**Repo workyt-next** (ce repo) :
- `npm start` → `next start` (standalone, format hébergeur)

**Repo workyt-socket** :
- `npm start` / `npm run dev` → `node socket-server.mjs`
- `npm run test:e2e` → test connexion ws + emit interne

Dev local : un terminal par repo (`npm run dev` ici + `npm run dev` dans workyt-socket).
