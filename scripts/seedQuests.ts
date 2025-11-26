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
          { type: 'points' as const, amount: 20, weight: 50 }, // Très commun : 20 points
          { type: 'points' as const, amount: 30, weight: 30 }, // Commun : 30 points
          { type: 'points' as const, amount: 50, weight: 15 }, // Peu commun : 50 points
          { type: 'points' as const, amount: 100, weight: 4 }, // Rare : 100 points (équivaut à 1 gemme)
          { type: 'gems' as const, amount: 1, weight: 1 }, // Très rare : 1 gemme (équivaut à 100 points)
        ],
        isActive: true
      },
      {
        type: 'rare' as const,
        name: 'Coffre Rare',
        description: 'Un coffre rare avec de meilleures récompenses',
        possibleRewards: [
          { type: 'points' as const, amount: 50, weight: 40 }, // Très commun : 50 points
          { type: 'points' as const, amount: 100, weight: 30 }, // Commun : 100 points (1 gemme)
          { type: 'points' as const, amount: 150, weight: 15 }, // Peu commun : 150 points
          { type: 'gems' as const, amount: 1, weight: 10 }, // Commun : 1 gemme (équivaut à 100 points)
          { type: 'gems' as const, amount: 2, weight: 4 }, // Rare : 2 gemmes (équivaut à 200 points)
          { type: 'gems' as const, amount: 3, weight: 1 }, // Très rare : 3 gemmes (équivaut à 300 points)
        ],
        isActive: true
      },
      {
        type: 'epic' as const,
        name: 'Coffre Épique',
        description: 'Un coffre épique avec des récompenses exceptionnelles',
        possibleRewards: [
          { type: 'points' as const, amount: 200, weight: 30 }, // Commun : 200 points (2 gemmes)
          { type: 'points' as const, amount: 300, weight: 20 }, // Peu commun : 300 points (3 gemmes)
          { type: 'points' as const, amount: 500, weight: 10 }, // Rare : 500 points (5 gemmes)
          { type: 'gems' as const, amount: 2, weight: 20 }, // Commun : 2 gemmes
          { type: 'gems' as const, amount: 3, weight: 12 }, // Peu commun : 3 gemmes
          { type: 'gems' as const, amount: 5, weight: 5 }, // Rare : 5 gemmes
          { type: 'gems' as const, amount: 10, weight: 2 }, // Très rare : 10 gemmes
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyPink.webp', weight: 1 }, // Légendaire : cosmétique
        ],
        isActive: true
      },
      {
        type: 'legendary' as const,
        name: 'Coffre Légendaire',
        description: 'Le coffre ultime avec les meilleures récompenses',
        possibleRewards: [
          { type: 'points' as const, amount: 300, weight: 25 }, // Commun : 300 points (3 gemmes)
          { type: 'points' as const, amount: 500, weight: 20 }, // Peu commun : 500 points (5 gemmes)
          { type: 'points' as const, amount: 1000, weight: 8 }, // Rare : 1000 points (10 gemmes)
          { type: 'gems' as const, amount: 5, weight: 25 }, // Commun : 5 gemmes
          { type: 'gems' as const, amount: 10, weight: 15 }, // Peu commun : 10 gemmes
          { type: 'gems' as const, amount: 15, weight: 5 }, // Rare : 15 gemmes
          { type: 'gems' as const, amount: 25, weight: 1 }, // Très rare : 25 gemmes
          { type: 'gems' as const, amount: 50, weight: 1 }, // Légendaire : 50 gemmes
          { type: 'cosmetic' as const, cosmeticType: 'profile_image' as const, cosmeticId: 'FoxyFrenchies.webp', weight: 1 }, // Légendaire : cosmétique exclusif
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
    // Rappel: 1 gemme = 100 points, les récompenses doivent être modestes pour les quêtes journalières
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
          { type: 'points' as const, amount: 30 }, // Modeste : 30 points
          { type: 'chest' as const, chestType: 'common' as const } // Coffre commun (récompenses modestes)
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
          { type: 'points' as const, amount: 50 } // Modeste : 50 points (pas de gemme pour une quête journalière)
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
          { type: 'points' as const, amount: 20 } // Modeste : 20 points seulement (pas de coffre)
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
          { type: 'points' as const, amount: 40 }, // 40 points
          { type: 'chest' as const, chestType: 'common' as const } // Coffre commun
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
          { type: 'points' as const, amount: 30 } // 30 points
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
          { type: 'points' as const, amount: 25 } // 25 points
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
          { type: 'points' as const, amount: 40 }, // 40 points
          { type: 'chest' as const, chestType: 'common' as const } // Coffre commun
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
          { type: 'points' as const, amount: 60 }, // 60 points
          { type: 'chest' as const, chestType: 'common' as const } // Coffre commun
        ],
        isActive: true
      }
    ];

    // Créer les quêtes hebdomadaires
    // Récompenses équilibrées pour les quêtes hebdomadaires (1 gemme = 100 points)
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
          { type: 'points' as const, amount: 150 }, // 150 points
          { type: 'gems' as const, amount: 1 }, // 1 gemme (équivaut à 100 points)
          { type: 'chest' as const, chestType: 'rare' as const } // Coffre rare
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
          { type: 'points' as const, amount: 100 }, // 100 points
          { type: 'gems' as const, amount: 1 }, // 1 gemme (équivaut à 100 points)
          { type: 'chest' as const, chestType: 'epic' as const } // Coffre épique
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
          { type: 'points' as const, amount: 100 }, // 100 points
          { type: 'gems' as const, amount: 1 }, // 1 gemme (équivaut à 100 points)
          { type: 'chest' as const, chestType: 'rare' as const } // Coffre rare
        ],
        isActive: true
      }
    ];

    // Créer les quêtes mensuelles
    // Récompenses importantes mais équilibrées pour les quêtes mensuelles (1 gemme = 100 points)
    const monthlyQuests = [
      {
        slug: 'monthly_forum_master',
        name: 'Maître du Forum',
        description: 'Répondre à 50 questions ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'forum_answer' as const,
          target: 50
        },
        rewards: [
          { type: 'points' as const, amount: 300 }, // 300 points
          { type: 'gems' as const, amount: 3 }, // 3 gemmes (équivaut à 300 points)
          { type: 'chest' as const, chestType: 'epic' as const } // Coffre épique
        ],
        isActive: true
      },
      {
        slug: 'monthly_quiz_master',
        name: 'Champion des Quiz',
        description: 'Compléter 30 quiz ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'quiz_complete' as const,
          target: 30
        },
        rewards: [
          { type: 'points' as const, amount: 200 }, // 200 points
          { type: 'gems' as const, amount: 2 }, // 2 gemmes (équivaut à 200 points)
          { type: 'chest' as const, chestType: 'legendary' as const } // Coffre légendaire
        ],
        isActive: true
      },
      {
        slug: 'monthly_fiche_creator',
        name: 'Auteur Prolifique',
        description: 'Créer 20 fiches ce mois-ci',
        type: 'monthly' as const,
        condition: {
          action: 'fiche_create' as const,
          target: 20
        },
        rewards: [
          { type: 'points' as const, amount: 300 }, // 300 points
          { type: 'gems' as const, amount: 3 }, // 3 gemmes (équivaut à 300 points)
          { type: 'chest' as const, chestType: 'legendary' as const } // Coffre légendaire
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

    console.log('✅ Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedQuests();

