import mongoose from 'mongoose';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
await mongoose.connect(uri);
const db = mongoose.connection.db;

// Quels champs d'auteur existent ?
for (const c of ['courses', 'lessons', 'quizzes', 'exercises']) {
  const doc = await db.collection(c).findOne({});
  if (!doc) { console.log(`${c}: vide`); continue; }
  const champs = Object.keys(doc).filter(k => /auth|user|creat|by|prof/i.test(k));
  console.log(`${c.padEnd(11)} champs d'auteur : ${champs.join(', ') || '(aucun)'}`);
}

/** Contributeurs distincts par mois, tous types confondus */
async function contribs(coll, champ) {
  return db.collection(coll).aggregate([
    { $match: { createdAt: { $type: 'date' }, [champ]: { $ne: null } } },
    { $project: {
        mois: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        auteur: Array.isArray(`$${champ}`) ? `$${champ}` : `$${champ}` } },
    { $unwind: { path: '$auteur', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$mois', gens: { $addToSet: '$auteur' } } }
  ]).toArray().catch(() => []);
}

const sources = [
  ['courses', 'authors'],
  ['lessons', 'author'],
  ['quizzes', 'author'],
  ['exercises', 'author']
];

const parMois = {};
for (const [coll, champ] of sources) {
  for (const r of await contribs(coll, champ)) {
    parMois[r._id] ??= new Set();
    for (const g of r.gens) if (g) parMois[r._id].add(String(g));
  }
}

console.log('\n══ CONTRIBUTEURS DISTINCTS PAR MOIS (cours, leçons, quiz, exos) ══\n');
const mois = Object.keys(parMois).sort().slice(-14);
for (const m of mois) console.log(`  ${m}   ${parMois[m].size} contributeur(s)`);

const recents = mois.slice(-6).map(m => parMois[m].size);
const moyenne = recents.reduce((a, b) => a + b, 0) / Math.max(1, recents.length);
console.log(`\n  moyenne 6 derniers mois : ${moyenne.toFixed(1)} contributeurs/mois`);

// Croisement : ces gens marquaient-ils déjà des points ?
const tousContribs = new Set();
for (const m of mois.slice(-2)) for (const g of parMois[m] ?? []) tousContribs.add(g);
const dejaActifs = await db.collection('pointtransactions').distinct('user', {
  type: 'gain', createdAt: { $gte: new Date(Date.now() - 60 * 86400000) }
});
const dejaSet = new Set(dejaActifs.map(String));
const nouveaux = [...tousContribs].filter(g => !dejaSet.has(g));

console.log(`\n══ APPORT RÉEL DU NOUVEAU SERVICE ══\n`);
console.log(`  contributeurs sur 2 mois         : ${tousContribs.size}`);
console.log(`  dont déjà marqueurs de points    : ${tousContribs.size - nouveaux.length}`);
console.log(`  NOUVEAUX actifs grâce aux points : ${nouveaux.length}`);
console.log(`\n  population enrôlable : ${dejaSet.size} → ${dejaSet.size + nouveaux.length}`);

await mongoose.disconnect();
