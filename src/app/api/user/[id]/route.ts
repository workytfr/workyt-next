import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import Revision from "@/models/Revision";

// ✅ Récupère un utilisateur, ses fiches de révision, ses questions et ses réponses
export const GET = async (req: Request, { params }: { params: { id: string } }) => {
    const { id } = params;

    try {
        await connectDB();

        // 📌 Récupération des paramètres de pagination
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = parseInt(url.searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        // 📌 Vérifier si l'utilisateur existe
        const user = await User.findById(id).select("-password -email");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // ✅ Récupération des fiches de révision de l'utilisateur
        const totalRevisions = await Revision.countDocuments({ author: id });
        const revisions = await Revision.find({ author: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("title content likes status subject level createdAt comments")
            .lean();

        const revisionsWithCommentCount = revisions.map((revision) => ({
            ...revision,
            comments: revision.comments?.length || 0,
        }));

        // ✅ Récupération des questions posées par l'utilisateur
        const totalQuestions = await Question.countDocuments({ user: id });
        const questions = await Question.find({ user: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("title description subject classLevel points createdAt status answers")
            .lean();

        const questionsWithAnswerCount = await Promise.all(
            questions.map(async (question) => {
                const count = await Answer.countDocuments({ question: question._id });
                return { ...question, answersCount: count };
            })
        );

        // ✅ Récupération des réponses données par l'utilisateur
        const totalAnswers = await Answer.countDocuments({ user: id });
        const answers = await Answer.find({ user: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("question", "title") // Récupérer le titre de la question associée
            .select("content question createdAt likes status")
            .lean();

        // ✅ Préparer la réponse utilisateur
        const userResponse = {
            _id: user._id,
            name: user.name,
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
export const PATCH = async (req: Request, { params }: { params: { id: string } }) => {
    try {
        await connectDB();
        const { id } = params;
        const { bio, socialLinks, name, username, badges } = await req.json();
        const session = await getServerSession();

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
        const isAdmin = session.user?.role === "Admin";
        if (user.email !== session?.user?.email && !isAdmin) {
            return NextResponse.json(
                { error: "You are not authorized to perform this action" },
                { status: 401 }
            );
        }

        // 📌 Vérifier si le nom d'utilisateur est déjà utilisé
        const isUsernameExist = await User.findOne({ username });
        if (isUsernameExist && isUsernameExist?._id?.toString() !== id) {
            return NextResponse.json(
                { error: "Username already exists. Try a different one." },
                { status: 400 }
            );
        }

        // 📌 Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { bio, socialLinks, name, username, badges },
            { new: true }
        ).select("-password -email");

        return NextResponse.json(
            { message: "User updated successfully", data: updatedUser },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};
