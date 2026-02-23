import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import User from "@/models/User";
import { optionalAuthMiddleware } from "@/middlewares/authMiddleware";
import { Types, isValidObjectId } from "mongoose";
import { escapeRegex } from "@/utils/escapeRegex";

// Forcer le rendu dynamique pour éviter l'erreur
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Tentative de récupération de l'utilisateur (authentification optionnelle)
        const user = await optionalAuthMiddleware(req);

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const niveau = searchParams.get("niveau");
        const matiere = searchParams.get("matiere");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        // Construction des filtres de recherche
        const filters: any = {};
        if (search) filters.title = { $regex: escapeRegex(search), $options: "i" };
        if (niveau) filters.niveau = niveau;
        if (matiere) filters.matiere = matiere;

        // Pour un accès public aux cours, on affiche uniquement ceux qui sont publiés
        // Les utilisateurs avec des rôles spécifiques peuvent voir tous les cours
        if (!user || typeof user.role !== 'string' || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            filters.status = "publie";
        }

        // Récupération des cours avec pagination
        const courses = await Course.find(filters)
            .lean()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Extraction des auteurs en vérifiant que course.authors existe et est un tableau
        const authorIds = [
            ...new Set(
                courses.flatMap(course =>
                    (course.authors || [])
                        .filter(id => isValidObjectId(id))
                        .map(id => new Types.ObjectId(id.toString()))
                )
            ),
        ];
        const authors = await User.find({ _id: { $in: authorIds } })
            .select("_id username image")
            .lean();

        // Récupération des sections associées aux cours (on sélectionne uniquement courseId et title)
        const courseIds = courses.map(course => course._id);
        const sections = await Section.find({ courseId: { $in: courseIds } })
            .select("courseId title")
            .lean();

        // Association des sections et des auteurs à chaque cours
        const coursesWithDetails = courses.map(course => ({
            ...course,
            sections: sections.filter(
                section => section.courseId.toString() === course._id.toString()
            ),
            authors: authors.filter(author =>
                (course.authors || []).some(id => id.toString() === author._id.toString())
            ),
        }));

        // Récupération du nombre total de cours correspondant aux filtres (pour la pagination)
        const totalCourses = await Course.countDocuments(filters);

        return NextResponse.json(
            {
                total: totalCourses,
                page,
                limit,
                courses: coursesWithDetails,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Erreur lors de la récupération des cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les cours." },
            { status: 500 }
        );
    }
}
