import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import CurriculumNode from "@/models/CurriculumNode";
import CompetencyProgress from "@/models/CompetencyProgress";

/**
 * GET /api/competencies/by-skills?skills=C4-MATH-01,C4-MATH-02
 * 
 * Récupère les détails des compétences (nom, description, difficulté)
 * avec le statut de progression pour l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const skillsParam = searchParams.get("skills");

    if (!skillsParam) {
      return NextResponse.json({ error: "Paramètre 'skills' requis" }, { status: 400 });
    }

    const skillIds = skillsParam.split(",").map((s) => s.trim()).filter(Boolean);

    if (skillIds.length === 0) {
      return NextResponse.json({ competencies: [] });
    }

    await dbConnect();

    // Find all curriculum nodes that contain these skills
    const curriculumNodes = await CurriculumNode.find({
      "skills.skillId": { $in: skillIds },
    }).lean();

    // Build a map of skillId to skill details
    const skillDetailsMap = new Map();
    for (const node of curriculumNodes) {
      for (const skill of node.skills) {
        if (skillIds.includes(skill.skillId)) {
          skillDetailsMap.set(skill.skillId, {
            skillId: skill.skillId,
            description: skill.description,
            difficulty: skill.difficulty,
            theme: node.theme,
            chapter: node.chapter,
            nodeId: node.nodeId,
          });
        }
      }
    }

    // Get user's progress for these skills
    const userProgress = await CompetencyProgress.find({
      userId: session.user.id,
      skillId: { $in: skillIds },
    }).lean();

    // Build progress map
    const progressMap = new Map();
    for (const progress of userProgress) {
      progressMap.set(progress.skillId, progress);
    }

    // Combine skill details with progress
    const competencies = skillIds.map((skillId) => {
      const details = skillDetailsMap.get(skillId);
      const progress = progressMap.get(skillId);

      return {
        skillId,
        description: details?.description || "",
        difficulty: details?.difficulty || 1,
        theme: details?.theme || "",
        chapter: details?.chapter || "",
        nodeId: details?.nodeId || "",
        status: progress?.status || "not_started",
        bestScore: progress?.bestScore || 0,
        lastScore: progress?.lastScore || 0,
        revisionCount: progress?.revisionCount || 0,
        srsLevel: progress?.srsLevel || 0,
        nextReview: progress?.nextReview || null,
      };
    });

    return NextResponse.json({ competencies });
  } catch (error) {
    console.error("[GET /api/competencies/by-skills] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétences" },
      { status: 500 }
    );
  }
}
