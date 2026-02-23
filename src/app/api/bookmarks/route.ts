import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import Revision from "@/models/Revision";
import Question from "@/models/Question";
import Course from "@/models/Course";
import Exercise from "@/models/Exercise";
import Section from "@/models/Section";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";

connectDB();

function handleError(message: string, status: number = 500) {
    return NextResponse.json({ success: false, message }, { status });
}

// Récupère l'identifiant effectif (refId ou revision pour compat)
function getRefId(b: any): string | null {
    if (b.refId) return b.refId.toString();
    if (b.revision) return b.revision.toString();
    return null;
}

function getContentType(b: any): 'fiche' | 'forum' | 'cours' | 'exercise' {
    if (b.contentType) return b.contentType;
    if (b.revision) return 'fiche';
    return 'fiche';
}

// POST /api/bookmarks - Toggle bookmark (add/remove)
// Accepte: revisionId (fiche), questionId (forum), courseId (cours)
export async function POST(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return handleError("Non autorisé. Veuillez vous connecter.", 401);
        }

        const body = await req.json();
        const { revisionId, questionId, courseId, exerciseId, collection } = body;

        let contentType: 'fiche' | 'forum' | 'cours' | 'exercise';
        let refId: string;

        if (revisionId && mongoose.Types.ObjectId.isValid(revisionId)) {
            contentType = 'fiche';
            refId = revisionId;
            const revision = await Revision.findById(revisionId);
            if (!revision) return handleError("Fiche non trouvée.", 404);
        } else if (questionId && mongoose.Types.ObjectId.isValid(questionId)) {
            contentType = 'forum';
            refId = questionId;
            const question = await Question.findById(questionId);
            if (!question) return handleError("Question non trouvée.", 404);
        } else if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
            contentType = 'cours';
            refId = courseId;
            const course = await Course.findById(courseId);
            if (!course) return handleError("Cours non trouvé.", 404);
        } else if (exerciseId && mongoose.Types.ObjectId.isValid(exerciseId)) {
            contentType = 'exercise';
            refId = exerciseId;
            const exercise = await Exercise.findById(exerciseId);
            if (!exercise) return handleError("Exercice non trouvé.", 404);
        } else {
            return handleError("ID invalide. Fournissez revisionId, questionId, courseId ou exerciseId.", 400);
        }

        const userId = user._id.toString();

        // Chercher un bookmark existant (revision OU contentType+refId pour compat)
        const existing = await Bookmark.findOne({
            user: userId,
            $or: [
                { revision: refId },
                { contentType, refId: new mongoose.Types.ObjectId(refId) },
            ],
        });

        if (existing) {
            await Bookmark.deleteOne({ _id: existing._id });
            return NextResponse.json({
                success: true,
                message: contentType === 'fiche' ? "Fiche retirée des favoris." :
                    contentType === 'forum' ? "Question retirée des favoris." :
                    contentType === 'exercise' ? "Exercice retiré des favoris." : "Cours retiré des favoris.",
                bookmarked: false,
            });
        }

        await Bookmark.create({
            user: userId,
            contentType,
            refId: new mongoose.Types.ObjectId(refId),
            ...(contentType === 'fiche' && { revision: refId }),
            collectionName: collection || "Mes favoris",
        });

        try {
            const { QuestService } = await import("@/lib/questService");
            await QuestService.updateQuestProgress(userId, "fiche_bookmark");
        } catch {
            // Silencieux
        }

        return NextResponse.json({
            success: true,
            message: contentType === 'fiche' ? "Fiche ajoutée aux favoris !" :
                contentType === 'forum' ? "Question ajoutée aux favoris !" :
                contentType === 'exercise' ? "Exercice ajouté aux favoris !" : "Cours ajouté aux favoris !",
            bookmarked: true,
        });
    } catch (error: any) {
        console.error("Erreur bookmarks POST:", error.message);
        return handleError("Erreur interne du serveur.");
    }
}

