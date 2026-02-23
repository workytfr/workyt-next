import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import authMiddleware from "@/middlewares/authMiddleware";

connectDB();

// PATCH /api/bookmarks/collections - Rename or delete a collection
export async function PATCH(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { success: false, message: "Non autorisé." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { action, name, oldName, newName } = body;

        if (action === 'rename') {
            if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
                return NextResponse.json(
                    { success: false, message: "oldName et newName requis." },
                    { status: 400 }
                );
            }
            const trimmed = newName.trim();
            if (trimmed.length === 0 || trimmed.length > 50) {
                return NextResponse.json(
                    { success: false, message: "Le nom doit faire entre 1 et 50 caractères." },
                    { status: 400 }
                );
            }
            const result = await Bookmark.updateMany(
                { user: user._id, collectionName: oldName.trim() },
                { collectionName: trimmed }
            );
            return NextResponse.json({
                success: true,
                message: `Collection renommée (${result.modifiedCount} éléments mis à jour).`,
                modifiedCount: result.modifiedCount,
            });
        }

        if (action === 'delete') {
            const collectionName = name?.trim();
            if (!collectionName) {
                return NextResponse.json(
                    { success: false, message: "Nom de collection requis." },
                    { status: 400 }
                );
            }
            // Déplacer les bookmarks vers "Mes favoris" au lieu de les supprimer
            const result = await Bookmark.updateMany(
                { user: user._id, collectionName },
                { collectionName: "Mes favoris" }
            );
            return NextResponse.json({
                success: true,
                message: `Collection supprimée. ${result.modifiedCount} élément(s) déplacé(s) vers "Mes favoris".`,
                modifiedCount: result.modifiedCount,
            });
        }

        return NextResponse.json(
            { success: false, message: "Action invalide. Utilisez 'rename' ou 'delete'." },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("Erreur bookmarks collections PATCH:", error.message);
        return NextResponse.json(
            { success: false, message: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}

// GET /api/bookmarks/collections - List user's collections with counts
export async function GET(req: NextRequest) {
    try {
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { success: false, message: "Non autorisé." },
                { status: 401 }
            );
        }

        const collections = await Bookmark.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: "$collectionName",
                    count: { $sum: 1 },
                    lastAdded: { $max: "$createdAt" },
                },
            },
            { $sort: { lastAdded: -1 } },
            {
                $project: {
                    name: "$_id",
                    count: 1,
                    lastAdded: 1,
                    _id: 0,
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            data: collections,
        });
    } catch (error: any) {
        console.error("Erreur bookmarks collections:", error.message);
        return NextResponse.json(
            { success: false, message: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}
