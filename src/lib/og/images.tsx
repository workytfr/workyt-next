import { HomeCard, CourseCard, FicheCard, QuestionCard, ProfileCard } from "./cards";
import { renderCard, logos, loadImage, pdfFirstPage, dataUrl, SECTION, SKY, LEAF } from "./render";
import { courseOg, ficheOg, questionOg, profileOg, avatarSvg } from "./data";

/**
 * Image de partage de chaque type de page. Page introuvable ou erreur :
 * l'image d'accueil, pour ne jamais renvoyer d'image cassée.
 */

const png = async (src: Buffer | string | null | undefined, w: number, h: number, fit: "cover" | "inside" = "cover") => {
    const b = await loadImage(src, w, h, fit);
    return b ? dataUrl(b) : null;
};
const avatar = async (userId: unknown, size: number) => png(await avatarSvg(userId), size, size);

export async function homeImage(): Promise<Response> {
    const { logo } = await logos();
    return renderCard(<HomeCard logo={logo} />, { tint: SECTION.accueil });
}

async function orHome(make: () => Promise<Response | null>): Promise<Response> {
    try {
        return (await make()) ?? (await homeImage());
    } catch (e) {
        console.error("[og]", e);
        return homeImage();
    }
}

export const courseImage = (idSlug: string) =>
    orHome(async () => {
        const c = await courseOg(idSlug);
        if (!c) return null;
        const { logo } = await logos();
        const [photo, av] = await Promise.all([png(c.image, 560, 630), c.author ? avatar(c.author.id, 116) : null]);
        return renderCard(<CourseCard logo={logo} c={{ ...c, author: c.author?.name ?? null }} photo={photo} avatar={av} />, { tint: SECTION.cours });
    });

export const ficheImage = (idSlug: string) =>
    orHome(async () => {
        const f = await ficheOg(idSlug, (data) => pdfFirstPage(data, 840));
        if (!f) return null;
        const { logo } = await logos();
        const sheet = f.preview && f.preview.kind !== "text" ? await png(f.preview.data, 840, 1140) : null;
        const text = f.preview?.kind === "text" ? f.preview.text : null;
        const av = f.author ? await avatar(f.author.id, 116) : null;
        // Teinte du statut, comme les cartes de fiches du site : bleu « Certifiée », vert « Vérifiée »
        const tint = f.status === "Certifiée" ? SKY : f.status === "Vérifiée" ? LEAF : SECTION.fiches;
        return renderCard(<FicheCard logo={logo} f={{ ...f, author: f.author?.name ?? null }} sheet={sheet} text={text} avatar={av} />, { tint });
    });

export const questionImage = (idSlug: string) =>
    orHome(async () => {
        const q = await questionOg(idSlug);
        if (!q) return null;
        const { logo } = await logos();
        const av = await avatar(q.authorId, 156);
        return renderCard(<QuestionCard logo={logo} q={q} avatar={av} />, { tint: SECTION.forum });
    });

export const profileImage = (id: string) =>
    orHome(async () => {
        const p = await profileOg(id);
        if (!p) return null;
        const { logoWhite } = await logos();
        const [photo, border] = await Promise.all([p.photo ? png(p.photo, 360, 360) : null, p.border ? png(p.border, 460, 460, "inside") : null]);
        const av = photo ?? (await avatar(p.id, 360));
        return renderCard(<ProfileCard logoWhite={logoWhite} p={p} avatar={av} border={border} />, { tint: SECTION.profil, dark: true });
    });
