import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Course from "@/models/Course";
import Section from "@/models/Section";
import Lesson from "@/models/Lesson";
import CourseProgress from "@/models/CourseProgress";
import Revision from "@/models/Revision";
import Question from "@/models/Question";
import Answer from "@/models/Answer";
import User from "@/models/User";
import ProfileCustomization from "@/models/ProfileCustomization";
import { extractIdFromSlug } from "@/utils/slugify";
import { generatedAvatarSvg } from "@/lib/blobatar";
import { sanitizeLook } from "@/lib/avatarLook";
import { calculateUserRank } from "@/lib/rankSystem";
import { getFileFromStorage, extractFileKeyFromUrl } from "@/lib/b2Utils";

/**
 * Données des images de partage : seulement ce que la page affiche déjà,
 * rien d'inventé. Une page introuvable renvoie null (image par défaut).
 */

const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/** Document trouvé par « id-slug », par id seul ou par slug */
async function findByIdSlug<T>(model: mongoose.Model<T>, idSlug: string, select: string) {
    const id = extractIdFromSlug(idSlug) ?? (mongoose.isValidObjectId(idSlug) ? idSlug : null);
    if (id) {
        const doc = await model.findById(id).select(select).lean();
        if (doc) return doc as Record<string, unknown>;
    }
    return (await model.findOne({ slug: idSlug }).select(select).lean()) as Record<string, unknown> | null;
}

/** Avatar d'un membre : son Blobatar, avec les accessoires équipés (SVG) */
export async function avatarSvg(userId: unknown): Promise<Buffer> {
    const id = String(userId ?? "workyt");
    let look = {};
    if (mongoose.isValidObjectId(id)) {
        const custom = await ProfileCustomization.findOne({ user: id }).select("avatarLook").lean<{ avatarLook?: unknown }>();
        look = sanitizeLook(custom?.avatarLook);
    }
    return Buffer.from(generatedAvatarSvg(id, 256, look));
}

export interface CourseOg {
    title: string;
    subject: string;
    level: string;
    image: string | null;
    lessons: number;
    learners: number;
    verified: boolean;
    author: { name: string; id: string } | null;
}

export async function courseOg(idSlug: string): Promise<CourseOg | null> {
    await dbConnect();
    const c = await findByIdSlug(Course, idSlug, "title matiere niveau image authors verifiedBy status");
    if (!c || c.status !== "publie") return null;
    const sections = await Section.find({ courseId: c._id }).select("_id").lean();
    const [lessons, learners, author] = await Promise.all([
        Lesson.countDocuments({ sectionId: { $in: sections.map((s) => s._id) } }),
        CourseProgress.countDocuments({ courseId: c._id }),
        Array.isArray(c.authors) && c.authors[0] ? User.findById(c.authors[0]).select("username").lean<{ _id: unknown; username: string }>() : null,
    ]);
    return {
        title: String(c.title),
        subject: String(c.matiere || ""),
        level: String(c.niveau || ""),
        image: typeof c.image === "string" && c.image ? c.image : null,
        lessons,
        learners,
        verified: !!c.verifiedBy,
        author: author ? { name: author.username, id: String(author._id) } : null,
    };
}

export interface FicheOg {
    title: string;
    subject: string;
    level: string;
    likes: number;
    status: string;
    author: { name: string; id: string } | null;
    /** Aperçu : image de la fiche, première page du PDF, ou texte */
    preview: { kind: "image"; data: Buffer } | { kind: "pdf"; data: Buffer } | { kind: "text"; text: string } | null;
}

export async function ficheOg(idSlug: string, renderPdf: (data: Uint8Array) => Promise<Buffer | null>): Promise<FicheOg | null> {
    await dbConnect();
    const f = await findByIdSlug(Revision, idSlug, "title subject level likes status author files content");
    if (!f) return null;
    const author = f.author ? await User.findById(f.author).select("username").lean<{ _id: unknown; username: string }>() : null;

    let preview: FicheOg["preview"] = null;
    const first = Array.isArray(f.files) ? (f.files as string[]).find(Boolean) : undefined;
    const bucket = process.env.S3_BUCKET_NAME;
    if (first && bucket) {
        try {
            const key = extractFileKeyFromUrl(first);
            const res = await getFileFromStorage(bucket, key);
            const bytes = res.Body ? await res.Body.transformToByteArray() : null;
            if (bytes?.length) {
                if (/\.pdf$/i.test(key.split("?")[0])) {
                    const png = await renderPdf(bytes);
                    if (png) preview = { kind: "pdf", data: png };
                } else preview = { kind: "image", data: Buffer.from(bytes) };
            }
        } catch (e) {
            console.error("[og] fichier de fiche illisible :", (e as Error).message);
        }
    }
    if (!preview && typeof f.content === "string" && f.content.trim()) preview = { kind: "text", text: stripHtml(f.content).slice(0, 420) };

    return {
        title: String(f.title),
        subject: String(f.subject || ""),
        level: String(f.level || ""),
        likes: Number(f.likes) || 0,
        status: String(f.status || ""),
        author: author ? { name: author.username, id: String(author._id) } : null,
        preview,
    };
}

export interface QuestionOg {
    title: string;
    subject: string;
    level: string;
    excerpt: string;
    points: number;
    solved: boolean;
    answers: number;
    authorId: string;
}

