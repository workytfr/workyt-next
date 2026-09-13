import jsPDF, { GState } from 'jspdf';
import { readFileSync } from 'fs';
import path from 'path';
import type { IVolunteerCertificate } from '@/models/VolunteerCertificate';

/* =====================================================================
 * Certificat de bénévolat — style « cas de jeu guerre » (Workyt Quest)
 * Référence : docs/cas-de-jeu-guerre-des-clans.html
 * ===================================================================== */

type RGB = [number, number, number];

/* Extensions non couvertes par les typings jsPDF v4 (API présente au runtime) */
type JsPDFExt = Omit<jsPDF, 'clip' | 'roundedRect'> & {
  getNumberOfPages(): number;
  saveGraphicsState(): void;
  restoreGraphicsState(): void;
  setGState(gState: GState): void;
  clip(rule?: 'nonzero' | 'evenodd'): void;
  roundedRect(
    x: number, y: number, w: number, h: number,
    rx: number, ry: number | null, style?: string | null
  ): void;
};

// Design tokens
const INK: RGB = [26, 21, 18];        // #1a1512
const PAPER: RGB = [253, 250, 244];   // #fdfaf4
const PAPER2: RGB = [245, 239, 227];  // #f5efe3
const ACCENT: RGB = [255, 106, 26];   // #ff6a1a
const ACCENT2: RGB = [255, 181, 71];  // #ffb547
const PEACH: RGB = [255, 212, 168];   // #ffd4a8
const PINK: RGB = [255, 183, 197];    // #ffb7c5
const YELLOW: RGB = [255, 222, 122];  // #ffde7a
const LEAD: RGB = [74, 60, 51];       // #4a3c33
const FOOT: RGB = [122, 106, 92];     // #7a6a5c
const LINE: RGB = [224, 213, 197];    // #e0d5c5
const BOXLINE: RGB = [232, 222, 208]; // #e8ded0
const GRAIN: RGB = [31, 20, 13];      // grain de la couverture

// Polices embarquées (OFL — Funnel Display & Montserrat)
const FONT_DIR = path.join(process.cwd(), 'public', 'fonts', 'pdf');
const FONT_FILES: Array<[string, string, string]> = [
  ['FunnelDisplay-Regular.ttf', 'Funnel', 'normal'],
  ['FunnelDisplay-SemiBold.ttf', 'Funnel', 'semibold'],
  ['FunnelDisplay-Bold.ttf', 'Funnel', 'bold'],
  ['Montserrat-Regular.ttf', 'Montserrat', 'normal'],
  ['Montserrat-Medium.ttf', 'Montserrat', 'medium'],
  ['Montserrat-SemiBold.ttf', 'Montserrat', 'semibold'],
  ['Montserrat-Bold.ttf', 'Montserrat', 'bold'],
];

let cachedFontData: Array<[string, string, string]> | null = null; // [base64, family, style]
let fontsAvailable = false;

function getFontData(): Array<[string, string, string]> {
  if (cachedFontData) return cachedFontData;
  try {
    cachedFontData = FONT_FILES.map(([file, family, style]) => [
      readFileSync(path.join(FONT_DIR, file), 'base64'),
      family,
      style,
    ]);
    fontsAvailable = true;
  } catch {
    cachedFontData = [];
  }
  return cachedFontData;
}

