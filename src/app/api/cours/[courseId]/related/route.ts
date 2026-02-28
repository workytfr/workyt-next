import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Revision from "@/models/Revision";
import Question from "@/models/Question";

/**
 * Extrait les mots-clés significatifs d'un texte
 */
function extractKeywords(text: string): string[] {
    if (!text) return [];

    const stopWords = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'en', 'à', 'au', 'aux',
        'pour', 'par', 'sur', 'dans', 'avec', 'sans', 'sous', 'vers', 'ces', 'ses', 'son',
        'que', 'qui', 'quoi', 'dont', 'où', 'est', 'sont', 'être', 'avoir', 'faire',
        'ce', 'cette', 'cet', 'mon', 'ton', 'son', 'notre', 'votre', 'leur',
        'mais', 'ou', 'donc', 'car', 'ni', 'puis', 'alors',
        'cours', 'chapitre', 'leçon', 'introduction', 'conclusion', 'apprendre'
    ]);

    const normalized = text
        .toLowerCase()
        .replace(/[.,;:!?()"'\[\]{}|\/\-–—@#$%^&*+=<>~`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const words = normalized.split(' ').filter(word => {
        return word.length >= 4 && !stopWords.has(word) && /^[a-zàâäéèêëïîôöùûüç]+$/i.test(word);
    });

    const uniqueWords: string[] = [];
    const seen = new Set<string>();
    for (const word of words) {
        if (!seen.has(word)) {
            seen.add(word);
            uniqueWords.push(word);
        }
    }

    return uniqueWords.slice(0, 10);
}

/**
 * Calcule un score de pertinence entre les mots-clés du cours et un texte
 */
function calculateRelevanceScore(keywords: string[], text: string): number {
    if (keywords.length === 0) return 0;

    const textLower = text.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
            score += 10;
            if (textLower.startsWith(keyword)) {
                score += 5;
            }
        }

        const keywordRoot = keyword.substring(0, Math.max(3, keyword.length - 2));
        if (keyword !== keywordRoot && textLower.includes(keywordRoot)) {
            score += 3;
        }
    }

    return Math.min(100, Math.round((score / keywords.length) * 10));
}

/**
 * API pour récupérer les contenus liés à un cours
 * @route GET /api/cours/[courseId]/related
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        await dbConnect();

        const { courseId } = await params;

        const course = await Course.findById(courseId).lean();

        if (!course) {
            return NextResponse.json(
                { error: "Cours non trouvé" },
                { status: 404 }
            );
        }

        let { title, description, matiere, niveau } = course;

        matiere = matiere?.trim();
        niveau = niveau?.trim();

        const contextText = `${title} ${description || ''}`;
        const keywords = extractKeywords(contextText);

        // Fiches : correspondance exacte matière + niveau
        let candidateFiches = await Revision.find({
            subject: matiere,
            level: niveau
        })
            .select("_id revisionId title content subject level likes status author createdAt")
            .populate("author", "username")
            .lean();

        const scoredFiches = candidateFiches.map((fiche: any) => {
            const ficheText = `${fiche.title} ${fiche.content || ''}`;
            const relevanceScore = calculateRelevanceScore(keywords, ficheText);

            return {
                ...fiche,
                relevanceScore,
                finalScore: relevanceScore * 10 + (fiche.likes || 0)
            };
        });

        const topFiches = scoredFiches
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 5);

        // Questions forum : correspondance exacte matière + niveau
        let candidateQuestions = await Question.find({
            subject: matiere,
            classLevel: niveau
        })
            .select("_id title description subject classLevel points status answers createdAt")
            .lean();

        const scoredQuestions = candidateQuestions.map((question: any) => {
            const questionText = `${question.title} ${question.description?.whatINeed || ''}`;
            const relevanceScore = calculateRelevanceScore(keywords, questionText);

            return {
                ...question,
                relevanceScore,
                finalScore: relevanceScore * 10 + (question.points || 0)
            };
        });

        const topQuestions = scoredQuestions
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 5);

        // Formater les réponses avec données enrichies
        const formattedFiches = topFiches.map((fiche: any) => ({
            id: fiche._id.toString(),
            revisionId: fiche.revisionId,
            title: fiche.title,
            subject: fiche.subject,
            level: fiche.level,
            likes: fiche.likes || 0,
            status: fiche.status || "Non Certifiée",
            author: fiche.author?.username || "Anonyme",
            createdAt: fiche.createdAt,
            relevanceScore: fiche.relevanceScore,
        }));

        const formattedQuestions = topQuestions.map((question: any) => ({
            id: question._id.toString(),
            title: question.title,
            subject: question.subject,
            classLevel: question.classLevel,
            points: question.points,
            status: question.status,
            answersCount: Array.isArray(question.answers) ? question.answers.length : 0,
            createdAt: question.createdAt,
            relevanceScore: question.relevanceScore,
        }));

        return NextResponse.json({
            success: true,
            data: {
                course: {
                    id: courseId,
                    title,
                    matiere,
                    niveau,
                },
                fiches: formattedFiches,
                questions: formattedQuestions,
                total: formattedFiches.length + formattedQuestions.length,
            },
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des contenus liés:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
