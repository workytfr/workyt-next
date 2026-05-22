import { compressImage } from "./imageCompression";

export type UploadKind = "img" | "draw" | "attach";

export interface UploadResult {
    publicUrl: string;
    key: string;
}

export async function uploadToR2(input: File | Blob, kind: UploadKind, filename?: string): Promise<UploadResult> {
    // Compression automatique des images (sauf dessins déjà optimisés et SVG/GIF)
    let file: File | Blob = input;
    if (input instanceof File && input.type.startsWith("image/") && kind !== "draw") {
        try {
            file = await compressImage(input);
        } catch {
            // En cas d'erreur, on continue avec l'original
        }
    }

    const name = filename ?? (file instanceof File ? file.name : "file");
    const contentType = file.type || "application/octet-stream";

    const presignRes = await fetch("/api/fiches/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            kind,
            filename: name,
            contentType,
            size: file.size,
        }),
    });

    if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(err.error || `Erreur signature (${presignRes.status})`);
    }

    const { uploadUrl, publicUrl, key } = await presignRes.json();

    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
    });

    if (!putRes.ok) {
        throw new Error(`Échec upload R2 (${putRes.status})`);
    }

    return { publicUrl, key };
}
