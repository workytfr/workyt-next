import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import Badge from '../src/models/Badge';
import badges from '../src/data/badges';

// Charger les variables d'environnement
dotenv.config();

// URL MongoDB par défaut pour le développement local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workyt';

async function seedBadges() {
  try {
    console.log('Variables d\'environnement chargées:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'Définie' : 'Non définie',
      NODE_ENV: process.env.NODE_ENV
    });
    console.log('Tentative de connexion à MongoDB avec URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB');

    for (const badge of badges) {
      const existing = await Badge.findOne({ slug: badge.slug });
      if (!existing) {
        await Badge.create(badge);
        console.log(`Badge ajouté : ${badge.name}`);
      } else {
        console.log(`Déjà présent : ${badge.name}`);
      }
    }
    console.log('Seed des badges terminé.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seed :', err);
    process.exit(1);
  }
}

seedBadges(); 