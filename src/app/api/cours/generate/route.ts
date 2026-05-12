import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import authMiddleware from "@/middlewares/authMiddleware";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { callOpenRouter, extractJSON } from "@/lib/openrouter";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { hasPermission } from "@/lib/roles";
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_LENGTH = 100_000;

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

const QUIZ_SYSTEM_PROMPT = `Tu es un expert en création de quiz pédagogiques. À partir du contenu d'un cours, génère des quiz pertinents pour évaluer la compréhension des élèves.

FORMATS EXACTS PAR TYPE DE QUESTION :

1. QCM (une seule bonne réponse)
{"question":"Énoncé ?","questionType":"QCM","answerSelectionType":"single","answers":["A","B","C","D"],"correctAnswer":0,"explanation":"Explication","point":2}
correctAnswer = index 0-based de la bonne réponse dans answers

2. QCM (plusieurs bonnes réponses)
{"question":"Lesquelles ?","questionType":"QCM","answerSelectionType":"multiple","answers":["A","B","C","D"],"correctAnswer":[0,2],"explanation":"Explication","point":3}

3. Vrai/Faux
{"question":"Affirmation","questionType":"Vrai/Faux","answerSelectionType":"single","answers":[],"correctAnswer":"true","explanation":"Explication","point":1}
correctAnswer = exactement "true" ou "false" (string, pas booléen)

4. Réponse courte
{"question":"Question ?","questionType":"Réponse courte","answerSelectionType":"single","answers":[],"correctAnswer":"réponse","explanation":"Explication","point":2}

5. Texte à trous ({{blank}} marque chaque trou)
{"question":"Complétez","questionType":"Texte à trous","answerSelectionType":"single","answers":["La {{blank}} est la capitale de {{blank}}."],"correctAnswer":["Paris","France"],"explanation":"Explication","point":2}
Pour un seul trou : "correctAnswer": "mot"

6. Classement (éléments déjà dans le bon ordre dans answers)
{"question":"Remettez en ordre","questionType":"Classement","answerSelectionType":"single","answers":["Étape 1","Étape 2","Étape 3"],"correctAnswer":[0,1,2],"explanation":"Explication","point":3}
answers = éléments dans le BON ordre. correctAnswer = [0,1,2,...] toujours croissant.

7. Glisser-déposer (associations terme ↔ définition)
{"question":"Associez","questionType":"Glisser-déposer","answerSelectionType":"single","answers":["Terme1","Terme2","Terme3","Déf1","Déf2","Déf3"],"correctAnswer":["Déf1","Déf2","Déf3"],"explanation":"Explication","point":4}
answers = [termes..., définitions...]. correctAnswer = définitions dans l'ordre des termes.

RÈGLES STRICTES :
- Génère exactement 1 quiz par section listée dans le message utilisateur
- Entre 5 et 8 questions par quiz, variées en type
- Utilise UNIQUEMENT les types mentionnés dans "Types autorisés"
- Questions testant les concepts clés, distracteurs plausibles
- Toujours renseigner "explanation"
- Points recommandés : Vrai/Faux=1, QCM single=2, Réponse courte=2, Texte à trous=2, Classement=3, Glisser-déposer=4

Retourne UNIQUEMENT un JSON valide, sans texte avant ou après :
{"quizzes":[{"sectionIndex":0,"title":"Quiz — [Titre section]","description":"Description courte","questions":[...]}]}`;

