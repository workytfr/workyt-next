import { NextRequest, NextResponse } from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";
import { callOpenRouter, extractJSON } from "@/lib/openrouter";

const ALLOWED_ROLES = ["Admin"];
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_LENGTH = 100_000;

// Augmenter le timeout pour cette route (génération IA longue)
export const maxDuration = 120;

const SYSTEM_PROMPT = `Tu es un assistant pédagogique expert en structuration de cours. À partir du contenu textuel d'un PDF de cours, tu dois structurer le contenu en sections et leçons.

RÈGLES STRICTES :
- Conserve le style d'écriture ORIGINAL du PDF tel quel
- Ne résume JAMAIS le contenu, conserve-le en INTÉGRALITÉ
- Chaque section représente un chapitre ou thème majeur
- Chaque leçon représente un sous-chapitre ou concept distinct
- Le contenu de chaque leçon doit être en HTML riche (pas du Markdown)
- Organise logiquement du plus simple au plus complexe
- Conserve les listes, tableaux, définitions et exemples du document original
- Si le PDF contient des titres ou chapitres, utilise-les comme titres de sections/leçons

FORMAT DU CONTENU HTML :
- Utilise des balises HTML : <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>, <ol>, <table>, <tr>, <td>, <th>
- Pour les formules LaTeX inline : $formule$
- Pour les formules LaTeX en bloc : $$formule$$
- Pour mettre du texte en couleur : <span style="color: #couleur">texte</span>
- Couleurs recommandées : #e74c3c (rouge), #2980b9 (bleu), #27ae60 (vert), #f39c12 (orange), #8e44ad (violet)

BLOCS PÉDAGOGIQUES OBLIGATOIRES - Utilise ces blocs pour structurer le contenu :
- Définition : <div data-custom-block blocktype="definition"><strong>Titre de la définition</strong><p>Contenu...</p></div>
- Propriété : <div data-custom-block blocktype="propriete"><strong>Titre de la propriété</strong><p>Contenu...</p></div>
- Théorème : <div data-custom-block blocktype="theoreme"><strong>Titre du théorème</strong><p>Contenu...</p></div>
- Exemple : <div data-custom-block blocktype="exemple"><strong>Titre de l'exemple</strong><p>Contenu...</p></div>
- Remarque : <div data-custom-block blocktype="remarque"><strong>Titre de la remarque</strong><p>Contenu...</p></div>
- Attention : <div data-custom-block blocktype="attention"><strong>Point d'attention</strong><p>Contenu...</p></div>

UTILISATION DES BLOCS :
- Les définitions mathématiques/scientifiques → bloc "definition"
- Les propriétés, formules, règles → bloc "propriete"
- Les théorèmes, lois, principes → bloc "theoreme"
- Les exemples d'application, exercices résolus → bloc "exemple"
- Les remarques, astuces, compléments → bloc "remarque"
- Les erreurs fréquentes, pièges, mises en garde → bloc "attention"
- Le texte explicatif normal reste en <p> ou <h2>/<h3> sans bloc

IMPORTANT SUR LE FORMAT JSON :
- Les guillemets dans le contenu HTML doivent être échappés avec \\"
- Les retours à la ligne dans le contenu doivent être \\n
- N'utilise PAS de guillemets doubles non échappés dans les attributs HTML, utilise des guillemets simples : <span style='color: #e74c3c'>

Retourne UNIQUEMENT un JSON valide avec cette structure exacte, sans texte avant ou après :
{
  "sections": [
    {
      "title": "Titre de la section",
      "order": 1,
      "lessons": [
        {
          "title": "Titre de la leçon",
          "content": "Contenu HTML complet de la leçon avec les blocs pédagogiques...",
          "order": 1
        }
      ]
    }
  ]
}`;

