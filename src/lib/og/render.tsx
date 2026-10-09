import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp, { type OverlayOptions } from "sharp";
import type { ReactElement } from "react";

/**
 * Images de partage (Open Graph) de workyt.fr : 1200 × 630, aux couleurs du
 * site (papier, orange Workyt, Funnel Display + Montserrat), dégradé doux à
 * la couleur de la section et grain discret. Le fond et le grain sont faits
 * avec sharp ; le texte et la mise en page par next/og.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const W = OG_SIZE.width;
export const H = OG_SIZE.height;

export const INK = "#1a1512";
export const PAPER = "#fdfaf4";
export const PAPER2 = "#f5efe3";
export const ORANGE = "#ff6a1a";
export const SUN = "#ffb547";
export const SKY = "#6ec1e4";
export const LEAF = "#7ed957";
export const POSTIT = "#fff3d6";

/** Couleur de chaque section (dégradé, pastilles) */
export const SECTION = {
    accueil: ORANGE,
    cours: ORANGE,
    fiches: SUN,
    forum: SKY,
    profil: LEAF,
} as const;

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
type Assets = { fonts: Fonts; logo: string; logoWhite: string; grain: Buffer };
let assets: Promise<Assets> | null = null;

export const dataUrl = (buf: Buffer, mime = "image/png") => `data:${mime};base64,${buf.toString("base64")}`;

function loadAssets(): Promise<Assets> {
    assets ??= (async () => {
        const pub = path.join(process.cwd(), "public");
        const [display, bold, regular, logoSvg] = await Promise.all([
            readFile(path.join(pub, "fonts", "FunnelDisplay-Bold.ttf")),
            readFile(path.join(pub, "fonts", "Montserrat-Bold.ttf")),
            readFile(path.join(pub, "fonts", "Montserrat-Regular.ttf")),
            readFile(path.join(pub, "workyt-logo-26.svg")),
        ]);
        const logo = await sharp(logoSvg, { density: 300 }).resize({ width: 440 }).png().toBuffer();
        // Logo blanc (fonds sombres) : même silhouette, en blanc
        const alpha = await sharp(logo).ensureAlpha().extractChannel("alpha").toBuffer();
        const meta = await sharp(logo).metadata();
        const logoWhite = await sharp({ create: { width: meta.width!, height: meta.height!, channels: 3, background: "#ffffff" } })
            .joinChannel(alpha)
            .png()
            .toBuffer();
        // Grain : bruit gris très léger, posé en mosaïque
        const size = 256;
        const raw = Buffer.alloc(size * size * 4);
        for (let i = 0; i < size * size; i++) {
            const v = Math.floor(Math.random() * 255);
            raw[i * 4] = raw[i * 4 + 1] = raw[i * 4 + 2] = v;
            raw[i * 4 + 3] = 20;
        }
        const grain = await sharp(raw, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
        return {
            fonts: [
                { name: "Funnel Display", data: display, weight: 700 as const, style: "normal" as const },
                { name: "Montserrat", data: regular, weight: 400 as const, style: "normal" as const },
                { name: "Montserrat", data: bold, weight: 700 as const, style: "normal" as const },
            ],
            logo: dataUrl(logo),
            logoWhite: dataUrl(logoWhite),
            grain,
        };
    })().catch((e) => {
        assets = null;
        throw e;
    });
    return assets;
}

export async function logos() {
    const a = await loadAssets();
    return { logo: a.logo, logoWhite: a.logoWhite };
}

/** Fond papier (ou sombre) avec dégradés doux à la couleur de la section */
function background(tint: string, base: string, strength = 1): Promise<Buffer> {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <defs>
            <radialGradient id="a" cx="100%" cy="0%" r="75%"><stop offset="0" stop-color="${tint}" stop-opacity="${0.3 * strength}"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>
            <radialGradient id="b" cx="0%" cy="100%" r="65%"><stop offset="0" stop-color="${SUN}" stop-opacity="${0.16 * strength}"/><stop offset="1" stop-color="${SUN}" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="${base}"/>
        <rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Image distante ou locale → PNG recadré, lisible par next/og (qui ne lit ni le WebP ni le SVG) */
export async function loadImage(src: Buffer | string | null | undefined, width: number, height: number, fit: "cover" | "inside" = "cover"): Promise<Buffer | null> {
    if (!src) return null;
    try {
        let buf: Buffer;
        if (Buffer.isBuffer(src)) buf = src;
        else if (src.startsWith("/")) buf = await readFile(path.join(process.cwd(), "public", decodeURIComponent(src.split("?")[0])));
        else {
            const res = await fetch(src, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "WorkytOG/1.0 (+https://workyt.fr)" } });
            if (!res.ok) return null;
            buf = Buffer.from(await res.arrayBuffer());
        }
        return await sharp(buf, { density: 200, failOn: "none" }).rotate().resize(width, height, { fit, withoutEnlargement: false }).png().toBuffer();
    } catch {
        return null;
    }
}

/** Première page d'un PDF en image (pdf.js côté serveur) ; null si le rendu échoue */
export async function pdfFirstPage(data: Uint8Array, width = 900): Promise<Buffer | null> {
    try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true, disableFontFace: true }).promise;
        try {
            const page = await doc.getPage(1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: width / base.width });
            const { createCanvas } = await import("@napi-rs/canvas");
            const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx as any, canvas: canvas as any, viewport }).promise;
            return Buffer.from(canvas.toBuffer("image/png"));
        } finally {
            await doc.destroy();
        }
    } catch (e) {
        console.error("[og] rendu PDF impossible :", (e as Error).message);
        return null;
    }
}

/** La carte, en PNG : fond + mise en page + grain */
export async function renderCard(element: ReactElement, opts: { tint: string; dark?: boolean }): Promise<Response> {
    const a = await loadAssets();
    const bg = await background(opts.tint, opts.dark ? INK : PAPER, opts.dark ? 1.4 : 1);
    const layer = Buffer.from(await new ImageResponse(element, { ...OG_SIZE, fonts: a.fonts }).arrayBuffer());
    const layers: OverlayOptions[] = [{ input: layer }, { input: a.grain, tile: true, blend: opts.dark ? "screen" : "multiply" }];
    const png = await sharp(bg).composite(layers).png({ compressionLevel: 9 }).toBuffer();
    return new Response(new Uint8Array(png), {
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" },
    });
}
