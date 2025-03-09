import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import authMiddleware from '@/middlewares/authMiddleware';

export const runtime = 'nodejs';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Fonction utilitaire pour découper un Buffer par un délimiteur
function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
    const parts: Buffer[] = [];
    let start = 0;
    let index = buffer.indexOf(delimiter, start);
    while (index !== -1) {
        parts.push(buffer.slice(start, index));
        start = index + delimiter.length;
        index = buffer.indexOf(delimiter, start);
    }
    parts.push(buffer.slice(start));
    return parts;
}

export async function POST(req: NextRequest) {
    try {
        // Vérification de l'authentification et des rôles autorisés
        const user = await authMiddleware(req);
        if (!user || !['Rédacteur', 'Correcteur', 'Admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Accès interdit.' }, { status: 403 });
        }

        // Récupérer le header Content-Type et extraire la boundary
        const contentType = req.headers.get('content-type');
        if (!contentType) {
            return NextResponse.json({ error: 'Content-Type header manquant' }, { status: 400 });
        }
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (!boundaryMatch) {
            return NextResponse.json({ error: 'Boundary introuvable' }, { status: 400 });
        }
        const boundary = '--' + boundaryMatch[1];

        // Récupérer le body sous forme de Buffer
        const bodyBuffer = Buffer.from(await req.arrayBuffer());

        // Découper le buffer par la boundary
        const delimiter = Buffer.from(boundary);
        const parts = splitBuffer(bodyBuffer, delimiter);

        // Parcourir les parties pour trouver celle contenant le fichier
        let filePart: { headers: Record<string, string>, data: Buffer, filename: string } | undefined;
        for (const part of parts) {
            // On ignore les parties vides
            if (part.length === 0) continue;

            // On cherche la séquence qui sépare les headers du contenu
            const separator = Buffer.from('\r\n\r\n');
            const sepIndex = part.indexOf(separator);
            if (sepIndex === -1) continue;

            // Extraire la partie header et convertir en chaîne de caractères
            const headerPart = part.slice(0, sepIndex).toString('utf8');
            // Extraire les données après les en-têtes
            const data = part.slice(sepIndex + separator.length);

            // Parser les en-têtes en lignes
            const headerLines = headerPart.split('\r\n');
            const headers: Record<string, string> = {};
            for (const line of headerLines) {
                const [key, ...vals] = line.split(':');
                if (key && vals) {
                    headers[key.trim().toLowerCase()] = vals.join(':').trim();
                }
            }

            // Vérifier que c'est une partie fichier via le header Content-Disposition
            if (headers['content-disposition'] && headers['content-disposition'].includes('filename=')) {
                // Extraire le nom du fichier avec une regex
                const filenameMatch = headers['content-disposition'].match(/filename="(.+?)"/);
                const filename = filenameMatch ? filenameMatch[1] : 'upload.jpg';
                filePart = { headers, data, filename };
                break;
            }
        }

        if (!filePart) {
            return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
        }

        // Définir le dossier d'upload et le créer s'il n'existe pas
        const uploadDir = path.join(process.cwd(), 'public/uploads/cours/lessons');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Générer un nom de fichier unique
        const extension = path.extname(filePart.filename) || '.jpg';
        const newFilename = `${Date.now()}-upload${extension}`;
        const filePath = path.join(uploadDir, newFilename);

        // Écrire le fichier sur le disque
        fs.writeFileSync(filePath, filePart.data);

        const fileUrl = `/uploads/cours/lessons/${newFilename}`;
        return NextResponse.json({ url: fileUrl }, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de l’upload du fichier :', error);
        return NextResponse.json({ error: 'Erreur lors de l’upload du fichier' }, { status: 500 });
    }
}
