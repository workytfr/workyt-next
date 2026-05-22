// Compression d'image côté client avant upload R2.
// Objectif : réduire le poids (R2 storage + bande passante) sans dégrader la qualité.
// Préserve transparence si PNG. Skip si déjà petit. Aucune dépendance externe.

interface CompressOptions {
    maxDimension?: number;  // côté max en pixels
    quality?: number;        // qualité JPEG/WebP (0..1)
    skipBytes?: number;      // ne compresse pas si < skipBytes (sauf HEIC)
}

const DEFAULTS: Required<CompressOptions> = {
    maxDimension: 2000,
    quality: 0.85,
    skipBytes: 500 * 1024,
};

// Presets prêts à l'emploi
export const FICHE_IMAGE_OPTS: CompressOptions = { maxDimension: 2000, quality: 0.85, skipBytes: 500 * 1024 };
export const FORUM_QUESTION_IMAGE_OPTS: CompressOptions = { maxDimension: 1200, quality: 0.75, skipBytes: 200 * 1024 };
export const FORUM_ANSWER_IMAGE_OPTS: CompressOptions = { maxDimension: 1000, quality: 0.7, skipBytes: 150 * 1024 };

function isHeic(file: File): boolean {
    const t = (file.type || "").toLowerCase();
    if (t === "image/heic" || t === "image/heif") return true;
    const name = file.name.toLowerCase();
    return name.endsWith(".heic") || name.endsWith(".heif");
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
    if (!file.type.startsWith("image/") && !isHeic(file)) return file;
    if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

    const o = { ...DEFAULTS, ...opts };
    // Pour HEIC on force la conversion même si petit (Safari/iOS produit du HEIC opaque côté autres OS)
    const forceConvert = isHeic(file);
    if (!forceConvert && file.size < o.skipBytes) return file;

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        // Si createImageBitmap échoue (HEIC sur navigateur non-Apple), on tente quand même via <img>
        try {
            const url = URL.createObjectURL(file);
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const im = new Image();
                im.onload = () => resolve(im);
                im.onerror = reject;
                im.src = url;
            });
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext("2d")?.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            bitmap = await createImageBitmap(c);
        } catch {
            return file;
        }
    }

    const { width: w, height: h } = bitmap;
    const maxSide = Math.max(w, h);
    const scale = maxSide > o.maxDimension ? o.maxDimension / maxSide : 1;
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    // Si pas besoin de resize et le fichier est petit-moyen, retourner tel quel
    if (scale === 1 && file.size < o.skipBytes * 4) {
        bitmap.close();
        return file;
    }

    const canvas =
        typeof OffscreenCanvas !== "undefined"
            ? new OffscreenCanvas(targetW, targetH)
            : Object.assign(document.createElement("canvas"), { width: targetW, height: targetH });
    const ctx = (canvas as any).getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctx) {
        bitmap.close();
        return file;
    }

    // PNG transparent → garder PNG. JPEG/WebP → JPEG.
    const keepPng = file.type === "image/png";
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const mime = keepPng ? "image/png" : "image/jpeg";
    const quality = keepPng ? undefined : o.quality;

    let blob: Blob;
    if ("convertToBlob" in canvas) {
        blob = await (canvas as OffscreenCanvas).convertToBlob({ type: mime, quality });
    } else {
        blob = await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
                (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
                mime,
                quality,
            );
        });
    }

    // Si la compression a paradoxalement augmenté la taille, on garde l'original
    if (blob.size >= file.size) return file;

    const newName = keepPng
        ? file.name
        : file.name.replace(/\.(png|webp|bmp|tiff?)$/i, ".jpg");

    return new File([blob], newName, { type: mime, lastModified: Date.now() });
}
