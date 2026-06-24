import fs from 'fs';
import path from 'path';
import type jsPDF from 'jspdf';

/**
 * Embarque les polices de marque Workyt (Funnel Display + Montserrat) dans une
 * instance jsPDF afin de respecter la typo sur les documents générés.
 *
 * Les TTF sont dans public/fonts. En cas d'absence, on retombe proprement sur
 * Helvetica (le rendu reste correct, sans crash).
 */

export interface BrandFonts {
    body: string;     // texte courant
    heading: string;  // titres
}

const FALLBACK: BrandFonts = { body: 'helvetica', heading: 'helvetica' };

// Cache des fichiers en base64 (lecture disque une seule fois par process)
let cache: { regular: string; bold: string; funnel: string } | null | undefined;

function loadCache() {
    if (cache !== undefined) return cache;
    try {
        const dir = path.join(process.cwd(), 'public', 'fonts');
        cache = {
            regular: fs.readFileSync(path.join(dir, 'Montserrat-Regular.ttf')).toString('base64'),
            bold: fs.readFileSync(path.join(dir, 'Montserrat-Bold.ttf')).toString('base64'),
            funnel: fs.readFileSync(path.join(dir, 'FunnelDisplay-Bold.ttf')).toString('base64'),
        };
    } catch {
        cache = null;
    }
    return cache;
}

export function registerBrandFonts(pdf: jsPDF): BrandFonts {
    const c = loadCache();
    if (!c) return FALLBACK;
    try {
        pdf.addFileToVFS('Montserrat-Regular.ttf', c.regular);
        pdf.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
        pdf.addFileToVFS('Montserrat-Bold.ttf', c.bold);
        pdf.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
        pdf.addFileToVFS('FunnelDisplay-Bold.ttf', c.funnel);
        pdf.addFont('FunnelDisplay-Bold.ttf', 'FunnelDisplay', 'bold');
        return { body: 'Montserrat', heading: 'FunnelDisplay' };
    } catch {
        return FALLBACK;
    }
}
