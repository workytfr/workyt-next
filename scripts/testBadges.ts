import 'dotenv/config';
import mongoose from 'mongoose';
import { BadgeService } from '../src/lib/badgeService';
import User from '../src/models/User';
import Answer from '../src/models/Answer';
import Question from '../src/models/Question';
import '../src/models/Revision';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workyt';

async function testBadgeSystem() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Récupérer un utilisateur de test
    const testUser = await User.findOne({}).limit(1);
    if (!testUser) {
      console.log('Aucun utilisateur trouvé pour le test');
      return;
    }

    console.log(`Test avec l'utilisateur: ${testUser.username} (${testUser._id})`);
    console.log(`Badges actuels: ${testUser.badges.length}`);

    // Vérifier les badges actuels
    const currentBadges = await BadgeService.checkAndAwardBadges(testUser._id.toString());
    console.log(`Badges attribués: ${currentBadges.length}`);

    if (currentBadges.length > 0) {
      console.log('Nouveaux badges attribués:', currentBadges);
    }

    // Simuler quelques actions pour déclencher des badges
    console.log('\n--- Simulation d\'actions utilisateur ---');

    // 1. Vérifier les réponses sur le forum
    const answerCount = await Answer.countDocuments({ user: testUser._id });
    console.log(`Nombre de réponses sur le forum: ${answerCount}`);

    // 2. Vérifier les réponses validées
    const validatedAnswerCount = await Answer.countDocuments({ 
      user: testUser._id, 
      status: { $in: ['Validée', 'Meilleure Réponse'] }
    });
    console.log(`Nombre de réponses validées: ${validatedAnswerCount}`);

    // 3. Vérifier l'ancienneté
    const now = new Date();
    const yearsDiff = (now.getTime() - testUser.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
    console.log(`Ancienneté: ${yearsDiff.toFixed(2)} années`);

    // 4. Vérifier les fiches créées
    const Revision = mongoose.model('Revision');
    const ficheCount = await Revision.countDocuments({ author: testUser._id });
    console.log(`Nombre de fiches créées: ${ficheCount}`);

    // Déclencher une vérification complète
    console.log('\n--- Déclenchement de la vérification des badges ---');
    await BadgeService.triggerBadgeCheck(testUser._id.toString());

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await User.findById(testUser._id);
    console.log(`Badges après vérification: ${updatedUser?.badges.length}`);

    console.log('Test terminé avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('Erreur lors du test:', error);
    process.exit(1);
  }
}

testBadgeSystem(); 