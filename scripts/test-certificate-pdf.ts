/* Test visuel du générateur de certificat PDF (style « cas de jeu guerre »).
 * Build : npx esbuild scripts/test-certificate-pdf.ts --bundle --platform=node --format=cjs --outfile=tmp-pdf-test/test.cjs --alias:@/models/VolunteerCertificate=./scripts/test-certificate-pdf.stub.ts
 * Run   : node tmp-pdf-test/test.cjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { generateCertificatePDF } from '../src/lib/pdfGenerator';

const base: any = {
  volunteerName: 'Élodie Martin',
  position: 'Responsable communauté & animations',
  missions: [
    'Animation des ateliers hebdomadaires de découverte du code pour les collégiens de Lyon',
    'Coordination de la Guerre des Clans — suivi des clans, validation des scores et arbitrage des litiges',
    "Création de défis ludiques hebdomadaires ayant fait progresser l'assiduité des jeunes de 40 %",
  ],
  contributions: [
    "Mise en place d'un système de badges et de récompenses repris dans toute l'association",
    'Formation de 6 animateurs bénévoles aux outils pédagogiques Workyt',
  ],
  duration: '8 mois',
  startDate: new Date('2025-09-15'),
  endDate: new Date('2026-05-30'),
  certificateNumber: 'WKT-2026-0142',
  issuedDate: new Date('2026-06-12'),
  issuedBy: 'Bureau de Workyt',
};

const long: any = {
  ...base,
  volunteerName: 'Nadir Ben Salah',
  missions: [
    ...base.missions,
    "Organisation du tournoi inter-écoles « Clash des Clans » réunissant 120 participants sur un week-end complet, avec logistique, arbitrage et remise des prix",
    "Refonte du parcours d'accueil des nouveaux bénévoles : documentation, binômes de parrainage et suivi d'intégration sur les trois premiers mois",
    "Développement d'un tableau de bord de suivi des clans permettant aux capitaines de visualiser la santé de leur garnison en temps réel",
  ],
  contributions: [
    ...base.contributions,
    "Rédaction du cahier des charges du module « Guerre des Clans », désormais document de référence du système de gamification",
    'Animation de 12 permanences hebdomadaires en centre de loisirs, accueil moyen de 25 jeunes par séance',
  ],
};

async function renderPdf(pdfPath: string, outPrefix: string) {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas } = require('@napi-rs/canvas');
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data }).promise;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    writeFileSync(`${outPrefix}-p${p}.png`, canvas.toBuffer('image/png'));
    console.log(`rendered ${outPrefix}-p${p}.png`);
  }
}

const run = async () => {
  mkdirSync('tmp-pdf-test', { recursive: true });

  const buf1 = await generateCertificatePDF(base);
  writeFileSync('tmp-pdf-test/cert-simple.pdf', buf1);
  console.log('cert-simple.pdf', buf1.length, 'bytes');

  const buf2 = await generateCertificatePDF(long);
  writeFileSync('tmp-pdf-test/cert-long.pdf', buf2);
  console.log('cert-long.pdf', buf2.length, 'bytes');

  await renderPdf('tmp-pdf-test/cert-simple.pdf', 'tmp-pdf-test/simple');
  await renderPdf('tmp-pdf-test/cert-long.pdf', 'tmp-pdf-test/long');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
