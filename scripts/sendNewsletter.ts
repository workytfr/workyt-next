import * as dotenv from 'dotenv';
dotenv.config();

import connectDB from '../src/lib/mongodb';
import { sendNewsletterBatch } from '../src/lib/newsletter/sendBatch';

/**
 * Script cron pour envoyer la newsletter hebdomadaire par batch.
 *
 * Usage : npm run newsletter
 * Cron Linux : 0 8 * * 1-5 cd /path/to/workyt-next && npm run newsletter
 *
 * Le script est idempotent : il peut etre relance sans envoyer de doublons.
 * Il envoie max 450 emails par execution (marge pour les emails transactionnels).
 */
async function main() {
    try {
        console.log(`[${new Date().toISOString()}] Demarrage du batch newsletter...`);
        await connectDB();

        const result = await sendNewsletterBatch(450);

        console.log(`[${new Date().toISOString()}] Resultat:`, {
            envoyes: result.sent,
            ignores: result.skipped,
            erreurs: result.errors,
            termine: result.completed,
        });

        process.exit(0);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erreur newsletter:`, error);
        process.exit(1);
    }
}

main();
