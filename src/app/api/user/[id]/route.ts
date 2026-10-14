import { hasRole } from "@/lib/userRoles";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import Revision from "@/models/Revision";

// ✅ Récupère un utilisateur, ses fiches de révision, ses questions et ses réponses
export const GET = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        await connectDB();

        // 🔹 Await the params Promise
        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 📌 Pagination : 50 éléments au plus par page (sinon ?limit=100000 chargeait tout)
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10) || 10));
        const skip = (page - 1) * limit;

        // Tout en parallèle (avant : une dizaine de requêtes l'une après l'autre)
        const [user, totalRevisions, revisions, totalQuestions, questions, totalAnswers, answers] = await Promise.all([
            User.findById(id).select("-password -email").lean<Record<string, any>>(),
            Revision.countDocuments({ author: id }),
            Revision.find({ author: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("title content likes status subject level createdAt comments")
                .lean(),
            Question.countDocuments({ user: id }),
            Question.find({ user: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("title description subject classLevel points createdAt status answers")
                .lean(),
            Answer.countDocuments({ user: id }),
            Answer.find({ user: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("question", "title") // Récupérer le titre de la question associée
                .select("content question createdAt likes status")
                .lean(),
        ]);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const revisionsWithCommentCount = revisions.map((revision) => ({
            ...revision,
            comments: revision.comments?.length || 0,
        }));

        // Nombre de réponses de chaque question : une seule requête groupée (avant : une par question)
        const counts = questions.length
            ? await Answer.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
                  { $match: { question: { $in: questions.map((q) => q._id) } } },
                  { $group: { _id: "$question", n: { $sum: 1 } } },
              ])
            : [];
        const countById = new Map(counts.map((c) => [String(c._id), c.n]));
        const questionsWithAnswerCount = questions.map((question) => ({ ...question, answersCount: countById.get(String(question._id)) ?? 0 }));

        // ✅ Préparer la réponse utilisateur. Le vrai nom n'est donné qu'au membre lui-même et aux admins.
        const session = await getServerSession(authOptions);
        const canSeeName = session?.user?.id === String(user._id) || hasRole(session?.user, "Admin");
        const userResponse = {
            _id: user._id,
            ...(canSeeName ? { name: user.name } : {}),
            username: user.username,
            role: user.role,
            points: user.points,
            badges: user.badges,
            bio: user.bio,
            createdAt: user.createdAt,
        };

        // ✅ Ajouter les données de pagination
        const pagination = {
            totalRevisions,
            totalQuestions,
            totalAnswers,
            totalPages: Math.ceil(Math.max(totalRevisions, totalQuestions, totalAnswers) / limit),
            currentPage: page,
            limit,
        };

        return NextResponse.json(
            {
                data: {
                    user: userResponse,
                    revisions: revisionsWithCommentCount,
                    questions: questionsWithAnswerCount,
                    answers,
                    pagination,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching user, revisions, questions, and answers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};

// ✅ Mise à jour des informations d'un utilisateur
export const PATCH = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        await connectDB();

        // 🔹 Await the params Promise
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const { bio, socialLinks, name, username, badges } = await req.json();
        // authOptions : sans elles, la session n'a ni rôle ni id (un admin était vu comme un membre)
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "You must be logged in to perform this action" },
                { status: 401 }
            );
        }

        // 📌 Vérifier si l'utilisateur existe
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 📌 Vérifier les autorisations (propriétaire ou admin)
        const isAdmin = hasRole(session.user, "Admin");
        if (user.email !== session?.user?.email && !isAdmin) {
            return NextResponse.json(
                { error: "You are not authorized to perform this action" },
                { status: 401 }
            );
        }

        // 📌 Nom d'utilisateur : mêmes règles que le modèle (findByIdAndUpdate ne lance pas
        // ses validateurs). Avant, « Christophe B » passait tel quel ou échouait sans explication.
        const update: Record<string, unknown> = {};
        // Seulement les champs envoyés : un champ absent ne doit pas être effacé
        for (const [k, v] of Object.entries({ bio, socialLinks, name })) if (v !== undefined) update[k] = v;
        if (username !== undefined && username !== user.username) {
            const clean = String(username).trim().toLowerCase();
            if (!/^[a-z0-9][a-z0-9_]{2,19}$/.test(clean)) {
                return NextResponse.json(
                    { error: "Le nom d'utilisateur doit faire 3 à 20 caractères : lettres sans accent, chiffres ou « _ », sans espace." },
                    { status: 400 }
                );
            }
            const taken = await User.exists({ username: clean, _id: { $ne: user._id } });
            if (taken) {
                return NextResponse.json(
                    { error: "Ce nom d'utilisateur est déjà pris. Essaie-en un autre." },
                    { status: 400 }
                );
            }
            update.username = clean;
        }
        // Les badges ne se donnent pas soi-même : réservé aux admins
        if (isAdmin && badges !== undefined) update.badges = badges;

        // 📌 Mettre à jour l'utilisateur
        // runValidators : applique les règles du modèle (bio de 500 caractères au plus…)
        const updatedUser = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select("-password -email");

        return NextResponse.json(
            { message: "User updated successfully", data: updatedUser },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
            const first = error instanceof mongoose.Error.ValidationError ? Object.values(error.errors)[0]?.message : undefined;
            return NextResponse.json({ error: first || "Données invalides" }, { status: 400 });
        }
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};