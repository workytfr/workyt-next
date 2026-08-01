import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Quiz from "@/models/Quiz";
import authMiddleware from "@/middlewares/authMiddleware";
import { hasPermission } from "@/lib/roles";
import { awardPointsOnce, revokePointsOnce } from "@/lib/pointsService";
import { revalidatePath } from "next/cache";
import { buildIdSlug } from "@/utils/slugify";

const COURSE_AUTHOR_POINTS = 20; // Points gagnés par chaque auteur (cohérent avec /api/courses PATCH)

/**
 * 🚀 GET - Récupérer un cours spécifique (Accès public)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }
        return NextResponse.json(course, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer le cours." },
            { status: 500 }
        );
    }
}

/**
 * 🚀 PUT - Mettre à jour un cours (Réservé aux Auteurs, Correcteurs, Admins)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const body = await req.json();
        // `version` = numéro de version (__v) chargé par le client → verrou optimiste
        const { version, ...updateData } = body;
        const { id } = await params;
        const existingCourse = await Course.findById(id);

        if (!existingCourse) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }

        // Vérification des permissions : auteur du cours, correcteur ou admin
        if (user.role === "Rédacteur" && !existingCourse.authors.includes(user._id)) {
            return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres cours." }, { status: 403 });
        }

        if (!(await hasPermission(user.role, 'course.edit'))) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 🔒 Verrou optimiste : si le client envoie la version chargée, on refuse
        // l'écriture quand le cours a changé entre-temps (évite l'écrasement silencieux
        // du travail d'un autre rédacteur/correcteur).
        let updatedCourse;
        if (typeof version === "number") {
            updatedCourse = await Course.findOneAndUpdate(
                { _id: id, __v: version },
                { $set: updateData, $inc: { __v: 1 } },
                { new: true }
            );
            if (!updatedCourse) {
                return NextResponse.json(
                    {
                        error: "conflict",
                        message:
                            "Ce cours a été modifié par quelqu'un d'autre depuis son ouverture. Rechargez pour récupérer la dernière version avant de sauvegarder (sinon vous écraseriez son travail).",
                    },
                    { status: 409 }
                );
            }
        } else {
            // Rétrocompatibilité : pas de version envoyée → comportement historique
            updatedCourse = await Course.findByIdAndUpdate(id, updateData, { new: true });
        }

        // 🏆 Si le cours est déjà publié et que de nouveaux auteurs sont ajoutés
        // (ex: mise en ligne par un tiers puis ajout des vrais rédacteurs),
        // chaque nouvel auteur reçoit ses points (une seule fois par cours).
        if (
            (updatedCourse as any)?.status === "publie" &&
            Array.isArray(updateData.authors)
        ) {
            const previousAuthorIds = new Set(
                existingCourse.authors.map((a: any) => a.toString())
            );
            const newAuthorIds: string[] = updateData.authors
                .map((a: any) => a?.toString())
                .filter((a: any): a is string => Boolean(a));

            for (const authorId of newAuthorIds) {
                if (previousAuthorIds.has(authorId)) continue;
                try {
                    await awardPointsOnce(authorId, COURSE_AUTHOR_POINTS, "createCourse", {
                        course: id,
                    });
                } catch (e) {
                    console.error("Erreur attribution points nouvel auteur:", (e as any)?.message);
                }
            }

            // 🔻 Auteurs retirés d'un cours publié : on leur retire les points
            // du cours (la transaction est supprimée : un re-ajout légitime
            // pourra être récompensé à nouveau).
            const removedAuthorIds = [...previousAuthorIds].filter(
                (a) => !newAuthorIds.includes(a)
            );
            for (const authorId of removedAuthorIds) {
                try {
                    await revokePointsOnce(authorId, "createCourse", { course: id });
                } catch (e) {
                    console.error("Erreur retrait points auteur:", (e as any)?.message);
                }
            }
        }

        // La page /cours/[coursId] est générée statiquement (SSG) : sans revalidation,
        // les champs édités (matière, niveau, titre…) restent figés sur l'ancienne valeur.
        try {
            const slug = (updatedCourse as any)?.slug || "";
            revalidatePath(`/cours/${buildIdSlug(id, slug)}`);
            revalidatePath("/cours");
        } catch (e) {
            console.error("Revalidation du cours échouée :", (e as any)?.message);
        }

        return NextResponse.json(updatedCourse, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de mettre à jour le cours." },
            { status: 500 }
        );
    }
}

/**
 * 🚀 DELETE - Supprimer un cours (Réservé aux Admins uniquement)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (user.role !== "Admin") {
            return NextResponse.json({ error: "Seul un Admin peut supprimer un cours." }, { status: 403 });
        }

        const { id } = await params;
        const deletedCourse = await Course.findByIdAndDelete(id);
        if (!deletedCourse) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }

        // Suppression cascade : sections, leçons, exercices, quizzes liés
        const sections = await Section.find({ courseId: id });
        const sectionIds = sections.map((s: any) => s._id);

        if (sectionIds.length > 0) {
            await Promise.all([
                Lesson.deleteMany({ sectionId: { $in: sectionIds } }),
                Exercise.deleteMany({ sectionId: { $in: sectionIds } }),
                Quiz.deleteMany({ sectionId: { $in: sectionIds } }),
            ]);
            await Section.deleteMany({ courseId: id });
        }

        return NextResponse.json({ message: "Cours et tout son contenu supprimés avec succès." }, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la suppression du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de supprimer le cours." },
            { status: 500 }
        );
    }
}