export async function POST(req: NextRequest) {
    // Utiliser un ReadableStream pour envoyer la progression en SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: string, data: any) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // Étape 1 : Authentification
                sendEvent("progress", { step: 1, message: "Vérification des permissions..." });

                const user = await authMiddleware(req);
                if (!user || !user._id) {
                    sendEvent("error", { message: "Non autorisé. Veuillez vous connecter." });
                    controller.close();
                    return;
                }

                if (!ALLOWED_ROLES.includes(user.role)) {
                    sendEvent("error", { message: "Rôle insuffisant pour générer un cours." });
                    controller.close();
                    return;
                }

                const formData = await req.formData();
                const pdf = formData.get("pdf") as File | null;
                const title = formData.get("title") as string | null;
                const matiere = formData.get("matiere") as string | null;
                const niveau = formData.get("niveau") as string | null;

                if (!pdf || !title || !matiere || !niveau) {
                    sendEvent("error", { message: "PDF, titre, matière et niveau requis." });
                    controller.close();
                    return;
                }

                if (pdf.size > MAX_PDF_SIZE) {
                    sendEvent("error", { message: "Le PDF ne doit pas dépasser 20 Mo." });
                    controller.close();
                    return;
                }

                if (!pdf.name.toLowerCase().endsWith(".pdf")) {
                    sendEvent("error", { message: "Le fichier doit être un PDF." });
                    controller.close();
                    return;
                }

                // Étape 2 : Extraction du texte
                sendEvent("progress", { step: 2, message: `Extraction du texte de "${pdf.name}"...` });

                const arrayBuffer = await pdf.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                const { PDFParse } = await import("pdf-parse");
                const parser = new (PDFParse as any)(uint8Array);
                await parser.load();
                const pdfResult = await parser.getText();

                let extractedText: string = pdfResult.text || "";
                const numPages: number = pdfResult.total || 0;

                if (!extractedText || extractedText.trim().length < 50) {
                    sendEvent("error", { message: "Impossible d'extraire du texte du PDF. Vérifiez que le PDF contient du texte." });
                    controller.close();
                    return;
                }

                if (extractedText.length > MAX_TEXT_LENGTH) {
                    extractedText = extractedText.slice(0, MAX_TEXT_LENGTH);
                }

                sendEvent("progress", {
                    step: 2,
                    message: `${numPages} page${numPages > 1 ? "s" : ""} extraite${numPages > 1 ? "s" : ""} — ${extractedText.length.toLocaleString("fr-FR")} caractères`,
                });

                // Étape 3 : Envoi à l'IA
                sendEvent("progress", { step: 3, message: "Envoi du contenu à l'IA pour structuration..." });

                const userMessage = `Voici le contenu extrait d'un PDF de cours intitulé "${title}" (matière : ${matiere}, niveau : ${niveau}).

Structure ce contenu en sections et leçons en conservant le style d'écriture original :

---
${extractedText}
---`;

                const aiResponse = await callOpenRouter([
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ], {
                    temperature: 0.2,
                    max_tokens: 32000,
                });

                // Étape 4 : Analyse de la réponse
                sendEvent("progress", { step: 4, message: "Analyse et structuration de la réponse..." });

                console.log("Réponse IA (500 premiers chars):", aiResponse.slice(0, 500));

                const jsonStr = extractJSON(aiResponse);
                let parsed: { sections: any[] };
                try {
                    parsed = JSON.parse(jsonStr);
                } catch (parseError: any) {
                    console.error("Erreur parsing JSON:", parseError.message);
                    console.error("JSON extrait (300 premiers chars):", jsonStr.slice(0, 300));
                    // Tentative de réparation
                    try {
                        const cleaned = jsonStr
                            .replace(/,\s*([}\]])/g, '$1')
                            .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : ' ');
                        parsed = JSON.parse(cleaned);
                    } catch {
                        sendEvent("error", { message: "L'IA n'a pas retourné un JSON valide. Veuillez réessayer." });
                        controller.close();
                        return;
                    }
                }

                if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
                    sendEvent("error", { message: "L'IA n'a pas généré de sections. Veuillez réessayer." });
                    controller.close();
                    return;
                }

                for (const section of parsed.sections) {
                    if (!section.title || !Array.isArray(section.lessons)) {
                        sendEvent("error", { message: "Structure de sections invalide. Veuillez réessayer." });
                        controller.close();
                        return;
                    }
                }

                const totalLessons = parsed.sections.reduce((sum: number, s: any) => sum + (s.lessons?.length || 0), 0);
                sendEvent("progress", {
                    step: 5,
                    message: `${parsed.sections.length} section${parsed.sections.length > 1 ? "s" : ""} et ${totalLessons} leçon${totalLessons > 1 ? "s" : ""} générées !`,
                });

                // Résultat final
                sendEvent("done", {
                    draft: {
                        title,
                        matiere,
                        niveau,
                        sections: parsed.sections,
                    },
                    pdfInfo: {
                        pages: numPages,
                        textLength: extractedText.length,
                    },
                });

                controller.close();
            } catch (error: any) {
                console.error("Erreur génération cours:", error.message);
                sendEvent("error", { message: error.message || "Erreur interne du serveur." });
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