export async function POST(req: NextRequest) {
    // --- Étape 1 : Authentification AVANT le stream SSE ---
    // Cela évite que le stream soit "aborted" si l'auth ou la DB est lente
    let user: { _id: any; role: string } | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        try {
            user = await authMiddleware(req);
        } catch (err: any) {
            if (err?.code === "JWT_EXPIRED") {
                return NextResponse.json(
                    { message: "Session expirée. Veuillez vous reconnecter." },
                    { status: 401 }
                );
            }
            user = null;
        }
    }

    if (!user) {
        try {
            const session = await getServerSession(authOptions);
            if (session?.user?.id) {
                await connectDB();
                const dbUser = await User.findById(session.user.id).select("-password");
                if (dbUser) user = dbUser;
            }
        } catch (err: any) {
            console.error("Erreur auth session fallback:", err.message);
        }
    }

    if (!user || !user._id) {
        return NextResponse.json(
            { message: "Non autorisé. Veuillez vous reconnecter." },
            { status: 401 }
        );
    }

    if (!(await hasPermission(user.role, 'course.create'))) {
        return NextResponse.json(
            { message: "Rôle insuffisant pour générer un cours." },
            { status: 403 }
        );
    }

    // Rate limit: 2 générations par minute par compte
    const rl = rateLimit(`cours-generate:${user._id}`, 2, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    // --- Étape 2 : Lecture du FormData AVANT le stream SSE ---
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch (err: any) {
        return NextResponse.json(
            { message: "Erreur lors de la lecture des données du formulaire." },
            { status: 400 }
        );
    }

    const pdf = formData.get("pdf") as File | null;
    const title = formData.get("title") as string | null;
    const matiere = formData.get("matiere") as string | null;
    const niveau = formData.get("niveau") as string | null;
    const generateQuizzes = formData.get("generateQuizzes") === "true";
    const allowedTypesRaw = formData.get("allowedTypes") as string | null;
    const allowedTypes: string[] = allowedTypesRaw
        ? allowedTypesRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : ["QCM", "Vrai/Faux", "Réponse courte", "Texte à trous", "Classement", "Glisser-déposer"];

    if (!pdf || !title || !matiere || !niveau) {
        return NextResponse.json(
            { message: "PDF, titre, matière et niveau requis." },
            { status: 400 }
        );
    }

    if (pdf.size > MAX_PDF_SIZE) {
        return NextResponse.json(
            { message: "Le PDF ne doit pas dépasser 20 Mo." },
            { status: 400 }
        );
    }

    if (!pdf.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
            { message: "Le fichier doit être un PDF." },
            { status: 400 }
        );
    }

    // Lire le contenu du PDF en mémoire avant le stream
    const pdfArrayBuffer = await pdf.arrayBuffer();
    const pdfFileName = pdf.name;

    // --- Stream SSE pour les étapes longues (extraction PDF + IA) ---
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: string, data: any) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // Étape 1 déjà faite (auth OK)
                sendEvent("progress", { step: 1, message: "Permissions vérifiées ✓" });

                // Étape 2 : Extraction du texte
                sendEvent("progress", { step: 2, message: `Extraction du texte de "${pdfFileName}"...` });

                const uint8Array = new Uint8Array(pdfArrayBuffer);

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

                // Étape 6 (optionnelle) : Génération des quiz
                let generatedQuizzes: any[] = [];
                if (generateQuizzes) {
                    sendEvent("progress", { step: 6, message: "Génération des quiz par section..." });

                    const sectionSummary = parsed.sections
                        .map((s: any, i: number) => `Section ${i} : "${s.title}" — Leçons : ${(s.lessons || []).map((l: any) => l.title).join(", ")}`)
                        .join("\n");

                    const quizUserMessage = `Cours : "${title}" (matière : ${matiere}, niveau : ${niveau})

Sections du cours :
${sectionSummary}

Types autorisés : ${allowedTypes.join(", ")}

Contenu du cours (extrait) :
---
${extractedText.slice(0, 50000)}
---

Génère ${parsed.sections.length} quiz (un par section) en utilisant UNIQUEMENT les types autorisés listés ci-dessus.`;

                    try {
                        const quizResponse = await callOpenRouter(
                            [
                                { role: "system", content: QUIZ_SYSTEM_PROMPT },
                                { role: "user", content: quizUserMessage },
                            ],
                            { temperature: 0.3, max_tokens: 14000 }
                        );

                        const quizJsonStr = extractJSON(quizResponse);
                        let parsedQuizzes: { quizzes: any[] };
                        try {
                            parsedQuizzes = JSON.parse(quizJsonStr);
                        } catch {
                            const cleaned = quizJsonStr
                                .replace(/,\s*([}\]])/g, "$1")
                                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");
                            parsedQuizzes = JSON.parse(cleaned);
                        }

                        if (Array.isArray(parsedQuizzes.quizzes)) {
                            generatedQuizzes = parsedQuizzes.quizzes;
                            sendEvent("progress", {
                                step: 6,
                                message: `${generatedQuizzes.length} quiz générés avec succès !`,
                            });
                        }
                    } catch (quizErr: any) {
                        console.error("Erreur génération quiz:", quizErr.message);
                        sendEvent("progress", {
                            step: 6,
                            message: "Génération des quiz échouée — le cours sera sauvegardé sans quiz.",
                        });
                    }
                }

                // Résultat final
                sendEvent("done", {
                    draft: {
                        title,
                        matiere,
                        niveau,
                        sections: parsed.sections,
                        quizzes: generatedQuizzes,
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
