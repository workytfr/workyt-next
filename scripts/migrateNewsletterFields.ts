import * as dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import connectDB from '../src/lib/mongodb';
import User from '../src/models/User';

/**
 * Script de migration one-shot : ajoute unsubscribeToken a tous les
 * utilisateurs existants.
 *
 * ⚠️ Ce script posait aussi `newsletterOptIn: true` sur tout le monde. C'est
 * RETIRE : abonner d'office est precisement ce que le consentement interdit
 * (RGPD art. 4-11, considerant 32). Le rejouer aurait reabonne toute la base
 * et annule la campagne de reconsentement. Ne jamais le remettre.
 */
async function migrateNewsletterFields() {
    try {
        await connectDB();
        console.log('Connexion a la base de donnees reussie');

        // Trouver les users sans unsubscribeToken
        const users = await User.find({ unsubscribeToken: { $exists: false } }).select('_id');
        console.log(`${users.length} utilisateurs a migrer (unsubscribeToken)`);

        let migrated = 0;
        for (const user of users) {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        unsubscribeToken: crypto.randomUUID(),
                    }
                }
            );
            migrated++;
        }

        // Aussi mettre a jour ceux qui ont le champ mais sans token
        const usersWithoutToken = await User.find({
            unsubscribeToken: { $exists: true, $eq: null }
        }).select('_id');

        for (const user of usersWithoutToken) {
            await User.updateOne(
                { _id: user._id },
                { $set: { unsubscribeToken: crypto.randomUUID() } }
            );
            migrated++;
        }

        // Migrer les preferences newsletter (nouveau champ)
        const usersWithoutPrefs = await User.find({
            newsletterPreferences: { $exists: false }
        }).select('_id newsletterOptIn');
        console.log(`${usersWithoutPrefs.length} utilisateurs a migrer (newsletterPreferences)`);

        for (const user of usersWithoutPrefs) {
            const optIn = user.newsletterOptIn ?? true;
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        newsletterPreferences: {
                            hebdo: optIn,
                            classique: optIn,
                        }
                    }
                }
            );
            migrated++;
        }

        console.log(`Migration terminee : ${migrated} utilisateurs mis a jour`);
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
        process.exit(1);
    }
}

migrateNewsletterFields();
