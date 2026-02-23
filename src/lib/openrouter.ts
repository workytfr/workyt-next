interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenRouterOptions {
    model?: string;
    temperature?: number;
    max_tokens?: number;
}

interface OpenRouterResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter(
    messages: Message[],
    options: OpenRouterOptions = {}
): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY non configurée");
    }

    const model = options.model || process.env.OPENROUTER_MODEL || "mistralai/mistral-large-2512";

    const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://workyt.fr",
            "X-Title": "Workyt Course Generator",
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: options.max_tokens ?? 16000,
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`OpenRouter API error (${res.status}): ${error}`);
    }

    const data: OpenRouterResponse = await res.json();

    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Réponse vide de l'IA");
    }

    return data.choices[0].message.content;
}

/**
 * Extraire un bloc JSON d'une réponse LLM qui peut contenir du texte autour.
 * Gère les cas où le contenu JSON contient du HTML avec des accolades.
 */
export function extractJSON(text: string): string {
    // Chercher un bloc ```json ... ``` d'abord (le plus fiable)
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }

    // Chercher le JSON en comptant les accolades pour trouver l'objet racine complet
    const firstBrace = text.indexOf("{");
    if (firstBrace === -1) return text;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = firstBrace; i < text.length; i++) {
        const char = text[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === "\\") {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === "{") depth++;
        else if (char === "}") {
            depth--;
            if (depth === 0) {
                return text.slice(firstBrace, i + 1);
            }
        }
    }

    // Fallback si le comptage échoue
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace > firstBrace) {
        return text.slice(firstBrace, lastBrace + 1);
    }

    return text;
}
