import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { NextApiRequest, NextApiResponse } from "next";

const s3 = new S3Client({
    region: "s3.eu-central-003", // Région spécifique à Backblaze
    endpoint: process.env.B2_ENDPOINT, // Endpoint de Backblaze S3
    credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { fileName, fileType } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ error: "Paramètres manquants: fileName ou fileType." });
        }

        const key = `uploads/${uuidv4()}-${fileName}`;
        const params = {
            Bucket: process.env.B2_BUCKET_NAME!,
            Key: key,
            ContentType: fileType,
        };

        try {
            const command = new PutObjectCommand(params);
            await s3.send(command);
            const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${key}`;
            res.status(200).json({ url: fileUrl });
        } catch (error) {
            console.error("Erreur lors du téléchargement:", error);
            res.status(500).json({ error: "Impossible de télécharger le fichier." });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Méthode ${req.method} non autorisée.`);
    }
}
