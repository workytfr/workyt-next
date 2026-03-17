import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { PutObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_CHARACTERS = 5000;

const s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || "",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

const bucketName = process.env.S3_BUCKET_NAME || "workyt";

/**
 * Configuration des blocs custom pour le TTS.
 * Chaque bloc a une annonce vocale avec pause avant/après et intonation adaptée.
 * ElevenLabs supporte <break time="Xs"/> pour les pauses.
 */
const blockTTS: Record<string, { intro: string; outro: string }> = {
    definition: {
        intro: '<break time="0.8s"/> Voici une définition. <break time="0.4s"/>',
        outro: '<break time="0.6s"/>',
    },
    propriete: {
        intro: '<break time="0.8s"/> Propriété importante. <break time="0.4s"/>',
        outro: '<break time="0.6s"/>',
    },
    theoreme: {
        intro: '<break time="1.0s"/> Théorème. Retenez bien ce qui suit. <break time="0.5s"/>',
        outro: '<break time="0.8s"/>',
    },
    remarque: {
        intro: '<break time="0.6s"/> Petite remarque. <break time="0.3s"/>',
        outro: '<break time="0.4s"/>',
    },
    attention: {
        intro: '<break time="0.8s"/> Attention ! C\'est important. <break time="0.5s"/>',
        outro: '<break time="0.6s"/>',
    },
    exemple: {
        intro: '<break time="0.6s"/> Voyons un exemple. <break time="0.4s"/>',
        outro: '<break time="0.5s"/>',
    },
};

/**
 * Convertit un nombre entier en texte français.
 */
function numberToFrench(n: number): string {
    if (n < 0) return `moins ${numberToFrench(-n)}`;
    if (n === 0) return "zéro";

    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

    const convert = (num: number): string => {
        if (num === 0) return "";
        if (num < 20) return units[num];
        if (num < 70) {
            const t = Math.floor(num / 10);
            const u = num % 10;
            if (u === 0) return tens[t];
            if (u === 1 && t !== 8) return `${tens[t]} et un`;
            return `${tens[t]}-${units[u]}`;
        }
        if (num < 80) {
            const u = num - 60;
            if (u === 1) return "soixante et onze";
            return `soixante-${units[u]}`;
        }
        if (num < 100) {
            const u = num - 80;
            if (u === 0) return "quatre-vingts";
            return `quatre-vingt-${units[u]}`;
        }
        if (num < 200) {
            if (num === 100) return "cent";
            return `cent ${convert(num - 100)}`;
        }
        if (num < 1000) {
            const c = Math.floor(num / 100);
            const rest = num % 100;
            if (rest === 0) return `${units[c]} cents`;
            return `${units[c]} cent ${convert(rest)}`;
        }
        if (num < 2000) {
            const rest = num % 1000;
            if (rest === 0) return "mille";
            return `mille ${convert(rest)}`;
        }
        if (num < 1_000_000) {
            const t = Math.floor(num / 1000);
            const rest = num % 1000;
            const prefix = `${convert(t)} mille`;
            return rest === 0 ? prefix : `${prefix} ${convert(rest)}`;
        }
        if (num < 1_000_000_000) {
            const m = Math.floor(num / 1_000_000);
            const rest = num % 1_000_000;
            const prefix = m === 1 ? "un million" : `${convert(m)} millions`;
            return rest === 0 ? prefix : `${prefix} ${convert(rest)}`;
        }
        const b = Math.floor(num / 1_000_000_000);
        const rest = num % 1_000_000_000;
        const prefix = b === 1 ? "un milliard" : `${convert(b)} milliards`;
        return rest === 0 ? prefix : `${prefix} ${convert(rest)}`;
    };

    return convert(n);
}

/**
 * Convertit les nombres et dates dans le texte en français lisible pour le TTS.
 * - Dates (01/01/2024, 1er janvier 2024)
 * - Nombres avec séparateurs (1 000, 1.000)
 * - Décimaux avec virgule (3,14)
 * - Pourcentages (50%)
 * - Nombres ordinaux (1er, 2e, 3ème)
 */
function convertNumbersForTTS(text: string): string {
    const moisNoms = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];

    let result = text;

    // Dates format JJ/MM/AAAA ou JJ-MM-AAAA
    result = result.replace(/\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b/g, (_m, j, m, a) => {
        const jour = parseInt(j, 10);
        const mois = parseInt(m, 10);
        const annee = parseInt(a, 10);
        const jourText = jour === 1 ? "premier" : numberToFrench(jour);
        const moisText = moisNoms[mois - 1] || numberToFrench(mois);
        return `${jourText} ${moisText} ${numberToFrench(annee)}`;
    });

    // Dates format "1er janvier 2024" — convertir l'année
    const moisPattern = moisNoms.join("|");
    result = result.replace(
        new RegExp(`\\b(\\d{1,2})(?:er|ère)?\\s+(${moisPattern})\\s+(\\d{4})\\b`, "gi"),
        (_m, j, mois, a) => {
            const jour = parseInt(j, 10);
            const annee = parseInt(a, 10);
            const jourText = jour === 1 ? "premier" : numberToFrench(jour);
            return `${jourText} ${mois} ${numberToFrench(annee)}`;
        }
    );

    // Années seules entre 1000 et 2100 (contexte probable d'année)
    result = result.replace(/\b(1[0-9]{3}|20[0-9]{2}|2100)\b/g, (_m, a) => {
        return numberToFrench(parseInt(a, 10));
    });

    // Pourcentages
    result = result.replace(/(\d[\d\s.,]*)%/g, (_m, num) => {
        const cleaned = num.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
        const n = parseFloat(cleaned);
        if (isNaN(n)) return _m;
        if (Number.isInteger(n)) return `${numberToFrench(n)} pour cent`;
        const [int, dec] = cleaned.split(".");
        return `${numberToFrench(parseInt(int, 10))} virgule ${numberToFrench(parseInt(dec, 10))} pour cent`;
    });

    // Nombres avec séparateur de milliers (espace ou point) : 1 000, 1.000, 10 000
    result = result.replace(/\b(\d{1,3}(?:[\s.]?\d{3})+)\b/g, (_m, num) => {
        const cleaned = num.replace(/[\s.]/g, "");
        const n = parseInt(cleaned, 10);
        if (isNaN(n) || n < 1000) return _m;
        return numberToFrench(n);
    });

    // Nombres décimaux avec virgule (3,14)
    result = result.replace(/\b(\d+),(\d+)\b/g, (_m, int, dec) => {
        return `${numberToFrench(parseInt(int, 10))} virgule ${numberToFrench(parseInt(dec, 10))}`;
    });

    // Ordinaux : 1er, 1ère, 2e, 3ème, etc.
    result = result.replace(/\b(\d+)(?:er|ère|e|ème)\b/gi, (_m, num) => {
        const n = parseInt(num, 10);
        if (n === 1) return "premier";
        return `${numberToFrench(n)}ième`;
    });

    // Nombres restants (entiers simples)
    result = result.replace(/\b(\d+)\b/g, (_m, num) => {
        const n = parseInt(num, 10);
        if (isNaN(n)) return _m;
        return numberToFrench(n);
    });

    return result;
}

