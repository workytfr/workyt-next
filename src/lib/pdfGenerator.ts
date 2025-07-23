import jsPDF from 'jspdf';
import { IVolunteerCertificate } from '@/models/VolunteerCertificate';

export async function generateCertificatePDF(certificate: IVolunteerCertificate): Promise<Buffer> {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  // Dimensions de la page A4
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  
  // Configuration des polices
  pdf.setFont('helvetica');
  
  // Fonction pour centrer le texte
  const centerText = (text: string, y: number, fontSize: number = 12, fontStyle: string = 'normal') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    const textWidth = pdf.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    pdf.text(text, x, y);
  };
  
  // Fonction pour ajouter du texte avec style
  const addText = (text: string, x: number, y: number, fontSize: number = 12, fontStyle: string = 'normal') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.text(text, x, y);
  };
  
  // Fonction pour diviser le texte en lignes
  const splitTextIntoLines = (text: string, maxWidth: number, fontSize: number): string[] => {
    pdf.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      if (pdf.getTextWidth(testLine) > maxWidth) {
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          // Mot trop long, le diviser
          lines.push(word);
        }
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  };
  
  // Fonction pour ajouter une nouvelle page si nécessaire
  const addPageIfNeeded = (requiredHeight: number, currentY: number): number => {
    if (currentY + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      
      // Ajouter la bordure sur la nouvelle page
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1.5);
      pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
      
      return margin + 20; // Retour en haut de la nouvelle page
    }
    return currentY;
  };
  
  // Page 1 - En-tête et informations principales
  let currentY = margin + 20;
  
  // Bordure de la page
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
  
  // En-tête
  centerText('WORKYT', currentY, 24, 'bold');
  currentY += 15;
  centerText('CERTIFICAT DE BÉNÉVOLAT', currentY, 18, 'bold');
  currentY += 12;
  centerText('Reconnaissance des services rendus', currentY, 12);
  currentY += 20;
  
  // Numéro de certificat
  addText(`N° ${certificate.certificateNumber}`, pageWidth - margin - 40, margin + 15, 10);
  
  // Nom du bénévole
  centerText(certificate.volunteerName, currentY, 16, 'bold');
  currentY += 25;
  
  // Informations principales
  const leftMargin = margin + 10;
  const rightMargin = pageWidth - margin - 10;
  const labelWidth = 60;
  const valueX = leftMargin + labelWidth + 10;
  
  // Poste occupé
  addText('Poste occupé :', leftMargin, currentY, 12, 'bold');
  addText(certificate.position, valueX, currentY, 12);
  currentY += 15;
  
  // Durée d'engagement
  addText('Durée d\'engagement :', leftMargin, currentY, 12, 'bold');
  addText(certificate.duration, valueX, currentY, 12);
  currentY += 15;
  
  // Période d'engagement
  addText('Période d\'engagement :', leftMargin, currentY, 12, 'bold');
  const startDate = new Date(certificate.startDate).toLocaleDateString('fr-FR');
  const endDate = certificate.endDate ? new Date(certificate.endDate).toLocaleDateString('fr-FR') : 'en cours';
  const periodText = certificate.endDate ? `Du ${startDate} au ${endDate}` : `Du ${startDate} (${endDate})`;
  addText(periodText, valueX, currentY, 12);
  currentY += 20;
  
  // Missions réalisées
  addText('Missions réalisées :', leftMargin, currentY, 12, 'bold');
  currentY += 8;
  
  const missionsMaxWidth = rightMargin - valueX;
  certificate.missions.forEach((mission) => {
    const missionLines = splitTextIntoLines(`• ${mission}`, missionsMaxWidth, 11);
    
    currentY = addPageIfNeeded(missionLines.length * 6, currentY);
    
    missionLines.forEach((line) => {
      addText(line, valueX, currentY, 11);
      currentY += 6;
    });
    currentY += 2;
  });
  
  currentY += 10;
  
  // Contributions apportées
  addText('Contributions apportées :', leftMargin, currentY, 12, 'bold');
  currentY += 8;
  
  certificate.contributions.forEach((contribution) => {
    const contributionLines = splitTextIntoLines(`• ${contribution}`, missionsMaxWidth, 11);
    
    currentY = addPageIfNeeded(contributionLines.length * 6, currentY);
    
    contributionLines.forEach((line) => {
      addText(line, valueX, currentY, 11);
      currentY += 6;
    });
    currentY += 2;
  });
  
  // Pied de page sur la dernière page
  const footerY = pageHeight - 80;
  
  // S'assurer que le pied de page est sur la dernière page
  if (currentY > footerY - 20) {
    pdf.addPage();
    
    // Ajouter la bordure sur la nouvelle page
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1.5);
    pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    
    currentY = margin + 20;
  }
  
  // Ligne de séparation
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  
  // Signature
  addText('Signature et cachet :', leftMargin, footerY, 12, 'bold');
  
  // Ligne de signature
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(leftMargin, footerY + 8, leftMargin + 80, footerY + 8);
  
  // Informations de l'association
  centerText('WORKYT', footerY + 20, 12, 'bold');
  centerText('25 Rue Jaboulay', footerY + 30, 10);
  centerText('69007 Lyon, France', footerY + 37, 10);
  
  // Date d'émission
  const issuedDate = new Date(certificate.issuedDate).toLocaleDateString('fr-FR');
  addText(`Émis le ${issuedDate}`, pageWidth - margin - 60, footerY + 15, 10);
  addText('Bureau de Workyt', leftMargin, footerY + 15, 10);
  
  return Buffer.from(pdf.output('arraybuffer'));
} 