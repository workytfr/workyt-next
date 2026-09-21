import * as dotenv from 'dotenv';
import Role from '../src/models/Role';
import Quest from '../src/models/Quest';
import connectDB from '../src/lib/mongodb';

dotenv.config();

/**
 * Mise en service du suivi personnalisé — à lancer UNE fois après le
 * déploiement : `npm run seedMentorship`.
 *
 * 1. Donne les nouvelles permissions aux rôles déjà en base. Le seed des rôles
 *    (instrumentation.ts) n'insère que les rôles ABSENTS : un Helpeur existant
 *    ne recevrait jamais `mentorship.take` sans ce script.
 *    `$addToSet` : relancer le script ne crée pas de doublon.
 * 2. Crée les quêtes hebdomadaires du suivi, réservées aux élèves suivis
 *    (`audience: 'mentored'`, voir QuestService.initializeQuestsForUser).
 *
 * Les badges du suivi n'ont pas besoin de script : ils sont synchronisés
 * depuis src/data/badges.ts par /api/badges.
 */
async function seedMentorship() {
  try {
    await connectDB();
    console.log('Connexion à la base de données réussie');

    const grants: Record<string, string[]> = {
      Helpeur: ['mentorship.take'],
      'Modérateur': ['mentorship.take', 'mentorship.manage'],
    };
    for (const [name, permissions] of Object.entries(grants)) {
      const res = await Role.updateOne({ name }, { $addToSet: { permissions: { $each: permissions } } });
      console.log(`Rôle ${name} : ${res.matchedCount ? `permissions ${permissions.join(', ')} ajoutées` : 'introuvable (ignoré)'}`);
    }

    const quests = [
      {
        slug: 'weekly_mentorship_resources',
        name: 'Élève assidu',
        description: 'Terminer 2 ressources données par ton bénévole cette semaine',
        type: 'weekly' as const,
        audience: 'mentored' as const,
        condition: { action: 'mentorship_resource_done' as const, target: 2 },
        rewards: [{ type: 'chest' as const, chestType: 'rare' as const }],
        isActive: true,
      },
      {
        slug: 'weekly_mentorship_goal',
        name: 'Cap sur l’objectif',
        description: 'Atteindre un objectif de ton plan de suivi cette semaine',
        type: 'weekly' as const,
        audience: 'mentored' as const,
        condition: { action: 'mentorship_goal_reached' as const, target: 1 },
        rewards: [{ type: 'points' as const, amount: 40 }],
        isActive: true,
      },
    ];
    for (const questData of quests) {
      await Quest.findOneAndUpdate({ slug: questData.slug }, questData, { upsert: true });
      console.log(`Quête « ${questData.name} » créée ou mise à jour`);
    }

    console.log('Suivi personnalisé prêt.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise en service du suivi :', error);
    process.exit(1);
  }
}

seedMentorship();
