import mongoose from 'mongoose';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
await mongoose.connect(uri);
const db = mongoose.connection.db;

/**
 * Rejoue la règle EXACTE du jeu (getActivePlayers : >= 1 point sur 7 jours)
 * semaine par semaine, dans deux mondes :
 *   AVANT  = seules les transactions de points existantes
 *   APRÈS  = idem + les contributions de bénévoles, désormais rémunérées
 */
const SEMAINES = 20;
const now = Date.now();

const evenements = [];
for (const t of await db.collection('pointtransactions')
  .find({ type: 'gain' }).project({ user: 1, createdAt: 1 }).toArray()) {
  evenements.push({ qui: String(t.user), quand: +t.createdAt, source: 'points' });
}
const contribs = [
  ['courses', 'authors'], ['lessons', 'author'], ['exercises', 'author']
];
for (const [coll, champ] of contribs) {
  for (const d of await db.collection(coll).find({}).project({ [champ]: 1, createdAt: 1 }).toArray()) {
    const v = d[champ];
    if (!v || !d.createdAt) continue;
    for (const a of Array.isArray(v) ? v : [v]) {
      if (a) evenements.push({ qui: String(a), quand: +d.createdAt, source: 'benevole' });
    }
  }
}

console.log('\nsemaine finissant   AVANT   APRÈS   (actifs sur 7 jours glissants)');
console.log('─'.repeat(62));
let sommeAvant = 0, sommeApres = 0, guerresAvant = 0, guerresApres = 0;
for (let s = SEMAINES - 1; s >= 0; s--) {
  const fin = now - s * 7 * 86400000;
  const debut = fin - 7 * 86400000;
  const dans = evenements.filter(e => e.quand >= debut && e.quand < fin);
  const avant = new Set(dans.filter(e => e.source === 'points').map(e => e.qui));
  const apres = new Set(dans.map(e => e.qui));
  sommeAvant += avant.size; sommeApres += apres.size;
  if (avant.size >= 4) guerresAvant++;
  if (apres.size >= 4) guerresApres++;
  const d = new Date(fin).toISOString().slice(0, 10);
  const flag = apres.size >= 4 ? '' : '   ← trêve';
  console.log(`  ${d}        ${String(avant.size).padStart(3)}     ${String(apres.size).padStart(3)}${flag}`);
}

console.log('─'.repeat(62));
console.log(`  moyenne              ${(sommeAvant / SEMAINES).toFixed(1)}     ${(sommeApres / SEMAINES).toFixed(1)}`);
console.log(`  semaines jouables    ${guerresAvant}/${SEMAINES}   ${guerresApres}/${SEMAINES}  (seuil : 4 actifs)`);

const moyApres = sommeApres / SEMAINES;
console.log('\n══ VERDICT ══\n');
if (moyApres < 4) console.log(`  ${moyApres.toFixed(1)} actifs en moyenne : sous le seuil, trêve la plupart des semaines.`);
else {
  const taille = Math.floor(moyApres / 2);
  console.log(`  ${moyApres.toFixed(1)} actifs → 2 clans de ${taille}`);
  console.log(`  PV par porte : ${Math.max(70, 35 * taille)}`);
  if (taille < 3) console.log(`  ⚠️  Clans de ${taille} : c'est un duel, pas une guerre de clans.`);
}
await mongoose.disconnect();
