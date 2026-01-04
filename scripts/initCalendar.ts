/**
 * Script pour initialiser le calendrier de l'avent
 * Usage: npx ts-node scripts/initCalendar.ts
 */

import dbConnect from '../src/lib/mongodb';
import { initializeCalendarPeriod } from '../src/lib/calendarService';

async function main() {
  try {
    console.log('Connexion à la base de données...');
    await dbConnect();
    console.log('✓ Connecté à la base de données');

    // Initialiser le calendrier de l'avent (22 décembre 2025 - 7 janvier 2026)
    const startDate = new Date(2025, 11, 22); // 22 décembre 2025
    const endDate = new Date(2026, 0, 7); // 7 janvier 2026

    console.log(`Initialisation du calendrier du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}...`);
    
    await initializeCalendarPeriod(startDate, endDate);
    
    console.log('✓ Calendrier initialisé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

main();

