import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import { escapeRegex } from "@/utils/escapeRegex";
import { generateSignedUrl, extractFileKeyFromUrl } from "@/lib/b2Utils";

/**
 * Lien signé vers la première image d'une fiche (les fichiers sont privés),
 * même calcul de clé que GET /api/fiches/[id]. null en cas d'échec.
 */
async function signedCover(fileUrl: string): Promise<string | null> {
    try {
        let fileKey = extractFileKeyFromUrl(fileUrl);
        if (!fileKey) {
            const rawKey = fileUrl.split("/").pop()?.split("?")[0] || "";
            fileKey = rawKey.includes("/") ? rawKey : `fiches/${decodeURIComponent(rawKey)}`;
        }
        return await generateSignedUrl(process.env.S3_BUCKET_NAME!, fileKey);
    } catch {
        return null;
    }
}

connectDB();

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const level = searchParams.get("level");
    const subject = searchParams.get("subject");
    // « popular » : les plus aimées d'abord (carrousel de l'app mobile)
    const sort = searchParams.get("sort") === "popular" ? { likes: -1 as const, createdAt: -1 as const } : { createdAt: -1 as const };
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10) || 12, 1), 100);

    const skip = (page - 1) * limit;

    try {
        const filter: any = {};

        if (query) {
            const escaped = escapeRegex(query);
            filter.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { content: { $regex: escaped, $options: "i" } },
            ];
        }

        if (level) filter.level = level;
        if (subject) filter.subject = subject;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const fiches = await Revision.find(filter)
            .populate("author", "username points role _id")
            .populate("courseId", "title slug")
            .select("title content likes comments status level subject courseId createdAt files")
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const isImage = (url: string) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
        const results = await Promise.all(fiches.map(async (fiche) => ({
            id: fiche._id,
            title: fiche.title,
            authors: fiche.author,
            content: fiche.content,
            likes: fiche.likes,
            comments: fiche.comments?.length || 0,
            status: fiche.status,
            level: fiche.level,
            subject: fiche.subject,
            course: fiche.courseId || null,
            createdAt: fiche.createdAt,
            // Aperçu pour les vignettes : première image jointe, et nature des fichiers
            cover: await (async () => {
                const first = (fiche.files || []).find(isImage);
                return first ? signedCover(first) : null;
            })(),
            fileCount: fiche.files?.length || 0,
            hasPdf: (fiche.files || []).some((f: string) => /\.pdf(\?|$)/i.test(f)),
        })));

        const totalResults = await Revision.countDocuments(filter);

        return NextResponse.json({
            success: true,
            data: results,
            pagination: {
                total: totalResults,
                page,
                limit,
                totalPages: Math.ceil(totalResults / limit),
            },
        });
    } catch (error: any) {
        console.error("Erreur lors de la recherche :", error.message);
        return NextResponse.json({ success: false, message: "Erreur lors de la recherche." }, { status: 500 });
    }
};
