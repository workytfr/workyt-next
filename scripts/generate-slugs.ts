/**
 * Script de migration pour générer les slugs SEO sur les documents existants.
 *
 * Usage: npx tsx --env-file=.env scripts/generate-slugs.ts
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Charger le .env depuis la racine du projet
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Fonction slugify inline (pour éviter les problèmes d'import avec les alias @/)
function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
    console.error('MONGODB_URI non defini. Verifiez votre fichier .env');
    process.exit(1);
}

async function generateSlugs() {
    console.log('Connexion a MongoDB...');
    console.log('URI:', MONGODB_URI!.replace(/\/\/.*@/, '//***:***@'));

    await mongoose.connect(MONGODB_URI!, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });
    console.log('Connecte a MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
        console.error('Impossible d\'acceder a la base de donnees');
        process.exit(1);
    }

    // Questions
    const questions = db.collection('questions');
    const questionsWithoutSlug = await questions.find({ $or: [{ slug: { $exists: false } }, { slug: null }] }).toArray();
    console.log(`\n${questionsWithoutSlug.length} questions sans slug...`);
    let qCount = 0;
    for (const q of questionsWithoutSlug) {
        if (q.title) {
            await questions.updateOne({ _id: q._id }, { $set: { slug: slugify(q.title as string) } });
            qCount++;
        }
    }
    console.log(`${qCount} slugs de questions generes`);

    // Fiches
    const revisions = db.collection('revisions');
    const revisionsWithoutSlug = await revisions.find({ $or: [{ slug: { $exists: false } }, { slug: null }] }).toArray();
    console.log(`\n${revisionsWithoutSlug.length} fiches sans slug...`);
    let fCount = 0;
    for (const f of revisionsWithoutSlug) {
        if (f.title) {
            await revisions.updateOne({ _id: f._id }, { $set: { slug: slugify(f.title as string) } });
            fCount++;
        }
    }
    console.log(`${fCount} slugs de fiches generes`);

    // Cours
    const courses = db.collection('courses');
    const coursesWithoutSlug = await courses.find({ $or: [{ slug: { $exists: false } }, { slug: null }] }).toArray();
    console.log(`\n${coursesWithoutSlug.length} cours sans slug...`);
    let cCount = 0;
    for (const c of coursesWithoutSlug) {
        if (c.title) {
            await courses.updateOne({ _id: c._id }, { $set: { slug: slugify(c.title as string) } });
            cCount++;
        }
    }
    console.log(`${cCount} slugs de cours generes`);

    console.log(`\nMigration terminee ! Total: ${qCount + fCount + cCount} slugs generes`);

    await mongoose.disconnect();
    process.exit(0);
}

generateSlugs().catch((error) => {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
});
