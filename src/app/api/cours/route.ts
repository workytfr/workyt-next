import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import User from "@/models/User";
import authMiddleware from "@/middlewares/authMiddleware";
import { Types, isValidObjectId } from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Tentative de récupération de l'utilisateur (authentification optionnelle)
        let user = null;
        try {
            user = await authMiddleware(req);
        } catch (err) {
            user = null;
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const niveau = searchParams.get("niveau");
        const matiere = searchParams.get("matiere");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        // Construction des filtres de recherche
        const filters: any = {};
        if (search) filters.title = { $regex: search, $options: "i" };
        if (niveau) filters.niveau = niveau;
        if (matiere) filters.matiere = matiere;

        // Si l'utilisateur n'est pas connecté ou n'est pas du staff, afficher uniquement les cours publiés
        if (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            filters.status = "publie";
        }

        // Récupération des cours avec pagination
        const courses = await Course.find(filters)
            .lean()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Récupération des auteurs
        const authorIds = [...new Set(courses.flatMap(course => course.authors.filter(id => isValidObjectId(id)).map(id => new Types.ObjectId(id.toString()))))];
        const authors = await User.find({ _id: { $in: authorIds } }).select("_id username image").lean();

        // Récupération des sections pour les cours récupérés (on sélectionne uniquement l'id et le titre)
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
            authors: authors.filter(author => course.authors.some(id => id.toString() === author._id.toString())),
        }));

        // Récupérer le nombre total de cours correspondant aux filtres (pour la pagination)
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
            { error: "Impossible de récupérer les cours.", details: error.message },
            { status: 500 }
        );
    }
}