/**
 * Extrait le texte d'un contenu HTML pour le TTS avec balisage ElevenLabs.
 * - Ajoute des pauses et annonces pour les blocs custom
 * - Remplace le LaTeX par une mention vocale
 * - Ajoute des pauses entre les paragraphes
 * - Convertit les nombres et dates en français lisible
 */
export function stripHtmlToText(html: string): string {
    let result = html;

    // 1. Transformer les blocs custom avec pauses et annonces
    result = result.replace(
        /<div\s+[^>]*(?:blocktype="(\w+)"|class="[^"]*custom-block\s+(\w+)[^"]*")[^>]*>([\s\S]*?)<\/div>/gi,
        (_match, blocktype1, blocktype2, content) => {
            const type = blocktype1 || blocktype2;
            const tts = blockTTS[type];
            if (!tts) return ` ${content} `;
            // Retirer le <strong>Titre</strong> ou <p><strong>Titre</strong></p> du début
            const cleaned = content
                .replace(/^<p>\s*<strong>[^<]*<\/strong>\s*<\/p>\s*/i, "")
                .replace(/^<strong>[^<]*<\/strong>\s*/i, "");
            return ` ${tts.intro} ${cleaned} ${tts.outro} `;
        }
    );

    // 2. Ajouter des micro-pauses entre les paragraphes
    result = result.replace(/<\/p>\s*<p>/gi, ' <break time="0.3s"/> ');

    // 3. Pauses pour les titres (h1, h2, h3...)
    result = result.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi,
        (_match, content) => ` <break time="0.6s"/> ${content}. <break time="0.4s"/> `
    );

    // 4. Remplacer les listes par une lecture naturelle
    result = result.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,
        (_match, content) => ` <break time="0.2s"/> ${content}. `
    );

    // 5. Remplacer les formules LaTeX par une mention vocale avec pause
    result = result.replace(/\$\$[\s\S]*?\$\$/g, ' <break time="0.3s"/> formule mathématique <break time="0.3s"/> ');
    result = result.replace(/\$[^$]*?\$/g, " formule ");

    // 6. Supprimer les balises HTML restantes (mais garder les <break>)
    result = result.replace(/<(?!break\s)[^>]+>/g, " ");

    // 7. Décoder les entités HTML courantes
    result = result
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // 8. Normaliser les espaces insécables (U+00A0, U+202F) en espaces normaux
    result = result.replace(/[\u00A0\u202F]/g, " ");

    // 9. Convertir les nombres et dates en français lisible
    result = convertNumbersForTTS(result);

    // 10. Nettoyer les espaces multiples (sans toucher aux balises break)
    result = result.replace(/\s+/g, " ").trim();

    return result;
}

/**
 * Vérifie si un audio existe déjà sur R2 pour cette leçon
 */
export async function audioExistsOnR2(lessonId: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: `audio-tts/${lessonId}.mp3`,
        }));
        return true;
    } catch {
        return false;
    }
}

/**
 * Génère un audio via ElevenLabs et l'upload sur R2
 * Retourne l'URL publique du fichier audio
 */
export async function generateAndUploadTTS(
    lessonId: string,
    htmlContent: string,
    voiceId?: string
): Promise<string> {
    const text = stripHtmlToText(htmlContent);

    if (!text || text.length === 0) {
        throw new Error("Le contenu de la leçon est vide après extraction du texte.");
    }

    if (text.length > MAX_CHARACTERS) {
        throw new Error(
            `Le texte dépasse la limite de ${MAX_CHARACTERS} caractères (${text.length} caractères). Réduisez le contenu de la leçon.`
        );
    }

    const client = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY,
    });

    const audioResponse = await client.textToSpeech.convert(
        voiceId || process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
        {
            text,
            modelId: "eleven_multilingual_v2",
            outputFormat: "mp3_44100_128",
        }
    );

    // Collecter les chunks du stream en un seul Buffer
    const reader = audioResponse.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }
    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length === 0) {
        throw new Error("ElevenLabs a retourné un audio vide.");
    }

    // Upload sur R2
    const fileKey = `audio-tts/${lessonId}.mp3`;
    await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: audioBuffer,
        ContentType: "audio/mpeg",
    }));

    // Retourner la clé R2 (sera servie via signed URL ou file-proxy)
    return fileKey;
}
