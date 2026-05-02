/**
 * Notifie les moteurs de recherche dès qu'un nouveau contenu est publié :
 *  1. revalidatePath('/sitemap.xml') → Next.js régénère le sitemap au prochain hit
 *  2. IndexNow → notifie Bing, Yandex, Naver, Seznam, Yep en temps réel
 *
 * IndexNow est gratuit et ne nécessite qu'une clé hex publiquement accessible
 * (servie sur https://workyt.fr/<key>.txt). Voir https://www.indexnow.org/.
 */

import { revalidatePath } from "next/cache";

const HOST = "workyt.fr";
const KEY = process.env.INDEXNOW_KEY || "12bf9abef5c7ef83377a9d12bfa3a67e";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

/**
 * À appeler dans le route handler après création/mise à jour d'une question, fiche
 * ou cours. Non bloquant : ne fait pas planter la requête utilisateur si IndexNow
 * est down. Toutes les opérations sont silencieuses sauf log d'erreur.
 *
 * @param urls une ou plusieurs URLs absolues (https://workyt.fr/...)
 */
export async function notifySeo(urls: string | string[]) {
    const list = Array.isArray(urls) ? urls : [urls];
    const valid = list.filter((u) => typeof u === "string" && u.startsWith(`https://${HOST}/`));

    // Étape 1 — revalider le sitemap (toujours fait, même sans IndexNow)
    try {
        revalidatePath("/sitemap.xml");
    } catch (err) {
        console.error("[seoNotify] revalidatePath failed:", err);
    }

    if (valid.length === 0) return;

    // Étape 2 — pinger IndexNow (Bing, Yandex, Naver, Seznam, Yep)
    try {
        const body = {
            host: HOST,
            key: KEY,
            keyLocation: KEY_LOCATION,
            urlList: valid,
        };
        // Fire-and-forget : on n'attend pas la réponse pour ne pas bloquer.
        fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(body),
        }).catch((err) => console.error("[seoNotify] IndexNow ping failed:", err));
    } catch (err) {
        console.error("[seoNotify] IndexNow setup failed:", err);
    }
}

export const INDEXNOW_KEY = KEY;
