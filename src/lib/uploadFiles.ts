import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const uploadDir = path.join(process.cwd(), "public/uploads/cours"); // 📂 Dossier de stockage local

// Le nom du fichier n'est plus repris : un nom comme « /../../src/x » sortait
// du dossier (écriture de fichiers arbitraires), et un .html déposé dans
// public/ s'exécutait sur workyt.fr. Nom aléatoire + extension en liste blanche.
const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "mp3", "mp4"]);
const MAX_BYTES = 20 * 1024 * 1024;

export async function uploadFiles(files: File[]): Promise<string[]> {
    for (const file of files) {
        const ext = path.extname(file.name).slice(1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            throw new Error(`Format de fichier non autorisé : .${ext || "?"}`);
        }
        if (file.size > MAX_BYTES) {
            throw new Error("Fichier trop lourd (20 Mo max)");
        }
    }

    try {
        await fs.mkdir(uploadDir, { recursive: true }); // 📌 Crée le dossier s'il n'existe pas

        const uploadedPaths: string[] = [];

        for (const file of files) {
            const ext = path.extname(file.name).slice(1).toLowerCase();
            const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
            const filePath = path.join(uploadDir, fileName);
            if (path.dirname(filePath) !== uploadDir) {
                throw new Error("Chemin de fichier invalide");
            }

            const fileBuffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filePath, fileBuffer);

            uploadedPaths.push(`/uploads/cours/${fileName}`); // ✅ Retourne l'URL accessible du fichier
        }

        return uploadedPaths;
    } catch (error) {
        console.error("Erreur lors de l'upload des fichiers :", error);
        throw new Error("Erreur d'upload des fichiers");
    }
}
