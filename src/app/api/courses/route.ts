import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Récupérer les cours avec pagination et recherche (Réservé au staff)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        // 🔒 Vérification des permissions (Accès staff uniquement)
        if (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 📌 Récupération des paramètres
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const authorId = searchParams.get("authorId");
        const niveau = searchParams.get("niveau");
        const matiere = searchParams.get("matiere");

        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        // 🔍 Création des filtres
        const filters: any = {};
        if (search) filters.title = { $regex: search, $options: "i" }; // Recherche insensible à la casse
        if (status) filters.status = status;
        if (authorId) filters.authors = authorId; // Filtrer par auteur
        if (niveau) filters.niveau = niveau; // Filtrer par niveau
        if (matiere) filters.matiere = matiere; // Filtrer par matière

        // 📌 Récupération des cours avec pagination et leurs sections
        const courses = await Course.find(filters)
            .populate("authors", "name") // Charger les noms des auteurs
            .lean()
            .sort({ createdAt: -1 }) // Trier par date décroissante
            .skip(skip)
            .limit(limit);

        // 🏷️ Récupérer les sections des cours
        const courseIds = courses.map(course => course._id);
        const sections = await Section.find({ courseId: { $in: courseIds } }).select("courseId title").lean();

        // 🎯 Associer les sections à leurs cours
        const coursesWithSections = courses.map(course => ({
            ...course,
            sections: sections.filter(section => section.courseId.toString() === course._id.toString()),
        }));

        // 📊 Obtenir le nombre total de documents pour la pagination
        const totalCourses = await Course.countDocuments(filters);

        return NextResponse.json({
            total: totalCourses,
            page,
            limit,
            courses: coursesWithSections, // ✅ Retourne les cours avec leurs sections associées
        }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur lors de la récupération des cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les cours.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 POST - Créer un nouveau cours (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        // 🔒 Vérification de l'authentification et des permissions
        if (!user || !user._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }
        if (!["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 📌 Extraire les données du body
        const body = await req.json();
        const { title, description, niveau, matiere, image } = body;

        if (!title || !description || !niveau || !matiere) {
            return NextResponse.json({ error: "Données obligatoires manquantes." }, { status: 400 });
        }

        // 🏷️ Création du cours
        const newCourse = await Course.create({
            title,
            description,
            niveau,
            matiere,
            authors: [user._id], // L'auteur est l'utilisateur connecté
            image,
            status: "en_attente_verification", // Par défaut, un cours doit être validé
            createdAt: new Date(),
        });

        return NextResponse.json(newCourse, { status: 201 });

    } catch (error: any) {
        console.error("Erreur lors de la création du cours :", error.message);
        return NextResponse.json(
            { error: "Impossible de créer le cours.", details: error.message },
            { status: 500 }
        );
    }
}


