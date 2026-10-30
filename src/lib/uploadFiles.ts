import path from "path";
import { randomUUID } from "crypto";
import { putPublicObject } from "@/lib/publicStorage";

// Fichiers des leçons et des exercices : stockage public (MinIO de Youss).
// Ils étaient écrits sur le disque du serveur (public/uploads/cours) : avec
// plusieurs nœuds, un fichier n'existait que sur l'un d'eux et un
// redéploiement l'effaçait.
//
// Le nom du fichier n'est pas repris (« /../../src/x », .html exécuté sur
// workyt.fr…) : nom aléatoire + extension en liste blanche.
const CONTENT_TYPES: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
};
const MAX_BYTES = 20 * 1024 * 1024;

export async function uploadFiles(files: File[]): Promise<string[]> {
    for (const file of files) {
        const ext = path.extname(file.name).slice(1).toLowerCase();
        if (!CONTENT_TYPES[ext]) {
            throw new Error(`Format de fichier non autorisé : .${ext || "?"}`);
        }
        if (file.size > MAX_BYTES) {
            throw new Error("Fichier trop lourd (20 Mo max)");
        }
    }

    try {
        const uploadedUrls: string[] = [];
        for (const file of files) {
            const ext = path.extname(file.name).slice(1).toLowerCase();
            const key = `cours/fichiers/${Date.now()}-${randomUUID()}.${ext}`;
            const buffer = Buffer.from(await file.arrayBuffer());
            uploadedUrls.push(await putPublicObject(key, buffer, CONTENT_TYPES[ext]));
        }
        return uploadedUrls;
    } catch (error) {
        console.error("Erreur lors de l'upload des fichiers :", error);
        throw new Error("Erreur d'upload des fichiers");
    }
}
