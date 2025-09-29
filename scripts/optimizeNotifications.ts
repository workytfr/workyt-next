#!/usr/bin/env ts-node

/**
 * Script d'optimisation des notifications
 * À exécuter quotidiennement via cron job
 */

import { NotificationService } from '../src/lib/notificationService';
import dbConnect from '../src/lib/mongodb';

async function main() {
    try {
        console.log('🚀 Début de l\'optimisation des notifications...');
        
        // Connexion à la base de données
        await dbConnect();
        console.log('✅ Connexion à la base de données établie');
        
        // Exécution de l'optimisation
        await NotificationService.optimizeNotifications();
        
        console.log('✅ Optimisation des notifications terminée avec succès');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'optimisation des notifications:', error);
        process.exit(1);
    }
}

// Exécution du script
main();
