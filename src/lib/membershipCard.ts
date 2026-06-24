import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import {
    BRAND,
    MEMBERSHIP_TYPES,
    membershipTypeLabel,
    type MembershipType,
} from '@/lib/membership';
import { generateCardGradient, hueForType } from '@/lib/grainyGradient';
import { registerBrandFonts } from '@/lib/pdfFonts';

export interface MembershipCardData {
    fullName: string;
    firstName?: string;
    lastName?: string;
    memberNumber: string;
    type: MembershipType;
    joinedAt: Date;
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function loadLogo(): string | null {
    try {
        const file = path.join(process.cwd(), 'public', 'Workyt Logo 2026.png');
        return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
    } catch {
        return null;
    }
}

/**
 * Carte d'adhérent (100 × 63 mm, paysage), style « glassmorphism » :
 * dégradé organique grainy unique par carte (seed = n° d'adhérent),
 * panneau givré translucide pour la lisibilité, accent couleur = statut,
 * QR code (n° + nom + prénom).
 */
export async function generateMembershipCardPDF(data: MembershipCardData): Promise<Buffer> {
    const W = 100;
    const H = 63;
    const pdf = new jsPDF({ unit: 'mm', format: [W, H], orientation: 'landscape' });
    const anyPdf = pdf as any;
    const fonts = registerBrandFonts(pdf); // Funnel Display + Montserrat (fallback helvetica)

    const typeInfo = MEMBERSHIP_TYPES[data.type] || MEMBERSHIP_TYPES.utilisateur;
    const [sr, sg, sb] = hexToRgb(typeInfo.color);
    const [dr, dg, db] = hexToRgb(BRAND.dark);
    const [gr, gg, gb] = hexToRgb(BRAND.gray);

    // ── Fond : dégradé grainy organique (seed = n° d'adhérent) ──────────────────
    try {
        const bg = generateCardGradient(data.memberNumber, hueForType(data.type), 1200, 756);
        pdf.addImage(bg, 'JPEG', 0, 0, W, H, undefined, 'FAST');
    } catch {
        pdf.setFillColor(sr, sg, sb);
        pdf.rect(0, 0, W, H, 'F');
    }

    // ── Panneau givré translucide (lisibilité) ──────────────────────────────────
    const m = 4.5;
    anyPdf.setGState(new anyPdf.GState({ opacity: 0.85 }));
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(m, m, W - 2 * m, H - 2 * m, 4, 4, 'F');
    anyPdf.setGState(new anyPdf.GState({ opacity: 1 }));

    // Accent vertical de statut
    pdf.setFillColor(sr, sg, sb);
    pdf.roundedRect(8, 11, 1.4, H - 22, 0.7, 0.7, 'F');

    // ── En-tête : logo + intitulé ───────────────────────────────────────────────
    const logo = loadLogo();
    if (logo) {
        try {
            pdf.addImage(logo, 'PNG', 12, 8, 22, 7, undefined, 'FAST');
        } catch {
            /* ignore */
        }
    }
    pdf.setFont(fonts.heading, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(dr, dg, db);
    pdf.text("CARTE D'ADHÉRENT", W - 9, 10, { align: 'right' });
    pdf.setFont(fonts.body, 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(gr, gg, gb);
    pdf.text('Association Workyt', W - 9, 13.5, { align: 'right' });

    pdf.setDrawColor(225, 225, 225);
    pdf.setLineWidth(0.3);
    pdf.line(12, 18.5, W - 9, 18.5);

    // ── Nom de l'adhérent ───────────────────────────────────────────────────────
    pdf.setFont(fonts.heading, 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(dr, dg, db);
    pdf.text(data.fullName || 'Adhérent', 12, 30);

    // Badge de statut
    const badgeLabel = membershipTypeLabel(data.type).toUpperCase();
    pdf.setFont(fonts.body, 'bold');
    pdf.setFontSize(7);
    const badgeW = pdf.getTextWidth(badgeLabel) + 7;
    pdf.setFillColor(sr, sg, sb);
    pdf.roundedRect(12, 34, badgeW, 6, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text(badgeLabel, 12 + badgeW / 2, 38.1, { align: 'center' });

    // Numéro d'adhérent
    pdf.setFont(fonts.body, 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(gr, gg, gb);
    pdf.text("N° D'ADHÉRENT", 12, 47);
    pdf.setFont(fonts.heading, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(dr, dg, db);
    pdf.text(data.memberNumber, 12, 52.5);

    // Date d'adhésion
    const joined = new Date(data.joinedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    pdf.setFont(fonts.body, 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(gr, gg, gb);
    pdf.text(`Adhérent depuis le ${joined}`, 12, 57.5);

    // ── QR code (sur pastille blanche pour le contraste) ────────────────────────
    try {
        const qrPayload = JSON.stringify({
            n: data.memberNumber,
            nom: data.lastName || '',
            prenom: data.firstName || '',
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            margin: 0,
            errorCorrectionLevel: 'M',
            color: { dark: BRAND.dark, light: '#ffffff' },
        });
        const qrSize = 24;
        const qrX = W - m - 4 - qrSize;
        const qrY = H - m - 4 - qrSize;
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, 'F');
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
    } catch {
        /* ignore */
    }

    // Pied de page
    pdf.setFont(fonts.body, 'normal');
    pdf.setFontSize(5.3);
    pdf.setTextColor(gr, gg, gb);
    pdf.text('25 Rue Jaboulay, 69007 Lyon · workyt.fr · bureau@workyt.fr', 12, H - 6.5);

    return Buffer.from(pdf.output('arraybuffer'));
}
