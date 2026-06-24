import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer les auteurs et contributeurs d'un cours
 *
 * - authors      : auteurs principaux du cours (course.authors)
 * - correctors   : correcteurs ayant validé au moins une leçon du cours (validatedBy)
 * - contributors : auteurs (distincts) des leçons, exercices et quiz du cours qui ne
 *                  sont pas déjà auteurs principaux, avec le détail de leurs contributions.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const { id } = await params;

        const course = await Course.findById(id).populate(
            "authors",
            "name username role points"
        );
        if (!course) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }

        const authorIds = new Set((course.authors as any[]).map((a) => String(a._id)));

        // Récupérer toutes les sections du cours
        const sections = await Section.find({ courseId: id }).select("_id");
        const sectionIds = sections.map((s) => s._id);

        // Récupérer les auteurs des leçons / exercices / quiz + les correcteurs (validatedBy)
        const [lessons, exercises, quizzes] = await Promise.all([
            Lesson.find({ sectionId: { $in: sectionIds } }).select("author validatedBy"),
            Exercise.find({ sectionId: { $in: sectionIds } }).select("author"),
            Quiz.find({ sectionId: { $in: sectionIds } }).select("author"),
        ]);

        // Comptabiliser les contributions par utilisateur
        type Contrib = { lessons: number; exercises: number; quizzes: number };
        const contribMap = new Map<string, Contrib>();

        const bump = (uid: string, key: keyof Contrib) => {
            if (!uid || uid === "null" || uid === "undefined") return;
            const current = contribMap.get(uid) || { lessons: 0, exercises: 0, quizzes: 0 };
            current[key] += 1;
            contribMap.set(uid, current);
        };

        // Correcteurs distincts ayant validé une leçon
        const correctorIds = new Set<string>();

        for (const l of lessons) {
            bump(String((l as any).author), "lessons");
            const validator = (l as any).validatedBy;
            if (validator) correctorIds.add(String(validator));
        }
        for (const e of exercises) bump(String((e as any).author), "exercises");
        for (const q of quizzes) bump(String((q as any).author), "quizzes");

        // Exclure les auteurs principaux des contributeurs (ils sont déjà affichés)
        const contributorIds = [...contribMap.keys()].filter((uid) => !authorIds.has(uid));

        // Charger en une fois tous les utilisateurs nécessaires (contributeurs + correcteurs)
        const allUserIds = [...new Set([...contributorIds, ...correctorIds])];
        const users = await User.find({ _id: { $in: allUserIds } }).select(
            "name username role points"
        );
        const userMap = new Map(users.map((u: any) => [String(u._id), u]));

        const toBasic = (u: any) => ({
            _id: String(u._id),
            name: u.name,
            username: u.username,
            role: u.role,
            points: u.points,
        });

        const contributors = contributorIds
            .map((uid) => userMap.get(uid))
            .filter(Boolean)
            .map((u: any) => ({
                ...toBasic(u),
                contributions: contribMap.get(String(u._id)) || {
                    lessons: 0,
                    exercises: 0,
                    quizzes: 0,
                },
            }))
            // Trier : plus de contributions en premier
            .sort((a, b) => {
                const sum = (c: Contrib) => c.lessons + c.exercises + c.quizzes;
                return sum(b.contributions) - sum(a.contributions);
            });

        const correctors = [...correctorIds]
            .map((uid) => userMap.get(uid))
            .filter(Boolean)
            .map((u: any) => toBasic(u));

        return NextResponse.json(
            {
                authors: (course.authors as any[]).map((a) => ({
                    _id: String(a._id),
                    name: a.name,
                    username: a.username,
                    role: a.role,
                    points: a.points,
                })),
                correctors,
                contributors,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Erreur lors de la récupération des contributeurs :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les contributeurs." },
            { status: 500 }
        );
    }
}
