"use client";

/**
 * Loader next/image : le redimensionnement est fait par le S3 de Youss
 * (https://s3.youss.dev/_ydev/image/<options>/<bucket>/<clé>), plus par le serveur Next.
 * Actif par défaut (IMAGE_LOADER=next le coupe, voir next.config.mjs).
 *
 * - Images de public/ : copiées dans workyt-learn/public/ par scripts/upload-public-to-s3.mjs.
 *   Une image ajoutée à public/ doit être envoyée AVANT le déploiement, sinon elle casse.
 * - Fichiers déjà sur s3.youss.dev : redimensionnés directement.
 * - Le reste (R2, utfs.io, /api/..., imports statiques /_next/...) est servi tel quel.
 * - SVG : servis tels quels par le site. Next ne les met de côté qu'avec son loader
 *   par défaut ; avec ce loader custom ils passeraient par /_ydev/image, qui ne sait
 *   pas les traiter (vérifié : échec de chargement), alors qu'un SVG n'a pas besoin
 *   d'être redimensionné.
 */
const HOST = "https://s3.youss.dev";
/**
 * Images de public/ pas (encore) sur le S3 : servies telles quelles par le site.
 * workytforum.png : l'envoi a été bloqué par le pare-feu de Youss (règle trav_dot).
 * Retirer une entrée dès que le fichier est envoyé (scripts/upload-public-to-s3.mjs).
 */
const NOT_ON_S3 = new Set(["/workytforum.png"]);
const BUCKET = "workyt-learn";
/** Version des fichiers servis par le site (badges redessinés le 13/11/2026). */
const ASSET_VERSION = "2";

type LoaderProps = { src: string; width: number; quality?: number };

export default function youssImageLoader({ src, width, quality }: LoaderProps): string {
    // ?w= : un loader doit utiliser la largeur ; le fichier statique ignore le paramètre.
    // v= : à incrémenter quand des SVG sont redessinés sous le même nom, sinon le cache
    // (Cloudflare, navigateur) continue de servir l'ancien dessin.
    if (/\.svg(?:$|[?#])/i.test(src) || NOT_ON_S3.has(src.split(/[?#]/)[0])) return `${src}${src.includes("?") ? "&" : "?"}v=${ASSET_VERSION}&w=${width}`;
    const resize = `${HOST}/_ydev/image/width=${width},quality=${quality ?? 75},format=auto`;
    if (src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/_next/") && !src.startsWith("/api/")) {
        const local = src.split(/[?#]/)[0].split("/").map((part) => encodeURIComponent(decodeURIComponent(part))).join("/");
        return `${resize}/${BUCKET}/public${local}`;
    }
    if (src.startsWith(`${HOST}/`) && !src.startsWith(`${HOST}/_ydev/`)) {
        return `${resize}/${src.slice(HOST.length + 1)}`;
    }
    return src;
}
