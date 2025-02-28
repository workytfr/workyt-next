import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import authMiddleware from "@/middlewares/authMiddleware";
import { uploadFiles } from "@/lib/uploadFiles";

/**
 * 🚀 GET - Récupérer toutes les leçons d'une section ou d'un auteur (Accès public)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const sectionId = searchParams.get("sectionId");
        const authorId = searchParams.get("authorId");

        if (!sectionId && !authorId) {
            return NextResponse.json({ error: "sectionId ou authorId est requis." }, { status: 400 });
        }

        const filter: any = {};
        if (sectionId) filter.sectionId = sectionId;
        if (authorId) filter.author = authorId;

        const lessons = await Lesson.find(filter).sort({ order: 1 });
        return NextResponse.json(lessons, { status: 200 });
    } catch (error: any) {
        console.error("Erreur lors de la récupération des leçons :", error.message);
        return NextResponse.json(
            { error: "Impossible de récupérer les leçons.", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * 🚀 POST - Créer une nouvelle leçon (Réservé aux Rédacteurs, Correcteurs, Admins)
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);

        if (!user || !["Rédacteur", "Correcteur", "Admin"].includes(user.role)) {
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

        const newLesson = await Lesson.create({
            sectionId,
            author: user._id,
            title,
            content,
            media: mediaUrls,
            order: 1,
            status: "En attente de correction",
        });

        return NextResponse.json(newLesson, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Impossible de créer la leçon.", details: "" }, { status: 500 });
    }
}