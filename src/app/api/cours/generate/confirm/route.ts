import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";

connectDB();

const ALLOWED_ROLES = ["Admin"];

interface LessonDraft {
    title: string;
    content: string;
    order: number;
}

interface SectionDraft {
    title: string;
    order: number;
    lessons: LessonDraft[];
}

interface CourseDraft {
    title: string;
    matiere: string;
    niveau: string;
    description?: string;
    sections: SectionDraft[];
    useWorkytV1?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { success: false, message: "Non autorisé." },
                { status: 401 }
            );
        }

        if (!ALLOWED_ROLES.includes(user.role)) {
            return NextResponse.json(
                { success: false, message: "Rôle insuffisant." },
                { status: 403 }
            );
        }

        const draft: CourseDraft = await req.json();

        if (!draft.title || !draft.matiere || !draft.niveau || !draft.sections?.length) {
            return NextResponse.json(
                { success: false, message: "Titre, matière, niveau et au moins une section requis." },
                { status: 400 }
            );
        }

        // Déterminer l'auteur : Workyt V1 (migration) ou utilisateur connecté
        let authorId: any = user._id;
        if (draft.useWorkytV1) {
            const workytV1Id = process.env.WORKYT_V1_USER_ID;
            if (!workytV1Id) {
                return NextResponse.json(
                    { success: false, message: "WORKYT_V1_USER_ID non configuré dans les variables d'environnement." },
                    { status: 500 }
                );
            }
            authorId = workytV1Id;
        }

        // Créer le cours
        const course: any = await Course.create({
            title: draft.title,
            description: draft.description || `Cours de ${draft.matiere} - ${draft.niveau}`,
            authors: [authorId],
            status: "en_attente_verification",
            niveau: draft.niveau,
            matiere: draft.matiere,
        });

        // Créer les sections et leçons
        for (const sectionDraft of draft.sections) {
            const section: any = await Section.create({
                courseId: course._id,
                title: sectionDraft.title,
                order: sectionDraft.order,
            });

            if (sectionDraft.lessons?.length) {
                const lessonDocs = sectionDraft.lessons.map((lesson) => ({
                    sectionId: section._id,
                    author: authorId,
                    title: lesson.title,
                    content: lesson.content,
                    order: lesson.order,
                    status: "En attente de correction",
                }));
                await Lesson.insertMany(lessonDocs);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Cours créé avec succès !",
            courseId: course._id.toString(),
        });
    } catch (error: any) {
        console.error("Erreur confirmation cours:", error.message);
        return NextResponse.json(
            { success: false, message: "Erreur lors de la création du cours." },
            { status: 500 }
        );
    }
}
