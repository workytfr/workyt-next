import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import Question from "@/models/Question";
import User from "@/models/User";
import Lesson from "@/models/Lesson";
import Exercise from "@/models/Exercise";
import Section from "@/models/Section";
import Course from "@/models/Course";
import PointTransaction from "@/models/PointTransaction";
import authMiddleware from "@/middlewares/authMiddleware";
import dbConnect from "@/lib/mongodb";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
});

async function uploadFileToR2(file: File): Promise<string> {
    const sanitized = file.name.replace(/[<>:"/\\|?*]+/g, "_");
    const key = `uploads/${uuidv4()}-${sanitized}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
    );
    return key;
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await authMiddleware(req);
        if (!user?._id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        const rl = rateLimit(`forum-creer:${user._id}`, 5, 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const formData = await req.formData();
        const title = formData.get("title") as string;
        const whatIDid = formData.get("whatIDid") as string;
        const whatINeed = formData.get("whatINeed") as string;
        const points = parseInt(formData.get("points") as string, 10);
        const contextType = formData.get("contextType") as string;
        const contextId = formData.get("contextId") as string;

        if (!title || !whatIDid || !whatINeed || isNaN(points) || !contextType || !contextId) {
            return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
        }
        if (points < 1 || points > 15) {
            return NextResponse.json({ error: "Les points doivent être entre 1 et 15." }, { status: 400 });
        }
        if (user.points < points) {
            return NextResponse.json({ error: "Points insuffisants." }, { status: 400 });
        }
        if (!["lesson", "exercise"].includes(contextType)) {
            return NextResponse.json({ error: "Type de contexte invalide." }, { status: 400 });
        }

        // Résoudre les métadonnées depuis la ressource
        let contextTitle = "";
        let sectionId = "";
        let courseId = "";
        let subject = "";
        let classLevel = "";

        if (contextType === "lesson") {
            const lesson = await Lesson.findById(contextId);
            if (!lesson) {
                return NextResponse.json({ error: "Leçon introuvable." }, { status: 404 });
            }
            contextTitle = lesson.title;
            sectionId = lesson.sectionId.toString();

            const section = await Section.findById(lesson.sectionId);
            if (section) {
                courseId = section.courseId.toString();
                const course = await Course.findById(section.courseId);
                if (course) {
                    subject = course.matiere;
                    classLevel = course.niveau;
                }
            }
        } else {
            const exercise = await Exercise.findById(contextId);
            if (!exercise) {
                return NextResponse.json({ error: "Exercice introuvable." }, { status: 404 });
            }
            contextTitle = exercise.title;
            sectionId = exercise.sectionId.toString();

            const section = await Section.findById(exercise.sectionId);
            if (section) {
                courseId = section.courseId.toString();
                const course = await Course.findById(section.courseId);
                if (course) {
                    subject = course.matiere;
                    classLevel = course.niveau;
                }
            }
        }

        // Upload fichiers
        const ALLOWED_MIME_TYPES = [
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const MAX_FILES = 5;
        const fileKeys: string[] = [];

        for (const [, value] of formData.entries()) {
            if (value instanceof File && value.size > 0) {
                if (fileKeys.length >= MAX_FILES) {
                    return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers autorisés.` }, { status: 400 });
                }
                if (!ALLOWED_MIME_TYPES.includes(value.type)) {
                    return NextResponse.json({ error: `Type de fichier non autorisé : ${value.type}` }, { status: 400 });
                }
                if (value.size > MAX_FILE_SIZE) {
                    return NextResponse.json({ error: `Fichier trop volumineux (max 10 MB) : ${value.name}` }, { status: 400 });
                }
                const key = await uploadFileToR2(value);
                fileKeys.push(key);
            }
        }

        const question = await Question.create({
            user: user._id,
            title,
            classLevel: classLevel || "Non spécifié",
            subject: subject || "Non spécifié",
            description: { whatIDid, whatINeed },
            attachments: fileKeys,
            points,
            status: "Non validée",
            contextType,
            contextId,
            contextTitle,
            courseId: courseId || undefined,
            sectionId: sectionId || undefined,
            createdAt: new Date(),
        });

        await User.findByIdAndUpdate(user._id, { $inc: { points: -points } });
        await PointTransaction.create({
            user: user._id,
            question: question._id,
            action: "createQuestion",
            type: "perte",
            points,
            createdAt: new Date(),
        });

        // Discord webhook
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
            const questionLink = `${baseUrl}/forum/${question._id}`;
            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    embeds: [{
                        title: "🆕 Nouvelle question contextuelle",
                        url: questionLink,
                        author: { name: user.username },
                        fields: [
                            { name: "Titre", value: title, inline: true },
                            { name: "Contexte", value: `${contextType === "lesson" ? "Leçon" : "Exercice"} : ${contextTitle}`, inline: true },
                            { name: "Sujet", value: subject || "N/A", inline: true },
                            { name: "Points misés", value: points.toString(), inline: true },
                        ],
                        timestamp: question.createdAt.toISOString(),
                        color: 0x8b5cf6,
                    }],
                }),
            }).catch(() => {});
        }

        return NextResponse.json(question, { status: 201 });
    } catch (err: any) {
        console.error("Erreur création question contextuelle :", err);
        return NextResponse.json({ error: "Échec création question." }, { status: 500 });
    }
}