export async function questionOg(idSlug: string): Promise<QuestionOg | null> {
    await dbConnect();
    const q = await findByIdSlug(Question, idSlug, "title subject classLevel description points status user");
    if (!q) return null;
    const answers = await Answer.countDocuments({ question: q._id });
    const d = (q.description ?? {}) as { whatIDid?: string; whatINeed?: string };
    return {
        title: String(q.title),
        subject: String(q.subject || ""),
        level: String(q.classLevel || ""),
        excerpt: stripHtml(d.whatINeed || d.whatIDid || "").slice(0, 170),
        points: Number(q.points) || 0,
        solved: q.status === "Résolue",
        answers,
        authorId: String(q.user ?? "workyt"),
    };
}

/** Couleur du pseudo achetée (mêmes teintes que le site) : couleur unie ou dégradé */
const NAME_GRADIENTS: Record<string, string> = {
    rainbow: "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD)",
    automne: "linear-gradient(45deg, #FF6B35, #F7931E, #FFD700, #FF4500, #8B4513)",
    galaxy: "linear-gradient(45deg, #4C1D95, #7C3AED, #A855F7, #C084FC)",
    fire: "linear-gradient(45deg, #DC2626, #EF4444, #F87171, #FCA5A5)",
    ice: "linear-gradient(45deg, #0EA5E9, #38BDF8, #7DD3FC, #BAE6FD)",
    lightning: "linear-gradient(45deg, #F59E0B, #FBBF24, #FCD34D, #FDE68A)",
    cosmic: "linear-gradient(45deg, #7C3AED, #A855F7, #C084FC, #DDD6FE)",
    diamond: "linear-gradient(45deg, #10B981, #34D399, #6EE7B7, #A7F3D0)",
    legendary: "linear-gradient(45deg, #F97316, #FB923C, #FDBA74, #FED7AA)",
    nitro: "linear-gradient(90deg, #5865F2, #7289DA, #99AAB5, #5865F2)",
};
const NAME_COLORS: Record<string, string> = { neon: "#00FF00", glitch: "#FF0080", stardust: "#E6E6FA", typewriter: "#22C55E" };
export type NameStyle = { color: string } | { gradient: string } | null;
function nameStyle(c?: { type?: string; value?: string; isActive?: boolean }): NameStyle {
    if (!c?.isActive || !c.type) return null;
    if (c.type === "solid" || c.type === "custom") return c.value ? { color: c.value } : null;
    if (c.type === "gradient") return { gradient: `linear-gradient(45deg, ${c.value || "#3B82F6"}, #FF6B6B)` };
    if (NAME_GRADIENTS[c.type]) return { gradient: NAME_GRADIENTS[c.type] };
    if (NAME_COLORS[c.type]) return { color: NAME_COLORS[c.type] };
    return null;
}

export interface ProfileOg {
    id: string;
    username: string;
    role: string;
    rank: string;
    level: number;
    points: number;
    fiches: number;
    answers: number;
    badges: number;
    since: string;
    /** Photo personnalisée ou image de profil achetée (sinon le Blobatar) */
    photo: Buffer | string | null;
    /** Contour acheté (fichier de public/profile/contour/) */
    border: string | null;
    name: NameStyle;
}

export async function profileOg(id: string): Promise<ProfileOg | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    await dbConnect();
    const u = await User.findById(id).select("username role points badges createdAt").lean<{ _id: unknown; username: string; role?: string; points?: number; badges?: unknown[]; createdAt?: Date }>();
    if (!u) return null;
    const [fiches, answers] = await Promise.all([Revision.countDocuments({ author: u._id }), Answer.countDocuments({ user: u._id })]);
    const rank = calculateUserRank(u.points || 0);
    // Cosmétiques, dans le même ordre que le site : photo perso, puis image de profil, puis Blobatar
    const custom = await ProfileCustomization.findOne({ user: u._id })
        .select("usernameColor profileImage profileBorder customPhoto")
        .lean<{
            usernameColor?: { type?: string; value?: string; isActive?: boolean };
            profileImage?: { filename?: string; isActive?: boolean };
            profileBorder?: { filename?: string; isActive?: boolean };
            customPhoto?: { key?: string; isActive?: boolean };
        }>();
    let photo: Buffer | string | null = null;
    const bucket = process.env.S3_BUCKET_NAME;
    if (custom?.customPhoto?.isActive && custom.customPhoto.key && bucket) {
        try {
            const res = await getFileFromStorage(bucket, custom.customPhoto.key);
            const bytes = res.Body ? await res.Body.transformToByteArray() : null;
            if (bytes?.length) photo = Buffer.from(bytes);
        } catch (e) {
            console.error("[og] photo de profil illisible :", (e as Error).message);
        }
    }
    if (!photo && custom?.profileImage?.isActive && custom.profileImage.filename) photo = `/profile/${custom.profileImage.filename}`;
    const border = custom?.profileBorder?.isActive && custom.profileBorder.filename ? `/profile/contour/${custom.profileBorder.filename}` : null;
    return {
        id: String(u._id),
        username: u.username,
        role: u.role || "Apprenti",
        rank: rank.name,
        level: rank.level,
        points: u.points || 0,
        fiches,
        answers,
        badges: Array.isArray(u.badges) ? u.badges.length : 0,
        since: u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "",
        photo,
        border,
        name: nameStyle(custom?.usernameColor),
    };
}
