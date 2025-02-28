import path from "path";
import fs from "fs/promises";

const uploadDir = path.join(process.cwd(), "public/uploads/cours"); // 📂 Dossier de stockage local

export async function uploadFiles(files: File[]): Promise<string[]> {
    try {
        await fs.mkdir(uploadDir, { recursive: true }); // 📌 Crée le dossier s'il n'existe pas

        const uploadedPaths: string[] = [];

        for (const file of files) {
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
            const filePath = path.join(uploadDir, fileName);

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
