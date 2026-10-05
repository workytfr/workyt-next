// Génère la clé de signature des jetons « Se connecter avec Workyt » (OIDC).
// À mettre dans la variable OIDC_PRIVATE_KEY de workyt.fr (une seule ligne, \n échappés).
// Ne jamais la committer. En changer déconnecte les applications au prochain jeton.
//   node scripts/oidc-generate-key.mjs
import crypto from "crypto";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
console.log(`OIDC_PRIVATE_KEY="${pem.trim().replace(/\n/g, "\\n")}"`);
console.log(`OIDC_BLOG_CLIENT_SECRET="${crypto.randomBytes(32).toString("base64url")}"`);
