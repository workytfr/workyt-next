import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Revision from "@/models/Revision";

// Récupère un utilisateur par son ID et ses fiches de révision
export const GET = async (_req: Request, { params }: { params: { id: string } }) => {
    const { id } = params;

    try {
        await connectDB();

        // Trouver l'utilisateur
        const user = await User.findById(id).select("-password -email"); // Exclure le mot de passe et l'email
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Trouver les fiches de révision créées par l'utilisateur
        const revisions = await Revision.find({ author: id }).sort({ createdAt: -1 });

        // Préparer une réponse sans email
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

        return NextResponse.json(
            { data: { user: userResponse, revisions } },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching user and revisions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};

// Met à jour un utilisateur par son ID
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

        // Vérifier si l'utilisateur existe
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Vérifier que l'utilisateur connecté est bien le propriétaire ou un admin
        const isAdmin = session.user?.role === "Admin";
        if (user.email !== session?.user?.email && !isAdmin) {
            return NextResponse.json(
                { error: "You are not authorized to perform this action" },
                { status: 401 }
            );
        }

        // Vérifier si le nom d'utilisateur est déjà utilisé
        const isUsernameExist = await User.findOne({ username });
        if (isUsernameExist && isUsernameExist?._id?.toString() !== id) {
            return NextResponse.json(
                { error: "Username already exists. Try a different one." },
                { status: 400 }
            );
        }

        // Mettre à jour les informations de l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { bio, socialLinks, name, username, badges },
            { new: true } // Retourne l'utilisateur mis à jour
        ).select("-password -email"); // Exclure le mot de passe et l'email

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
