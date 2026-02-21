import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Course from "@/models/Course";
import Section from "@/models/Section";
import connectDB from "@/lib/mongodb";
import { escapeRegex } from "@/utils/escapeRegex";

/**
 * 🚀 GET - Récupérer les cours avec pagination et recherche avancée (Réservé au staff)
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        // 🔒 Vérification des permissions (Accès staff uniquement)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        // 📌 Récupération des paramètres
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const niveau = searchParams.get("niveau");
        const matiere = searchParams.get("matiere");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";
        const hasSections = searchParams.get("hasSections");
        const authorId = searchParams.get("authorId");

        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        // 🔍 Création des filtres
        const filters: any = {};
        
        // Recherche textuelle
        if (search) {
            const escaped = escapeRegex(search);
            filters.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { description: { $regex: escaped, $options: "i" } },
            ];
        }
        
        if (status && status !== "all") filters.status = status;
        if (niveau && niveau !== "all") filters.niveau = niveau;
        if (matiere && matiere !== "all") filters.matiere = matiere;
        if (authorId && authorId !== "all") filters.authors = authorId;

        // Configuration du tri
        const sortConfig: any = {};
        sortConfig[sortBy] = sortOrder === "asc" ? 1 : -1;

        // 📌 Récupération des cours avec pagination et leurs sections
        const courses = await Course.find(filters)
            .populate("authors", "name")
            .lean()
            .sort(sortConfig)
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

        // 🔍 Filtre par sections si demandé
        let filteredCourses = coursesWithSections;
        if (hasSections === "true") {
            filteredCourses = coursesWithSections.filter(course => course.sections.length > 0);
        }

        // 📈 Calculer les statistiques
        const stats = await Promise.all([
            Course.countDocuments(),
            Course.countDocuments({ status: "publie" }),
            Course.countDocuments({ status: { $in: ["en_attente_verification", "en_attente_publication"] } }),
            Course.countDocuments({ status: "annule" }),
            Course.aggregate([
                {
                    $lookup: {
                        from: "sections",
                        localField: "_id",
                        foreignField: "courseId",
                        as: "sections"
                    }
                },
                {
                    $match: {
                        "sections.0": { $exists: true }
                    }
                },
                {
                    $count: "count"
                }
            ]),
            Course.aggregate([
                {
                    $group: {
                        _id: "$niveau",
                        count: { $sum: 1 }
                    }
                }
            ]),
            Course.aggregate([
                {
                    $group: {
                        _id: "$matiere",
                        count: { $sum: 1 }
                    }
                }
            ]),
            Course.aggregate([
                {
                    $lookup: {
                        from: "sections",
                        localField: "_id",
                        foreignField: "courseId",
                        as: "sections"
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgSections: { $avg: { $size: "$sections" } }
                    }
                }
            ]),
            Course.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            })
        ]);

        const [
            total,
            published,
            pending,
            cancelled,
            withSectionsResult,
            byLevel,
            bySubject,
            avgSectionsResult,
            recentCourses
        ] = stats;

        const withSections = withSectionsResult[0]?.count || 0;
        const avgSectionsPerCourse = avgSectionsResult[0]?.avgSections || 0;

        const byLevelMap = byLevel.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);

        const bySubjectMap = bySubject.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            total: totalCourses,
            page,
            limit,
            totalPages: Math.ceil(totalCourses / limit),
            courses: filteredCourses,
            stats: {
                total,
                published,
                pending,
                cancelled,
                withSections,
                byLevel: byLevelMap,
                bySubject: bySubjectMap,
                recentCourses,
                avgSectionsPerCourse
            }
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
        await connectDB();
        const session = await getServerSession(authOptions);

        // 🔒 Vérification de l'authentification et des permissions
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        // Vérifier que l'utilisateur a les droits appropriés
        if (session.user.role !== 'Admin' && session.user.role !== 'Rédacteur' && session.user.role !== 'Correcteur') {
            return NextResponse.json({ error: 'Accès refusé. Seuls les Admins, rédacteurs et correcteurs peuvent créer des cours.' }, { status: 403 });
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
            authors: [session.user.id], // L'auteur est l'utilisateur connecté
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

/**
 * 🚀 PATCH - Mettre à jour le statut d'un cours (Réservé à l'Admin)
 */
export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        // 🔒 Vérification des permissions (Accès Admin uniquement)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        if (session.user.role !== 'Admin') {
            return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
        }

        // 📌 Extraire les données du body
        const { courseId, newStatus } = await req.json();

        if (!courseId || !newStatus) {
            return NextResponse.json(
                { error: "Paramètres manquants (courseId, newStatus)." },
                { status: 400 }
            );
        }

        // 🔐 Vérification du statut autorisé
        const ALLOWED_STATUSES = [
            "en_attente_publication",
            "en_attente_verification",
            "publie",
            "annule",
        ];
        if (!ALLOWED_STATUSES.includes(newStatus)) {
            return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
        }

        // 🔄 Mise à jour du cours
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                status: newStatus,
                updatedAt: new Date(), // on met à jour la date de modification
            },
            { new: true } // Renvoie le document après mise à jour
        );

        if (!updatedCourse) {
            return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
        }

        return NextResponse.json(
            {
                message: "Statut du cours mis à jour avec succès.",
                course: updatedCourse,
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut :", error.message);
        return NextResponse.json(
            { error: "Erreur interne du serveur.", details: error.message },
            { status: 500 }
        );
    }
}

