/**
 * Lecture du nombre d'abonnés Instagram via l'API officielle (Instagram Graph API).
 *
 * Prérequis (compte Business/Créateur relié à une Page Facebook) :
 *   - IG_USER_ID        : l'identifiant numérique du compte Instagram pro
 *   - IG_ACCESS_TOKEN   : un token d'accès longue durée avec la permission
 *                         instagram_basic (+ pages_show_list / pages_read_engagement)
 *
 * Le résultat est mis en cache 24 h côté Next (revalidate), ce qui évite de
 * solliciter l'API à chaque visite et reste largement suffisant pour un
 * nombre d'abonnés.
 */

const IG_API_VERSION = "v21.0";
const REVALIDATE_SECONDS = 86_400; // 24 h

export async function getInstagramFollowers(): Promise<number | null> {
    const userId = process.env.IG_USER_ID;
    const token = process.env.IG_ACCESS_TOKEN;

    // Pas configuré → on laisse la page utiliser sa valeur de repli.
    if (!userId || !token) return null;

    try {
        const url = `https://graph.facebook.com/${IG_API_VERSION}/${userId}?fields=followers_count&access_token=${token}`;
        const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

        if (!res.ok) {
            console.error("Instagram API error:", res.status, await res.text().catch(() => ""));
            return null;
        }

        const data = await res.json();
        return typeof data?.followers_count === "number" ? data.followers_count : null;
    } catch (err) {
        console.error("Instagram fetch failed:", err);
        return null;
    }
}

/**
 * Formate un nombre d'abonnés pour l'affichage : 252 → "252", 1234 → "1,2k".
 */
export function formatFollowers(n: number): string {
    if (n >= 1000) {
        return `${(n / 1000).toFixed(1).replace(/\.0$/, "").replace(".", ",")}k`;
    }
    return String(n);
}
