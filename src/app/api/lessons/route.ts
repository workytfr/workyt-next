import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";
import { uploadFiles } from "@/lib/uploadFiles";
import { handleApiError } from "@/utils/apiErrorResponse";
import { escapeRegex } from "@/utils/escapeRegex";
import { hasPermission } from "@/lib/roles";

/**
 * 🚀 GET - Récupérer les leçons avec pagination et recherche avancée
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        // 🔒 Vérification des permissions (Accès staff uniquement)
        if (!user || !(await hasPermission(user.role, 'lesson.create'))) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 📌 Récupération des paramètres
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const courseId = searchParams.get("courseId");
        const sectionId = searchParams.get("sectionId");
        const authorId = searchParams.get("authorId");
        const sortBy = searchParams.get("sortBy") || "order";
        const sortOrder = searchParams.get("sortOrder") || "asc";
        const hasMedia = searchParams.get("hasMedia");
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
                { content: { $regex: escaped, $options: "i" } },
            ];
        }

        if (status && status !== "all") filters.status = status;
        if (authorId && authorId !== "all") filters.author = authorId;

        // 🔍 Filtre par cours et section (AVANT la requête)
        if (sectionId && sectionId !== "all") {
            filters.sectionId = sectionId;
        } else if (courseId && courseId !== "all") {
            const courseSections = await Section.find({ courseId }).select("_id");
            const sectionIds = courseSections.map(s => s._id);
            filters.sectionId = { $in: sectionIds };
        }

        // 🔍 Filtre par média
        if (hasMedia === "true") {
            filters.media = { $exists: true, $ne: [], $not: { $size: 0 } };
        }

        // Configuration du tri
        const sortConfig: any = {};
        sortConfig[sortBy] = sortOrder === "asc" ? 1 : -1;

        // 📊 Obtenir le nombre total de documents pour la pagination
        const totalLessons = await Lesson.countDocuments(filters);

        // 📌 Récupération des leçons avec pagination
        const lessons = await Lesson.find(filters)
            .populate("author", "name")
            .populate({
                path: "sectionId",
                populate: {
                    path: "courseId",
                    select: "title"
                }
            })
            .lean()
            .sort(sortConfig)
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            total: totalLessons,
            page,
            limit,
            totalPages: Math.ceil(totalLessons / limit),
            lessons,
        }, { status: 200 });

    } catch (error: any) {
        return handleApiError(error, "Impossible de récupérer les leçons.");
    }
}

/**
 * 🚀 POST - Créer une nouvelle leçon (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !(await hasPermission(user.role, 'lesson.create'))) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        const formData = await req.formData();
        const sectionId = formData.get("sectionId");
        const title = formData.get("title");
        const content = formData.get("content");

        let mediaUrls: string[] = [];
        const files = formData.getAll("media") as File[];

        if (files.length > 0) {
            mediaUrls = await uploadFiles(files);
        }

        // Déterminer l'ordre de la nouvelle leçon
        const lastLesson = await Lesson.findOne({ sectionId }).sort({ order: -1 });
        const newOrder = lastLesson ? lastLesson.order + 1 : 1;

        const newLesson = await Lesson.create({
            sectionId,
            author: user._id,
            title,
            content,
            media: mediaUrls,
            order: newOrder,
            status: "En attente de correction",
        });

        return NextResponse.json(newLesson, { status: 201 });

    } catch (error: any) {
        return handleApiError(error, "Impossible de créer la leçon.");
    }
}

/**
 * 🚀 PATCH - Mettre à jour le statut d'une leçon (Réservé aux Correcteurs et Admins)
 */
export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        // 🔒 Vérification des permissions (Accès Correcteur et Admin uniquement)
        if (!user || !(await hasPermission(user.role, 'lesson.approve'))) {
            return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
        }

        // 📌 Extraire les données du body
        const { lessonId, newStatus } = await req.json();

        if (!lessonId || !newStatus) {
            return NextResponse.json(
                { error: "Paramètres manquants (lessonId, newStatus)." },
                { status: 400 }
            );
        }

        // 🔐 Vérification du statut autorisé
        const ALLOWED_STATUSES = [
            "En attente de correction",
            "En cours de rédaction",
            "Validée",
            "Brouillon",
        ];
        if (!ALLOWED_STATUSES.includes(newStatus)) {
            return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
        }

        // 🔄 Mise à jour de la leçon
        const updatedLesson = await Lesson.findByIdAndUpdate(
            lessonId,
            {
                status: newStatus,
                updatedAt: new Date(), // on met à jour la date de modification
            },
            { new: true } // Renvoie le document après mise à jour
        ).populate("author", "name")
         .populate({
             path: "sectionId",
             populate: {
                 path: "courseId",
                 select: "title"
             }
         });

        if (!updatedLesson) {
            return NextResponse.json({ error: "Leçon introuvable." }, { status: 404 });
        }

        return NextResponse.json(
            {
                message: "Statut de la leçon mis à jour avec succès.",
                lesson: updatedLesson,
            },
            { status: 200 }
        );

    } catch (error: any) {
        return handleApiError(error, "Erreur interne du serveur.");
    }
}