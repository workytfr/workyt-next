import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import Section from "@/models/Section";
import CurriculumNode from "@/models/CurriculumNode";
import CompetencyProgress from "@/models/CompetencyProgress";

/**
 * GET /api/competencies/by-course?courseId=xxx
 *
 * Récupère toutes les compétences liées à un cours (via ses quiz)
 * avec le statut de progression de l'utilisateur connecté.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json({ error: "Paramètre 'courseId' requis" }, { status: 400 });
        }

        await dbConnect();

        // 1. Trouver toutes les sections du cours
        const sections = await Section.find({ courseId }).select("_id").lean();
        const sectionIds = sections.map((s: any) => s._id);

        // 2. Trouver tous les quiz de ces sections
        const quizzes = await Quiz.find({ sectionId: { $in: sectionIds } })
            .select("competencies")
            .lean();

        // 3. Collecter tous les skillIds uniques
        const skillIdSet = new Set<string>();
        for (const quiz of quizzes) {
            if (quiz.competencies) {
                for (const skillId of quiz.competencies) {
                    skillIdSet.add(skillId);
                }
            }
        }

        const skillIds = Array.from(skillIdSet);

        if (skillIds.length === 0) {
            return NextResponse.json({ competencies: [] });
        }

        // 4. Trouver les détails des compétences dans CurriculumNode
        const curriculumNodes = await CurriculumNode.find({
            "skills.skillId": { $in: skillIds },
        })
            .select("skills theme chapter nodeId")
            .lean();

        const skillDetailsMap = new Map<string, any>();
        for (const node of curriculumNodes) {
            for (const skill of node.skills) {
                if (skillIdSet.has(skill.skillId)) {
                    skillDetailsMap.set(skill.skillId, {
                        description: skill.description,
                        difficulty: skill.difficulty,
                        theme: node.theme,
                        chapter: node.chapter,
                    });
                }
            }
        }

        // 5. Récupérer la progression de l'utilisateur (si connecté)
        const session = await getServerSession(authOptions);
        const progressMap = new Map<string, any>();

        if (session?.user?.id) {
            const userProgress = await CompetencyProgress.find({
                userId: session.user.id,
                skillId: { $in: skillIds },
            }).lean();

            for (const p of userProgress) {
                progressMap.set(p.skillId, p);
            }
        }

        // 6. Assembler le résultat
        const competencies = skillIds.map((skillId) => {
            const details = skillDetailsMap.get(skillId);
            const progress = progressMap.get(skillId);

            return {
                skillId,
                description: details?.description || skillId,
                difficulty: details?.difficulty || 1,
                theme: details?.theme || "",
                chapter: details?.chapter || "",
                status: progress?.status || "not_started",
                bestScore: progress?.bestScore || 0,
                nextReview: progress?.nextReview || null,
            };
        });

        // Trier par thème puis par description
        competencies.sort((a, b) =>
            a.theme.localeCompare(b.theme) || a.description.localeCompare(b.description)
        );

        return NextResponse.json({ competencies, total: competencies.length });
    } catch (error) {
        console.error("[GET /api/competencies/by-course] Error:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des compétences" },
            { status: 500 }
        );
    }
}
