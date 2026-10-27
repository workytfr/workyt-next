/**
 * Consentement aux cookies (Google Consent Mode v2, mode « basique »).
 *
 * Par défaut tout est refusé : le script Google Ads et Mailchimp ne sont chargés
 * qu'après accord. Le choix est gardé 6 mois (recommandation CNIL), puis on
 * redemande. Changer CONSENT_VERSION redemande à tout le monde (nouveau traceur).
 */

export const CONSENT_STORAGE_KEY = "workyt-consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182;

/** Événement pour rouvrir le panneau (lien « Gérer les cookies » du footer) */
export const OPEN_CONSENT_EVENT = "workyt:open-cookies";
/** Émis après chaque choix, avec le consentement en `detail` */
export const CONSENT_CHANGE_EVENT = "workyt:consent-change";

export const GOOGLE_ADS_ID = "AW-10979332706";

export interface ConsentChoices {
    /** Mesure d'audience détaillée (enregistrement des sessions, analytics_storage) */
    analytics: boolean;
    /** Publicité et marketing (Google Ads, Mailchimp) */
    marketing: boolean;
}

export interface StoredConsent extends ConsentChoices {
    v: number;
    /** Date du choix (ms) */
    at: number;
}

export const CONSENT_CATEGORIES: {
    key: keyof ConsentChoices | "essential";
    title: string;
    description: string;
    services: string;
}[] = [
    {
        key: "essential",
        title: "Essentiels",
        description: "Connexion à ton compte, sécurité, préférences d'affichage. Le site ne fonctionne pas sans.",
        services: "Session Workyt, statistiques anonymes Umami (sans cookie)",
    },
    {
        key: "analytics",
        title: "Mesure d'audience",
        description: "Nous aide à repérer ce qui bloque sur le site (pages lentes, boutons introuvables) en rejouant des visites anonymisées.",
        services: "Umami (enregistrement de session)",
    },
    {
        key: "marketing",
        title: "Publicité et newsletter",
        description: "Mesure l'efficacité de nos annonces Google (nous n'affichons aucune pub sur Workyt) et des emails de l'association.",
        services: "Google Ads, Mailchimp",
    },
];

// Repli si le localStorage est indisponible (navigation privée stricte)
let memoryConsent: string | null = null;

/** Valeur brute enregistrée : sert d'instantané à useSyncExternalStore */
export function getConsentSnapshot(): string | null {
    try {
        return localStorage.getItem(CONSENT_STORAGE_KEY) ?? memoryConsent;
    } catch {
        return memoryConsent;
    }
}

export function parseConsent(raw: string | null): StoredConsent | null {
    try {
        const c = JSON.parse(raw || "null");
        if (!c || c.v !== CONSENT_VERSION || typeof c.at !== "number") return null;
        if (Date.now() - c.at > CONSENT_MAX_AGE_MS) return null;
        return { v: c.v, at: c.at, analytics: !!c.analytics, marketing: !!c.marketing };
    } catch {
        return null;
    }
}

export function subscribeConsent(onChange: () => void) {
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
        window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

/** Signaux Consent Mode v2 envoyés à Google */
export function toGoogleConsent(c: ConsentChoices) {
    const ads = c.marketing ? "granted" : "denied";
    return {
        ad_storage: ads,
        ad_user_data: ads,
        ad_personalization: ads,
        analytics_storage: c.analytics ? "granted" : "denied",
    } as const;
}

export function saveConsent(choices: ConsentChoices): StoredConsent {
    const stored: StoredConsent = { v: CONSENT_VERSION, at: Date.now(), ...choices };
    memoryConsent = JSON.stringify(stored);
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, memoryConsent);
    } catch {
        /* navigation privée : le choix vaut pour la page en cours */
    }
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("consent", "update", toGoogleConsent(choices));
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: stored }));
    return stored;
}

/** Traceurs déposés par les services refusés : on les efface au retrait */
export function clearTrackerCookies(choices: ConsentChoices) {
    const prefixes = [
        ...(choices.marketing ? [] : ["_gcl_", "_mcid", "_ga"]),
    ];
    if (!prefixes.length) return;
    const host = window.location.hostname;
    const domains = ["", host, `.${host.replace(/^www\./, "")}`];
    for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (!prefixes.some((p) => name.startsWith(p))) continue;
        for (const d of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
        }
    }
}

export const openConsentPanel = () => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));

/**
 * Script inline exécuté avant tout le reste : valeurs par défaut « refusé »,
 * puis le choix déjà enregistré, puis la configuration Google Ads mise en file.
 * gtag.js n'est chargé (et la file traitée) qu'avec le consentement marketing.
 */
export const CONSENT_BOOTSTRAP_SCRIPT = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);
try{var c=JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}')||'null');
if(c&&c.v===${CONSENT_VERSION}&&Date.now()-c.at<=${CONSENT_MAX_AGE_MS}){var a=c.marketing?'granted':'denied';
gtag('consent','update',{ad_storage:a,ad_user_data:a,ad_personalization:a,analytics_storage:c.analytics?'granted':'denied'});}}catch(e){}
gtag('js',new Date());
gtag('config','${GOOGLE_ADS_ID}');
gtag('event','conversion',{send_to:'${GOOGLE_ADS_ID}/HSH7CP-6g9sDEOKkrfMo'});
`;
