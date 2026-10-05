# « Se connecter avec Workyt » (OAuth 2.0 + OpenID Connect)

workyt.fr est le fournisseur d'identité du blog (`blog.workyt.fr`) : le blog
ne voit jamais le mot de passe, comme avec « Se connecter avec Google ».

## Parcours

1. Sur le blog : « Se connecter avec Workyt ».
2. `GET /oauth/authorize` sur workyt.fr : connexion (e-mail ou Discord) si besoin,
   puis écran « Le blog de Workyt veut se connecter avec ton compte Workyt »
   (une seule fois par membre).
3. Retour sur le blog avec un code à usage unique (60 s), que le serveur du blog
   échange sur `POST /oauth/token` (secret du client + PKCE S256).
4. Le blog reçoit l'identifiant, le pseudo, l'avatar, l'e-mail et le rôle Workyt.

« Se déconnecter partout » sur le blog passe par `/oauth/logout`, qui ferme aussi
la session de workyt.fr.

## Adresses

| Adresse | Rôle |
|---|---|
| `/.well-known/openid-configuration` | découverte (lue par le blog) |
| `/oauth/authorize` | connexion + autorisation |
| `/oauth/token` | échange du code contre les jetons |
| `/oauth/userinfo` | profil (jeton d'accès) |
| `/oauth/jwks` | clés publiques de signature (RS256) |
| `/oauth/logout` | déconnexion de workyt.fr puis retour à l'application |

Code : `src/lib/oidc/` (liste blanche des clients dans `config.ts`),
`src/app/oauth/`, modèles `OAuthCode` et `OAuthConsent`.

## Mise en production

1. Générer la clé de signature et le secret du blog :
   `node scripts/oidc-generate-key.mjs`
2. Sur workyt.fr : `OIDC_PRIVATE_KEY` et `OIDC_BLOG_CLIENT_SECRET`
   (`OIDC_ISSUER` facultatif, par défaut `NEXTAUTH_URL`).
3. Sur le blog : `WORKYT_URL=https://workyt.fr`, `WORKYT_CLIENT_ID=blog`,
   `WORKYT_CLIENT_SECRET` = le même secret.
4. Ne jamais committer ces valeurs. Changer la clé oblige les membres à se
   reconnecter au blog ; changer le secret, à mettre à jour les deux sites.

## Essayer en local (sans toucher à la base de production)

- Base de test locale : `MONGODB_URI=mongodb://127.0.0.1:27018/workyt-test node scripts/oidc-dev-user.mjs`
  (comptes `admin.test@workyt.local` / `eleve.test@workyt.local`, mot de passe `motdepasse-test`).
- Lancer workyt-next sur une autre adresse que le blog (les cookies ne
  séparent pas les ports) : `next dev --webpack -H 127.0.0.1 -p 3200` avec
  `MONGODB_URI` local, `NEXTAUTH_URL=OIDC_ISSUER=http://127.0.0.1:3200` et
  `OIDC_BLOG_CLIENT_SECRET` ; le blog avec `WORKYT_URL=http://127.0.0.1:3200`.
- Les adresses de retour `http://localhost:3100/…` ne sont acceptées qu'en développement.
