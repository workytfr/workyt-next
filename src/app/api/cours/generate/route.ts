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

// MaitreRenard AI ne RÉÉCRIT pas : il découpe, encadre et corrige les fautes.
// Le texte appartient au rédacteur (guide des rédacteurs : « chacun écrit à sa manière »).
const SYSTEM_PROMPT = `Tu mets en forme un cours déjà écrit par un rédacteur bénévole. Le texte t'est donné tel qu'il a été extrait d'un PDF. Ton travail : le DÉCOUPER en sections et leçons, le mettre en HTML, et CORRIGER LES FAUTES. Rien d'autre.

RÈGLE N°1 — LE TEXTE EST RECOPIÉ MOT POUR MOT
- Recopie TOUT le texte, phrase par phrase, dans l'ordre du document.
- INTERDIT : reformuler, résumer, raccourcir, développer, simplifier, changer un mot par un synonyme, changer le ton, fusionner ou réordonner des phrases.
- INTERDIT : ajouter du contenu (introduction, transition, conclusion, exemple, explication, titre de bloc, emoji) qui n'est pas dans le document.
- INTERDIT : supprimer un passage du cours, même s'il te semble inutile ou répétitif.

RÈGLE N°2 — TU CORRIGES UNIQUEMENT LES FAUTES
- Autorisé : orthographe, accords, conjugaison, accents, majuscules, ponctuation, espaces (ex. espace avant « : » ou « ? »), apostrophes.
- Autorisé : réparer les défauts de l'extraction PDF — mots coupés en fin de ligne (« fonc- tion » → « fonction »), lignes cassées au milieu d'une phrase, espaces en trop.
- Autorisé : retirer ce qui n'appartient pas au cours — numéros de page, en-têtes et pieds de page répétés.
- Une phrase juste mais maladroite reste TELLE QUELLE. En cas de doute, ne change rien.
- Ne touche jamais aux formules, aux nombres, aux noms propres ni aux termes techniques, sauf faute d'orthographe évidente.

RÈGLE N°3 — LE DÉCOUPAGE SUIT LE DOCUMENT
- Les titres du document deviennent les titres de sections (chapitres) et de leçons (sous-parties), avec leurs mots à eux (fautes corrigées).
- Sans titre dans le document : tu peux donner à une section ou une leçon un titre court fait de mots présents dans le texte. C'est la SEULE chose que tu peux écrire toi-même.
- Retire les numéros en tête de titre (« Chapitre 1 : », « I. », « A. ») : le site numérote déjà.

FORMAT DU CONTENU HTML
- Balises autorisées : <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <table>, <tr>, <th>, <td>.
- Garde le gras et l'italique là où le document les met ; n'en ajoute pas.
- Formules : $formule$ dans le texte, $$formule$$ seule sur sa ligne. Retranscris-les fidèlement en LaTeX.
- N'ajoute AUCUNE couleur ni style.

BLOCS PÉDAGOGIQUES — ils ENCADRENT un passage existant, ils n'en créent pas
- Un passage que le document présente lui-même comme une définition, une propriété, un théorème, un exemple, une remarque ou une mise en garde est placé dans le bloc correspondant :
  <div data-custom-block blocktype="definition"><p>…texte du document…</p></div>
  Types : definition, propriete, theoreme, exemple, remarque, attention.
- Le mot annonçant le bloc (« Définition : », « Exemple : »…) est retiré du texte : le bloc l'affiche déjà.
- Si le document donne un titre au passage (« Théorème de Pythagore »), mets-le en premier : <div data-custom-block blocktype="theoreme"><p><strong>Théorème de Pythagore</strong></p><p>…</p></div>. Sinon, pas de titre.
- Le reste du texte reste en <p>, <h2>, <h3>, sans bloc. N'invente pas de bloc pour « décorer ».

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
          "content": "Texte INTÉGRAL de la leçon en HTML, recopié mot pour mot (fautes corrigées)",
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

/**
 * Contrôle de fidélité : l'IA doit recopier le texte (fautes corrigées), pas le
 * réécrire. On compare les mots du PDF et ceux du brouillon :
 * - `kept`  : part des mots du PDF retrouvés dans le brouillon (bas = résumé, coupe) ;
 * - `added` : part des mots du brouillon absents du PDF (haut = réécriture, ajout).
 * Une correction d'orthographe ne change qu'un mot par-ci par-là : elle reste sous les seuils.
 */
function fidelity(source: string, sections: any[]) {
    const words = (text: string) =>
        text
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .match(/[a-z]{3,}/g) || [];
    const count = (list: string[]) => {
        const m = new Map<string, number>();
        for (const w of list) m.set(w, (m.get(w) || 0) + 1);
        return m;
    };
    // Seul le contenu des leçons compte : les titres peuvent être créés quand le PDF n'en a pas
    const output = sections
        .flatMap((s: any) => (s.lessons || []).map((l: any) => l.content || ""))
        .join(" ")
        .replace(/<[^>]*>/g, " ");
    const src = count(words(source));
    const out = count(words(output));
    let common = 0;
    for (const [w, n] of src) common += Math.min(n, out.get(w) || 0);
    const srcTotal = [...src.values()].reduce((a, b) => a + b, 0) || 1;
    const outTotal = [...out.values()].reduce((a, b) => a + b, 0) || 1;
    return {
        kept: Math.round((common / srcTotal) * 100),
        added: Math.round(((outTotal - common) / outTotal) * 100),
    };
}

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
            let closed = false;

            const sendEvent = (event: string, data: any) => {
                if (closed) return;
                try {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                } catch {
                    closed = true;
                }
            };

            const closeStream = () => {
                if (closed) return;
                closed = true;
                try { controller.close(); } catch {}
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
                    closeStream();
                    return;
                }

                const truncated = extractedText.length > MAX_TEXT_LENGTH;
                if (truncated) {
                    extractedText = extractedText.slice(0, MAX_TEXT_LENGTH);
                }

                sendEvent("progress", {
                    step: 2,
                    message: `${numPages} page${numPages > 1 ? "s" : ""} extraite${numPages > 1 ? "s" : ""} — ${extractedText.length.toLocaleString("fr-FR")} caractères`,
                });

                // Étape 3 : Envoi à l'IA
                sendEvent("progress", { step: 3, message: "Envoi du contenu à l'IA pour structuration..." });

                const userMessage = `Voici le contenu extrait d'un PDF de cours intitulé "${title}" (matière : ${matiere}, niveau : ${niveau}).

Découpe-le en sections et leçons et corrige uniquement les fautes. Recopie tout le texte mot pour mot : ne reformule rien, n'ajoute rien, ne résume rien.

---
${extractedText}
---`;

                const aiResponse = await callOpenRouter([
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ], {
                    // Température nulle : on veut une copie fidèle, pas de créativité
                    temperature: 0,
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
                        closeStream();
                        return;
                    }
                }

                if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
                    sendEvent("error", { message: "L'IA n'a pas généré de sections. Veuillez réessayer." });
                    closeStream();
                    return;
                }

                for (const section of parsed.sections) {
                    if (!section.title || !Array.isArray(section.lessons)) {
                        sendEvent("error", { message: "Structure de sections invalide. Veuillez réessayer." });
                        closeStream();
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
                        truncated,
                    },
                    fidelity: fidelity(extractedText, parsed.sections),
                });

                closeStream();
            } catch (error: any) {
                console.error("Erreur génération cours:", error.message);
                sendEvent("error", { message: error.message || "Erreur interne du serveur." });
                closeStream();
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