export async function generateCertificatePDF(certificate: IVolunteerCertificate): Promise<Buffer> {
  const pdf = new jsPDF('portrait', 'mm', 'a4') as unknown as JsPDFExt;

  // Enregistrement des polices embarquées
  for (const [base64, family, style] of getFontData()) {
    pdf.addFileToVFS(`${family}-${style}.ttf`, base64);
    pdf.addFont(`${family}-${style}.ttf`, family, style);
  }

  // Dimensions A4 (mm)
  const pageWidth = 210;
  const pageHeight = 297;
  const mx = 12;                 // marge latérale
  const contentW = pageWidth - 2 * mx;
  const contentBottom = 258;     // limite du contenu (pied de page réservé)
  const HEAD = 'Funnel';
  const BODY = 'Montserrat';

  // Applique une police (avec repli Helvetica si les TTF sont introuvables)
  const setFont = (family: string, style: string) => {
    if (fontsAvailable) {
      pdf.setFont(family, style);
    } else {
      pdf.setFont('helvetica', style === 'normal' ? 'normal' : 'bold');
    }
  };

  const inkText = () => pdf.setTextColor(...INK);
  const whiteText = () => pdf.setTextColor(255, 255, 255);

  const text = (t: string, x: number, y: number, size: number, family = BODY, style = 'normal', color: RGB = INK) => {
    pdf.setFontSize(size);
    setFont(family, style);
    pdf.setTextColor(...color);
    pdf.text(t, x, y);
  };

  const centerText = (t: string, y: number, size: number, family = BODY, style = 'normal', color: RGB = INK) => {
    pdf.setFontSize(size);
    setFont(family, style);
    pdf.setTextColor(...color);
    const w = pdf.getTextWidth(t);
    pdf.text(t, (pageWidth - w) / 2, y);
  };

  const rightText = (t: string, x: number, y: number, size: number, family = BODY, style = 'normal', color: RGB = INK) => {
    pdf.setFontSize(size);
    setFont(family, style);
    pdf.setTextColor(...color);
    const w = pdf.getTextWidth(t);
    pdf.text(t, x - w, y);
  };

  const splitLines = (t: string, maxWidth: number, size: number, family = BODY, style = 'normal'): string[] => {
    pdf.setFontSize(size);
    setFont(family, style);
    return pdf.splitTextToSize(t, maxWidth) as string[];
  };

  // Fond papier + mini-en-tête (pages 2+)
  const paintPageChrome = (pageIndex: number) => {
    pdf.setFillColor(...PAPER);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    if (pageIndex > 1) {
      // Mini-marque
      pdf.setFillColor(...INK);
      pdf.roundedRect(mx, 12, 6.5, 6.5, 1.8, 1.8, 'F');
      pdf.setFontSize(8.5);
      setFont(HEAD, 'bold');
      whiteText();
      pdf.text('W', mx + 3.25, 17, { align: 'center' });
      // Titre de rappel + n° de certificat
      text('Workyt — Certificat de bénévolat', mx + 9.5, 17.2, 8.5, HEAD, 'semibold');
      rightText(`N° ${certificate.certificateNumber}`, pageWidth - mx, 17.2, 7.5, BODY, 'medium', FOOT);
      // Filet
      pdf.setDrawColor(...LINE);
      pdf.setLineWidth(0.5);
      pdf.line(mx, 21.5, pageWidth - mx, 21.5);
    }
  };

  let currentPage = 1;
  paintPageChrome(1);

  // Nouvelle page si le bloc ne rentre pas, avec chrome complet
  const addPageIfNeeded = (requiredHeight: number, y: number): number => {
    if (y + requiredHeight <= contentBottom) return y;
    pdf.addPage();
    currentPage = pdf.getNumberOfPages();
    paintPageChrome(currentPage);
    return 34;
  };

  /* ================= COUVERTURE (carte tête de page) ================= */

  const cardX = mx;
  const cardY = 10;
  const cardW = contentW;
  const cardH = 84;
  const cardR = 5;

  // Fond dégradé pêche + halos + grain, rognés dans la carte arrondie
  pdf.saveGraphicsState();
  pdf.roundedRect(cardX, cardY, cardW, cardH, cardR, cardR, null);
  pdf.clip('nonzero');

  // Dégradé linéaire simulé par bandes (#fff3e0 → #ffe8d1 → #ffd8b8)
  const stops: RGB[] = [[255, 243, 224], [255, 232, 209], [255, 216, 184]];
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const bandCount = 72;
  for (let i = 0; i < bandCount; i++) {
    const t = i / (bandCount - 1);
    const seg = t < 0.5 ? 0 : 1;
    const lt = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const [r, g, b] = [0, 1, 2].map((k) => lerp(stops[seg][k], stops[seg + 1][k], lt)) as RGB;
    pdf.setFillColor(r, g, b);
    pdf.rect(cardX, cardY + (cardH * i) / bandCount, cardW, cardH / bandCount + 0.15, 'F');
  }

  // Halos radiaux (comme le gradient de la couverture de référence)
  const halo = (cx: number, cy: number, r: number, color: RGB, opacity: number) => {
    pdf.setGState(new GState({ opacity }));
    pdf.setFillColor(...color);
    pdf.circle(cardX + cx * cardW, cardY + cy * cardH, r, 'F');
    pdf.setGState(new GState({ opacity: 1 }));
  };
  halo(0.18, 0.14, 32, PEACH, 0.55);
  halo(0.84, 0.06, 26, PINK, 0.45);
  halo(0.52, 0.98, 40, YELLOW, 0.5);

  // Grain (feTurbulence approximé par des points semi-transparents)
  pdf.setFillColor(...GRAIN);
  pdf.setGState(new GState({ opacity: 0.10 }));
  let seed = 42; // pseudo-aléatoire déterministe
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 550; i++) {
    pdf.circle(cardX + rand() * cardW, cardY + rand() * cardH, 0.16, 'F');
  }
  pdf.setGState(new GState({ opacity: 1 }));
  pdf.restoreGraphicsState();

  // Contour de la carte
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(0.9);
  pdf.roundedRect(cardX, cardY, cardW, cardH, cardR, cardR, 'S');

  // Marque : carré noir + « W » + « Workyt »
  pdf.setFillColor(...INK);
  pdf.roundedRect(19, 17, 9.5, 9.5, 2.6, 2.6, 'F');
  pdf.setFontSize(13);
  setFont(HEAD, 'bold');
  whiteText();
  pdf.text('W', 23.75, 24.3, { align: 'center' });
  text('Workyt', 31.5, 24.3, 13, HEAD, 'bold');

  // Pilule noire (type « document de conception »)
  const pillLabel = 'CERTIFICAT DE BÉNÉVOLAT';
  pdf.setFontSize(6.8);
  setFont(BODY, 'semibold');
  const pillW = pdf.getTextWidth(pillLabel) + 9;
  const pillH = 6.2;
  const pillX = cardX + cardW - 6 - pillW;
  const pillY = 17.5;
  pdf.setFillColor(...INK);
  pdf.setGState(new GState({ opacity: 0.92 }));
  pdf.roundedRect(pillX, pillY, pillW, pillH, pillH / 2, pillH / 2, 'F');
  pdf.setGState(new GState({ opacity: 1 }));
  pdf.setFontSize(6.8);
  setFont(BODY, 'semibold');
  whiteText();
  pdf.text(pillLabel, pillX + pillW / 2, pillY + 4.3, { align: 'center' });

  // Titre display
  text('Certificat de', 19, 51, 29, HEAD, 'bold');
  text('bénévolat', 19, 64, 29, HEAD, 'bold');

  // Chapô
  text('Reconnaissance des services rendus au sein de l’association Workyt.', 19, 75, 10, BODY, 'medium', LEAD);

  // Méta de couverture
  text('Association Workyt · Lyon', 19, 87.5, 7.5, BODY, 'medium', FOOT);
  rightText(`N° ${certificate.certificateNumber}`, cardX + cardW - 6, 87.5, 8, BODY, 'semibold');

  /* ================== CORPS : sections numérotées ================== */

  let y = cardY + cardH + 14; // 108

  // En-tête de section : carré orange numéroté + titre + filet encre
  const sectionHead = (num: string, title: string, yy: number): number => {
    pdf.setFillColor(...ACCENT);
    pdf.roundedRect(mx, yy - 6.4, 8, 8, 2.2, 2.2, 'F');
    pdf.setFontSize(11);
    setFont(HEAD, 'bold');
    whiteText();
    pdf.text(num, mx + 4, yy - 0.3, { align: 'center' });
    text(title, mx + 11.5, yy, 16, HEAD, 'bold');
    pdf.setDrawColor(...INK);
    pdf.setLineWidth(0.9);
    pdf.line(mx, yy + 3.6, mx + contentW, yy + 3.6);
    return yy + 11.5;
  };

  /* ---- Section 1 · Le bénévole ---- */
  y = addPageIfNeeded(60, y);
  y = sectionHead('1', 'Le bénévole', y);

  text(certificate.volunteerName, mx + 2, y, 22, HEAD, 'bold');
  y += 8;

  const startDate = new Date(certificate.startDate).toLocaleDateString('fr-FR');
  const endDate = certificate.endDate ? new Date(certificate.endDate).toLocaleDateString('fr-FR') : null;
  const periodText = endDate ? `Du ${startDate} au ${endDate}` : `Depuis le ${startDate} (en cours)`;
  const rows: Array<[string, string]> = [
    ['POSTE OCCUPÉ', certificate.position],
    ['DURÉE D’ENGAGEMENT', certificate.duration],
    ['PÉRIODE D’ENGAGEMENT', periodText],
  ];
  const rowH = 7;
  const pad = 5;
  const boxH = pad + rows.length * rowH + pad - 2;
  y = addPageIfNeeded(boxH + 10, y);
  const boxY = y;
  pdf.setFillColor(...PAPER2);
  pdf.setDrawColor(...BOXLINE);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(mx, boxY, contentW, boxH, 3, 3, 'FD');
  rows.forEach(([label, value], i) => {
    const ry = boxY + pad + 3 + i * rowH;
    text(label, mx + 7, ry, 7.2, BODY, 'semibold', FOOT);
    text(value, mx + 62, ry, 10.2, BODY, 'medium');
  });
  y = boxY + boxH + 12;

  /* ---- Sections 2 & 3 · listes en bloc « verdict » ---- */
  const listSection = (num: string, title: string, items: string[], yy: number): number => {
    if (!items.length) return yy;
    const innerW = contentW - 7 - 11;
    const lineH = 5.2;
    const blocks = items.map((item) => splitLines(item, innerW, 10.2));
    const lineCount = blocks.reduce((n, l) => n + l.length, 0);
    const vBoxH = pad + lineCount * lineH + (items.length - 1) * 1.6 + pad - 2;

    // Le bloc entier (titre + boîte) ne doit pas être scindé inutilement
    yy = addPageIfNeeded(11.5 + vBoxH + 8, yy);
    yy = sectionHead(num, title, yy);

    // Boîte verdict : dégradé orange très léger + bordure accent
    pdf.saveGraphicsState();
    pdf.roundedRect(mx, yy, contentW, vBoxH, 3, 3, null);
    pdf.clip('nonzero');
    const vStops: RGB[] = [
      [255, 243, 233],
      [255, 238, 222],
    ];
    for (let i = 0; i < bandCount; i++) {
      const t = i / (bandCount - 1);
      const [r, g, b] = [0, 1, 2].map((k) => lerp(vStops[0][k], vStops[1][k], t)) as RGB;
      pdf.setFillColor(r, g, b);
      pdf.rect(mx, yy + (vBoxH * i) / bandCount, contentW, vBoxH / bandCount + 0.15, 'F');
    }
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...ACCENT);
    pdf.setLineWidth(0.5);
    pdf.setGState(new GState({ opacity: 0.45 }));
    pdf.roundedRect(mx, yy, contentW, vBoxH, 3, 3, 'S');
    pdf.setGState(new GState({ opacity: 1 }));

    let ty = yy + pad + 3.4;
    blocks.forEach((lines, i) => {
      text('•', mx + 7, ty, 10.2, BODY, 'bold', ACCENT);
      lines.forEach((line) => {
        text(line, mx + 12, ty, 10.2, BODY, 'normal');
        ty += lineH;
      });
      if (i < blocks.length - 1) ty += 1.6;
    });
    return yy + vBoxH + 12;
  };

  y = listSection('2', 'Missions réalisées', certificate.missions, y);
  y = listSection('3', 'Contributions apportées', certificate.contributions, y);

  /* ================== PIED DE PAGE (dernière page) ================== */

  const totalPages = pdf.getNumberOfPages();
  pdf.setPage(totalPages);

  const sepY = 266;
  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.6);
  pdf.line(mx, sepY, mx + contentW, sepY);

  // Signature (gauche)
  text('Signature et cachet :', mx, sepY + 8, 8.5, BODY, 'semibold');
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(0.6);
  pdf.line(mx, sepY + 17, mx + 62, sepY + 17);

  // Association (centre)
  centerText('Workyt', sepY + 8, 10, HEAD, 'semibold');
  centerText('25 Rue Jaboulay — 69007 Lyon, France', sepY + 14, 7.5, BODY, 'normal', FOOT);

  // Émission (droite)
  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString('fr-FR');
  rightText(`Émis le ${issuedDate}`, mx + contentW, sepY + 8, 8, BODY, 'medium', FOOT);
  rightText(`N° ${certificate.certificateNumber}`, mx + contentW, sepY + 14, 7.5, BODY, 'medium', FOOT);

  // Pagination discrète sur toutes les pages
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    text(`Page ${i} / ${totalPages}`, mx + contentW, 291, 7, BODY, 'medium', FOOT);
    text('Workyt · Certificat de bénévolat', mx, 291, 7, BODY, 'medium', FOOT);
  }

  return Buffer.from(pdf.output('arraybuffer'));
}
