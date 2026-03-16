import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import Quest from '../src/models/Quest';
import Chest from '../src/models/Chest';
import connectDB from '../src/lib/mongodb';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script pour initialiser les quêtes et coffres dans la base de données
 */
async function seedQuests() {
  try {
    await connectDB();
    console.log('Connexion à la base de données réussie');

    // Créer les coffres
    // Rappel: 1 gemme = 100 points
    const chests = [
      {
        type: 'common' as const,
        name: 'Coffre Commun',
        description: 'Un coffre basique avec des récompenses modestes',
        possibleRewards: [
          { type: 'points' as const, amount: 30, weight: 45 },  // Floor relevé : 30 pts
          { type: 'points' as const, amount: 50, weight: 30 },  // Commun : 50 pts
          { type: 'points' as const, amount: 75, weight: 15 },  // Peu commun : 75 pts
          { type: 'points' as const, amount: 100, weight: 6 },  // Rare : 100 pts
          { type: 'gems' as const, amount: 1, weight: 4 },      // Rare : 1 gemme
          { type: 'mushrooms' as const, amount: 1, weight: 5 }, // ~5% : 1 champignon
        ],
        isActive: true
      },
      {
        type: 'rare' as const,
        name: 'Coffre Rare',
        description: 'Un coffre rare avec de meilleures récompenses',
        possibleRewards: [
          { type: 'points' as const, amount: 75, weight: 35 },  // Floor relevé : 75 pts
          { type: 'points' as const, amount: 120, weight: 25 }, // Commun : 120 pts
          { type: 'points' as const, amount: 200, weight: 15 }, // Peu commun : 200 pts
          { type: 'gems' as const, amount: 1, weight: 12 },     // Commun : 1 gemme
          { type: 'gems' as const, amount: 2, weight: 8 },      // Peu commun : 2 gemmes
          { type: 'gems' as const, amount: 3, weight: 5 },      // Rare : 3 gemmes
          { type: 'mushrooms' as const, amount: 2, weight: 5 }, // ~5% : 2 champignons
        ],
        isActive: true
      },
      {
        type: 'epic' as const,
        name: 'Coffre Épique',
        description: 'Un coffre épique avec des récompenses exceptionnelles',
        possibleRewards: [
          { type: 'points' as const, amount: 250, weight: 30 }, // Floor : 250 pts
          { type: 'points' as const, amount: 400, weight: 20 }, // Peu commun : 400 pts
          { type: 'points' as const, amount: 600, weight: 10 }, // Rare : 600 pts
          { type: 'gems' as const, amount: 2, weight: 18 },     // Commun : 2 gemmes
          { type: 'gems' as const, amount: 4, weight: 12 },     // Peu commun : 4 gemmes
          { type: 'gems' as const, amount: 7, weight: 8 },      // Rare : 7 gemmes
          { type: 'gems' as const, amount: 12, weight: 3 },     // Très rare : 12 gemmes
          { type: 'mushrooms' as const, amount: 3, weight: 3 }, // ~3% : 3 champignons
          { type: 'mushrooms' as const, amount: 5, weight: 1 }, // ~1% : 5 champignons
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyPink.webp', weight: 1 },  // ~1% : Cosmétique
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyWaMe.webp', weight: 1 },  // ~1% : Cosmétique
        ],
        isActive: true
      },
      {
        type: 'legendary' as const,
        name: 'Coffre Légendaire',
        description: 'Le coffre ultime avec les meilleures récompenses',
        possibleRewards: [
          { type: 'points' as const, amount: 500, weight: 25 },  // Floor relevé : 500 pts
          { type: 'points' as const, amount: 750, weight: 17 },  // Peu commun : 750 pts
          { type: 'points' as const, amount: 1000, weight: 9 },  // Rare : 1000 pts
          { type: 'gems' as const, amount: 5, weight: 20 },      // Commun : 5 gemmes
          { type: 'gems' as const, amount: 10, weight: 13 },     // Peu commun : 10 gemmes
          { type: 'gems' as const, amount: 18, weight: 6 },      // Rare : 18 gemmes
          { type: 'gems' as const, amount: 25, weight: 3 },      // Très rare : 25 gemmes
          { type: 'mushrooms' as const, amount: 5, weight: 3 },  // ~3% : 5 champignons
          { type: 'mushrooms' as const, amount: 10, weight: 1 }, // ~1% : 10 champignons
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyFrenchies.webp', weight: 1 }, // ~1% : Cosmétique exclusif
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyMecha.webp', weight: 1 },     // ~1% : Cosmétique exclusif
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyTerreur.webp', weight: 1 },   // ~1% : Cosmétique exclusif
        ],
        isActive: true
      }
    ];

    console.log('Création des coffres...');
    for (const chestData of chests) {
      const existingChest = await Chest.findOne({ type: chestData.type });
      if (existingChest) {
        console.log(`Coffre ${chestData.type} existe déjà, mise à jour...`);
        await Chest.findOneAndUpdate({ type: chestData.type }, chestData, { upsert: true });
      } else {
        await Chest.create(chestData);
        console.log(`Coffre ${chestData.type} créé`);
      }
    }

    // Créer les quêtes journalières
    // Récompenses modestes : 3-8 points, parfois un coffre commun pour les plus durs
    const dailyQuests = [
      {
        slug: 'daily_forum_answer',
        name: 'Répondeur du Jour',
        description: 'Répondre à 3 questions sur le forum aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'forum_answer' as const,
          target: 3
        },
        rewards: [
          { type: 'points' as const, amount: 5 },
          { type: 'chest' as const, chestType: 'common' as const }
        ],
        isActive: true
      },
      {
        slug: 'daily_quiz_complete',
        name: 'Quiz Quotidien',
        description: 'Compléter 2 quiz aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'quiz_complete' as const,
          target: 2
        },
        rewards: [
          { type: 'points' as const, amount: 8 }
        ],
        isActive: true
      },
      {
        slug: 'daily_fiche_create',
        name: 'Créateur de Fiches',
        description: 'Créer 1 fiche aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'fiche_create' as const,
          target: 1
        },
        rewards: [
          { type: 'points' as const, amount: 5 }
        ],
        isActive: true
      },
      {
        slug: 'daily_forum_answer_5',
        name: 'Expert du Forum',
        description: 'Répondre à 5 questions sur le forum aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'forum_answer' as const,
          target: 5
        },
        rewards: [
          { type: 'points' as const, amount: 8 },
          { type: 'chest' as const, chestType: 'common' as const }
        ],
        isActive: true
      },
      {
        slug: 'daily_quiz_score',
        name: 'Quiz Parfait',
        description: 'Obtenir un score de 90% ou plus dans un quiz aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'quiz_score' as const,
          target: 1,
          metadata: {
            minScore: 90
          }
        },
        rewards: [
          { type: 'points' as const, amount: 5 }
        ],
        isActive: true
      },
      {
        slug: 'daily_fiche_like',
        name: 'Fiche Appréciée',
        description: 'Recevoir 3 likes sur vos fiches aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'fiche_like_received' as const,
          target: 3
        },
        rewards: [
          { type: 'points' as const, amount: 5 }
        ],
        isActive: true
      },
      {
        slug: 'daily_forum_validated',
        name: 'Réponse Validée',
        description: 'Avoir une réponse validée aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'forum_answer_validated' as const,
          target: 1
        },
        rewards: [
          { type: 'points' as const, amount: 8 },
          { type: 'chest' as const, chestType: 'common' as const }
        ],
        isActive: true
      },
      {
        slug: 'daily_quiz_complete_3',
        name: 'Triple Quiz',
        description: 'Compléter 3 quiz aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'quiz_complete' as const,
          target: 3
        },
        rewards: [
          { type: 'points' as const, amount: 10 },
          { type: 'chest' as const, chestType: 'common' as const }
        ],
        isActive: true
      },
      {
        slug: 'daily_fiche_bookmark',
        name: 'Collectionneur',
        description: 'Mettre 2 fiches en favoris aujourd\'hui',
        type: 'daily' as const,
        condition: {
          action: 'fiche_bookmark' as const,
          target: 2
        },
        rewards: [
          { type: 'points' as const, amount: 3 }
        ],
        isActive: true
      }
    ];

    // Créer les quêtes hebdomadaires
    // Récompenses modérées : 15-30 points, coffre commun/rare, pas de gemmes
    const weeklyQuests = [
      {
        slug: 'weekly_forum_validated',
        name: 'Expert de la Semaine',
        description: 'Obtenir 5 réponses validées cette semaine',
        type: 'weekly' as const,
        condition: {
          action: 'forum_answer_validated' as const,
          target: 5
        },
        rewards: [
          { type: 'points' as const, amount: 30 },
          { type: 'chest' as const, chestType: 'rare' as const }
        ],
        isActive: true
      },
      {
        slug: 'weekly_quiz_score',
        name: 'Maître des Quiz',
        description: 'Obtenir un score de 80% ou plus dans 5 quiz cette semaine',
        type: 'weekly' as const,
        condition: {
          action: 'quiz_score' as const,
          target: 5,
          metadata: {
            minScore: 80
          }
        },
        rewards: [
          { type: 'points' as const, amount: 25 },
          { type: 'chest' as const, chestType: 'rare' as const }
        ],
        isActive: true
      },
      {
        slug: 'weekly_fiche_likes',
        name: 'Fiches Populaires',
        description: 'Recevoir 10 likes sur vos fiches cette semaine',
        type: 'weekly' as const,
        condition: {
          action: 'fiche_like_received' as const,
          target: 10
        },
        rewards: [
          { type: 'points' as const, amount: 20 },
          { type: 'chest' as const, chestType: 'common' as const }
        ],
        isActive: true
      },
      {
        slug: 'weekly_fiche_creator',
        name: 'Auteur de la Semaine',
        description: 'Créer 5 fiches cette semaine',
        type: 'weekly' as const,
        condition: {
          action: 'fiche_create' as const,
          target: 5
        },
        rewards: [
          { type: 'points' as const, amount: 20 },
          { type: 'chest' as const, chestType: 'common' as const }
        ],
        isActive: true
      }
    ];

    // Créer les quêtes mensuelles
    // Récompenses raisonnables : 50-80 pts, 1 gemme, coffre rare/epic/legendary selon difficulté
    const monthlyQuests = [
      {
        slug: 'monthly_forum_master',
        name: 'Maître du Forum',
        description: 'Répondre à 30 questions ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'forum_answer' as const,
          target: 30
        },
        rewards: [
          { type: 'points' as const, amount: 60 },
          { type: 'gems' as const, amount: 1 },
          { type: 'chest' as const, chestType: 'epic' as const }
        ],
        isActive: true
      },
      {
        slug: 'monthly_quiz_master',
        name: 'Champion des Quiz',
        description: 'Compléter 20 quiz ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'quiz_complete' as const,
          target: 20
        },
        rewards: [
          { type: 'points' as const, amount: 50 },
          { type: 'gems' as const, amount: 1 },
          { type: 'chest' as const, chestType: 'rare' as const }
        ],
        isActive: true
      },
      {
        slug: 'monthly_fiche_creator',
        name: 'Auteur Prolifique',
        description: 'Créer 15 fiches ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'fiche_create' as const,
          target: 15
        },
        rewards: [
          { type: 'points' as const, amount: 60 },
          { type: 'gems' as const, amount: 1 },
          { type: 'chest' as const, chestType: 'legendary' as const }
        ],
        isActive: true
      },
      {
        slug: 'monthly_course_complete',
        name: 'Finisseur',
        description: 'Terminer 2 cours ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'course_complete' as const,
          target: 2
        },
        rewards: [
          { type: 'points' as const, amount: 80 },
          { type: 'gems' as const, amount: 1 },
          { type: 'chest' as const, chestType: 'legendary' as const }
        ],
        isActive: true
      }
    ];

    const allQuests = [...dailyQuests, ...weeklyQuests, ...monthlyQuests];

    console.log('Création des quêtes...');
    for (const questData of allQuests) {
      const existingQuest = await Quest.findOne({ slug: questData.slug });
      if (existingQuest) {
        console.log(`Quête ${questData.slug} existe déjà, mise à jour...`);
        await Quest.findOneAndUpdate({ slug: questData.slug }, questData, { upsert: true });
      } else {
        await Quest.create(questData);
        console.log(`Quête ${questData.slug} créée`);
      }
    }

    console.log('Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedQuests();