// GET /api/bookmarks - List user's bookmarks (paginé)
// Query: page, limit, contentType (fiche|forum|cours), collection
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return handleError("Non autorisé. Veuillez vous connecter.", 401);
        }

        const { searchParams } = new URL(req.url);
        const collection = searchParams.get("collection") || "";
        const contentType = searchParams.get("contentType") || ""; // fiche | forum | cours
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

        const query: any = { user: user._id };
        if (collection) query.collectionName = collection;
        if (contentType === 'fiche') {
            query.$or = [{ contentType: 'fiche' }, { revision: { $exists: true, $ne: null } }];
        } else if (contentType === 'forum' || contentType === 'cours' || contentType === 'exercise') {
            query.contentType = contentType;
        }

        const total = await Bookmark.countDocuments(query);
        const bookmarks = await Bookmark.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const results: any[] = [];

        for (const b of bookmarks) {
            const type = getContentType(b);
            const id = getRefId(b);
            if (!id) continue;

            if (type === 'fiche') {
                const rev = await Revision.findById(id).populate('author', 'username points _id role').lean();
                if (!rev) continue;
                const revAny = rev as any;
                results.push({
                    bookmarkId: b._id,
                    contentType: 'fiche',
                    refId: id,
                    collection: b.collectionName,
                    bookmarkedAt: b.createdAt,
                    id: id,
                    title: revAny.title,
                    content: revAny.content,
                    likes: revAny.likes,
                    comments: revAny.comments?.length || 0,
                    status: revAny.status,
                    level: revAny.level,
                    subject: revAny.subject,
                    createdAt: revAny.createdAt,
                    authors: revAny.author,
                    href: `/fiches/${id}`,
                });
            } else if (type === 'forum') {
                const q = await Question.findById(id).populate('user', 'username points _id').lean();
                if (!q) continue;
                const qAny = q as any;
                const desc = qAny.description || {};
                results.push({
                    bookmarkId: b._id,
                    contentType: 'forum',
                    refId: id,
                    collection: b.collectionName,
                    bookmarkedAt: b.createdAt,
                    id: id,
                    title: qAny.title,
                    content: (() => {
                        const t = ((desc.whatIDid || '') + ' ' + (desc.whatINeed || '')).trim();
                        return t.length > 150 ? t.slice(0, 150) + '...' : t;
                    })(),
                    subject: qAny.subject,
                    classLevel: qAny.classLevel,
                    points: qAny.points,
                    status: qAny.status,
                    createdAt: qAny.createdAt,
                    authors: qAny.user,
                    href: `/forum/${id}`,
                });
            } else if (type === 'cours') {
                const c = await Course.findById(id).populate('authors', 'username _id').lean();
                if (!c) continue;
                const cAny = c as any;
                results.push({
                    bookmarkId: b._id,
                    contentType: 'cours',
                    refId: id,
                    collection: b.collectionName,
                    bookmarkedAt: b.createdAt,
                    id: id,
                    title: cAny.title,
                    content: cAny.description,
                    subject: cAny.matiere,
                    level: cAny.niveau,
                    createdAt: cAny.createdAt,
                    authors: cAny.authors?.[0],
                    image: cAny.image,
                    href: `/cours/${id}`,
                });
            } else if (type === 'exercise') {
                const ex = await Exercise.findById(id).populate('author', 'username points _id').lean();
                if (!ex) continue;
                const exAny = ex as any;
                // Remonter Section → Course pour récupérer matière/niveau
                let subject = '';
                let level = '';
                let courseId = '';
                const section = await Section.findById(exAny.sectionId).lean();
                if (section) {
                    const sAny = section as any;
                    const course = await Course.findById(sAny.courseId).lean();
                    if (course) {
                        const courseAny = course as any;
                        subject = courseAny.matiere || '';
                        level = courseAny.niveau || '';
                        courseId = courseAny._id.toString();
                    }
                }
                const contentPreview = exAny.content?.length > 150 ? exAny.content.slice(0, 150) + '...' : exAny.content;
                results.push({
                    bookmarkId: b._id,
                    contentType: 'exercise',
                    refId: id,
                    collection: b.collectionName,
                    bookmarkedAt: b.createdAt,
                    id: id,
                    title: exAny.title,
                    content: contentPreview,
                    difficulty: exAny.difficulty,
                    subject,
                    level,
                    createdAt: exAny.createdAt || b.createdAt,
                    authors: exAny.author,
                    href: courseId ? `/cours/${courseId}` : '#',
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: results,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                total,
            },
        });
    } catch (error: any) {
        console.error("Erreur bookmarks GET:", error.message);
        return handleError("Erreur interne du serveur.");
    }
}
