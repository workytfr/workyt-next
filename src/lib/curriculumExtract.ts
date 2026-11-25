import { extractJSON } from "@/lib/openrouter";

/**
 * Extraction d'un programme scolaire depuis un PDF officiel (BO, Éduscol).
 *
 * Aucune source officielle ne publie les programmes en données structurées :
 * seuls les PDF font foi. Le PDF est donc lu tel quel par un modèle qui voit
 * la mise en page (les repères de progression sont souvent en colonnes
 * 5e | 4e | 3e, que l'extraction de texte brut mélange), puis converti au
 * format de src/data/curricula/schema.json. Le résultat est un BROUILLON :
 * il est relu dans « Créer un programme » avant tout import.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
/** Modèle capable de lire un PDF nativement (texte + mise en page) */
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

export interface ExtractedSkill {
    description: string;
    difficulty: number;
    keywords: string[];
}

export interface ExtractedChapter {
    name: string;
    subChapter?: string;
    estimatedHours: number;
    skills: ExtractedSkill[];
}

export interface ExtractedTheme {
    name: string;
    chapters: ExtractedChapter[];
}

export interface ExtractedProgram {
    sourceReference: string;
    /** Avertissements du modèle (niveau absent du document, passages illisibles…) */
    warnings: string[];
    themes: ExtractedTheme[];
}

const SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["sourceReference", "warnings", "themes"],
    properties: {
        sourceReference: { type: "string" },
        warnings: { type: "array", items: { type: "string" } },
        themes: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "chapters"],
                properties: {
                    name: { type: "string" },
                    chapters: {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            required: ["name", "subChapter", "estimatedHours", "skills"],
                            properties: {
                                name: { type: "string" },
                                subChapter: { type: "string" },
                                estimatedHours: { type: "number" },
                                skills: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        additionalProperties: false,
                                        required: ["description", "difficulty", "keywords"],
                                        properties: {
                                            description: { type: "string" },
                                            difficulty: { type: "integer" },
                                            keywords: { type: "array", items: { type: "string" } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

function systemPrompt(level: string, subject: string) {
    return `Tu convertis un texte officiel de l'Éducation nationale (programme, repères annuels de progression, attendus de fin d'année) en arbre de programme pour une plateforme de soutien scolaire.

Niveau demandé : ${level}. Matière : ${subject}.

FIDÉLITÉ — c'est la règle principale
- Tu n'inventes RIEN : chaque thème, chapitre et compétence vient du document. Pas de notion « classique » absente du texte.
- Reprends le vocabulaire du document. Les noms de thèmes et de chapitres sont ceux du document (sans numérotation « 1. », « A. »).
- Si le document couvre plusieurs niveaux (colonnes 5e | 4e | 3e, mentions « en 3e », « dès la 4e »…), ne garde que ce qui concerne le niveau demandé, y compris ce qui est commun à plusieurs niveaux dont celui-ci. Lis bien la mise en page : une colonne appartient à un niveau.
- Si le niveau demandé n'apparaît pas dans le document, renvoie "themes": [] et explique-le dans "warnings".

STRUCTURE
- Thème : grande partie du programme (ex. « Nombres et calculs »).
- Chapitre : notion qu'on enseignerait dans un chapitre de cours (ex. « Fractions, nombres rationnels »). "subChapter" : précision éventuelle, sinon "".
- Compétences : ce que l'élève doit savoir faire à la fin du niveau, une par ligne, commençant par un verbe à l'infinitif (« Calculer… », « Reconnaître… », « Démontrer… »), reformulées au plus près du texte, 1 à 8 par chapitre. Pas de consignes destinées au professeur.
- "difficulty" : 1 (automatisme) à 5 (raisonnement expert), selon le niveau visé.
- "keywords" : 2 à 5 mots-clés tirés du texte (notions, vocabulaire).
- "estimatedHours" : seulement si le document l'indique, sinon 0.

MÉTADONNÉES
- "sourceReference" : titre du document et référence officielle si elle figure (ex. « Repères annuels de progression – Mathématiques cycle 4 (BO n°22 du 29 mai 2019) »).
- "warnings" : ce que l'administrateur doit vérifier (passages ambigus, colonnes difficiles à attribuer, texte coupé). [] si rien.

Réponds uniquement avec le JSON demandé.`;
}

/** Bornes et nettoyage : le brouillon doit toujours ouvrir proprement dans l'éditeur */
function normalize(raw: unknown): ExtractedProgram {
    const p = (raw ?? {}) as Partial<ExtractedProgram>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const themes = (Array.isArray(p.themes) ? p.themes : [])
        .map((t) => ({
            name: str(t?.name),
            chapters: (Array.isArray(t?.chapters) ? t.chapters : [])
                .map((c) => ({
                    name: str(c?.name),
                    subChapter: str(c?.subChapter) || undefined,
                    estimatedHours: Math.max(0, Math.round(Number(c?.estimatedHours) || 0)),
                    skills: (Array.isArray(c?.skills) ? c.skills : [])
                        .map((s) => ({
                            description: str(s?.description),
                            difficulty: Math.min(5, Math.max(1, Math.round(Number(s?.difficulty) || 2))),
                            keywords: (Array.isArray(s?.keywords) ? s.keywords : []).map(str).filter(Boolean).slice(0, 6),
                        }))
                        .filter((s) => s.description),
                }))
                .filter((c) => c.name && c.skills.length > 0),
        }))
        .filter((t) => t.name && t.chapters.length > 0);
    return {
        sourceReference: str(p.sourceReference),
        warnings: (Array.isArray(p.warnings) ? p.warnings : []).map(str).filter(Boolean),
        themes,
    };
}

export async function extractCurriculumFromPdf(input: {
    pdf: Uint8Array;
    filename: string;
    level: string;
    subject: string;
}): Promise<ExtractedProgram> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY non configurée");
    const model = process.env.OPENROUTER_CURRICULUM_MODEL || DEFAULT_MODEL;

    const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://workyt.fr",
            "X-Title": "Workyt Curriculum Extractor",
        },
        body: JSON.stringify({
            model,
            temperature: 0,
            max_tokens: 32000,
            messages: [
                { role: "system", content: systemPrompt(input.level, input.subject) },
                {
                    role: "user",
                    content: [
                        { type: "text", text: `Programme de ${input.subject}, niveau ${input.level}.` },
                        {
                            type: "file",
                            file: {
                                filename: input.filename || "programme.pdf",
                                file_data: `data:application/pdf;base64,${Buffer.from(input.pdf).toString("base64")}`,
                            },
                        },
                    ],
                },
            ],
            // Lecture native du PDF par le modèle (mise en page comprise)
            plugins: [{ id: "file-parser", pdf: { engine: "native" } }],
            response_format: { type: "json_schema", json_schema: { name: "programme", strict: true, schema: SCHEMA } },
        }),
    });

    if (!res.ok) throw new Error(`OpenRouter (${res.status}) : ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Réponse vide de l'IA");
    if (data?.choices?.[0]?.finish_reason === "length") {
        throw new Error("Document trop long pour une seule extraction : découpe-le (une partie du programme à la fois).");
    }
    return normalize(JSON.parse(extractJSON(content)));
}
