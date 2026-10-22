import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasRole } from "@/lib/userRoles";
import dbConnect from "@/lib/mongodb";
import { slugify } from "@/utils/slugify";
import mongoose from "mongoose";

// Route API temporaire pour générer les slugs SEO sur les documents existants.
// Appeler en POST : /api/admin/generate-slugs
// Réservé aux admins. (En GET avec une simple session, n'importe quel membre —
// ou une balise <img> sur un site tiers — pouvait réécrire toute la base.)
export async function POST(req: NextRequest) {
    try {
        // Vérification d'authentification
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }
        if (!hasRole(session.user, "Admin")) {
            return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            return NextResponse.json({ error: "DB non disponible" }, { status: 500 });
        }

        const results: Record<string, number> = {};

        // Questions
        const questions = db.collection("questions");
        const questionsWithoutSlug = await questions
            .find({ $or: [{ slug: { $exists: false } }, { slug: null }] })
            .toArray();
        let qCount = 0;
        for (const q of questionsWithoutSlug) {
            if (q.title) {
                await questions.updateOne(
                    { _id: q._id },
                    { $set: { slug: slugify(q.title as string) } }
                );
                qCount++;
            }
        }
        results.questions = qCount;

        // Fiches de révision
        const revisions = db.collection("revisions");
        const revisionsWithoutSlug = await revisions
            .find({ $or: [{ slug: { $exists: false } }, { slug: null }] })
            .toArray();
        let fCount = 0;
        for (const f of revisionsWithoutSlug) {
            if (f.title) {
                await revisions.updateOne(
                    { _id: f._id },
                    { $set: { slug: slugify(f.title as string) } }
                );
                fCount++;
            }
        }
        results.fiches = fCount;

        // Cours
        const courses = db.collection("courses");
        const coursesWithoutSlug = await courses
            .find({ $or: [{ slug: { $exists: false } }, { slug: null }] })
            .toArray();
        let cCount = 0;
        for (const c of coursesWithoutSlug) {
            if (c.title) {
                await courses.updateOne(
                    { _id: c._id },
                    { $set: { slug: slugify(c.title as string) } }
                );
                cCount++;
            }
        }
        results.cours = cCount;

        return NextResponse.json({
            success: true,
            message: `Migration terminée : ${qCount + fCount + cCount} slugs générés`,
            details: results,
        });
    } catch (error: any) {
        console.error("Erreur generate-slugs:", error);
        return NextResponse.json(
            { error: "Erreur interne" },
            { status: 500 }
        );
    }
}
