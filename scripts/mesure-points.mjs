/**
 * Mesure du rythme réel de points sur Workyt — LECTURE SEULE.
 *
 * Sert à calibrer la Guerre des Clans : les PV de forteresse (35 par membre et
 * par porte) n'ont de sens que confrontés à ce que les joueurs produisent
 * vraiment. Aucune écriture, aucune modification.
 */

import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!uri) throw new Error('MONGODB_URI introuvable');

await mongoose.connect(uri);
const db = mongoose.connection.db;
const tx = db.collection('pointtransactions');

const JOURS = 30;
const since = new Date(Date.now() - JOURS * 86400000);

const fmt = (n) => (Math.round(n * 10) / 10).toString().padStart(7);
const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((s.length * p) / 100))];
};

/* --------------------------------------------- volume global */

const total = await tx.countDocuments({ type: 'gain', createdAt: { $gte: since } });
console.log(`\n${'═'.repeat(62)}`);
console.log(`RYTHME DE POINTS — ${JOURS} derniers jours`);
console.log('═'.repeat(62));
console.log(`\nTransactions de gain : ${total}`);
if (total === 0) {
  console.log('\nAucune donnée sur la période. Rien à calibrer.');
  await mongoose.disconnect();
  process.exit(0);
}

/* ------------------------------- points par joueur et par jour */

const parJoueurJour = await tx
  .aggregate([
    { $match: { type: 'gain', createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          user: '$user',
          jour: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        points: { $sum: '$points' }
      }
    }
  ])
  .toArray();

const valeurs = parJoueurJour.map((r) => r.points);
const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;

console.log(`\n── Points d'un joueur sur une journée où il joue ──`);
console.log(`  couples joueur×jour : ${valeurs.length}`);
console.log(`  moyenne  ${fmt(moyenne)}`);
console.log(`  médiane  ${fmt(pct(valeurs, 50))}`);
console.log(`  p75      ${fmt(pct(valeurs, 75))}`);
console.log(`  p90      ${fmt(pct(valeurs, 90))}`);
console.log(`  p99      ${fmt(pct(valeurs, 99))}`);
console.log(`  max      ${fmt(Math.max(...valeurs))}`);

/* --------------------------------------- joueurs actifs / jour */

const parJour = {};
for (const r of parJoueurJour) {
  parJour[r._id.jour] ??= { joueurs: 0, points: 0 };
  parJour[r._id.jour].joueurs++;
  parJour[r._id.jour].points += r.points;
}
const jours = Object.keys(parJour).sort();
const joueursParJour = jours.map((j) => parJour[j].joueurs);
const pointsParJour = jours.map((j) => parJour[j].points);

console.log(`\n── Activité quotidienne ──`);
console.log(`  joueurs actifs / jour : médiane ${pct(joueursParJour, 50)}, max ${Math.max(...joueursParJour)}`);
console.log(`  points totaux / jour  : médiane ${pct(pointsParJour, 50)}, max ${Math.max(...pointsParJour)}`);

console.log(`\n  7 derniers jours :`);
for (const j of jours.slice(-7)) {
  const d = parJour[j];
  console.log(`    ${j}  ${String(d.joueurs).padStart(4)} joueurs  ${String(d.points).padStart(6)} pts  (${fmt(d.points / d.joueurs)} /joueur)`);
}

/* --------------------------- population enrôlable (règle du jeu) */

const sept = new Date(Date.now() - 7 * 86400000);
const actifs7 = await tx
  .aggregate([
    { $match: { type: 'gain', createdAt: { $gte: sept } } },
    { $group: { _id: '$user', points: { $sum: '$points' } } },
    { $match: { points: { $gt: 0 } } }
  ])
  .toArray();

const pts7 = actifs7.map((r) => r.points);
console.log(`\n── Population enrôlable (≥ 1 point sur 7 jours) ──`);
console.log(`  joueurs : ${actifs7.length}`);
if (actifs7.length) {
  console.log(`  points sur la semaine : médiane ${pct(pts7, 50)}, moyenne ${fmt(pts7.reduce((a, b) => a + b, 0) / pts7.length)}, p90 ${pct(pts7, 90)}`);
}

/* ------------------------------------------ d'où viennent-ils */

const parAction = await tx
  .aggregate([
    { $match: { type: 'gain', createdAt: { $gte: since } } },
    { $group: { _id: '$action', points: { $sum: '$points' }, n: { $sum: 1 } } },
    { $sort: { points: -1 } }
  ])
  .toArray();

console.log(`\n── Sources des points ──`);
const somme = parAction.reduce((a, r) => a + r.points, 0);
for (const r of parAction) {
  const part = ((r.points / somme) * 100).toFixed(1).padStart(5);
  console.log(`  ${String(r._id).padEnd(20)} ${String(r.points).padStart(7)} pts  ${part} %  (${r.n} fois)`);
}

/* ---------------------------------- simulation Guerre des Clans */

const n = actifs7.length;
console.log(`\n${'═'.repeat(62)}`);
console.log('SIMULATION — ce que ça donne en guerre');
console.log('═'.repeat(62));

if (n < 4) {
  console.log(`\n  ${n} actifs : trêve, aucun clan ne se forme (minimum 4).`);
} else {
  const TAILLE_CIBLE = 15;
  const nbClans = Math.max(2, 2 * Math.ceil(n / (2 * TAILLE_CIBLE)));
  const taille = Math.floor(n / nbClans);
  const pvPorte = Math.max(70, 35 * taille);
  const mur = pvPorte * 3 + pvPorte * 2;

  // Un membre ne joue pas tous les jours : part des inscrits actifs un jour donné
  const tauxPresence = pct(joueursParJour, 50) / n;
  const presents = Math.max(1, Math.round(taille * tauxPresence));
  const medJour = pct(valeurs, 50);

  console.log(`\n  ${n} actifs → ${nbClans} clans de ${taille} joueurs`);
  console.log(`  PV : ${pvPorte} par porte, ${pvPorte * 2} au donjon, ${mur} de forteresse`);
  console.log(`  présence : ${(tauxPresence * 100).toFixed(0)} % → ~${presents} membres actifs par jour et par clan`);

  // Hypothèse : 60 % attaquent, multiplicateur moyen 1,2, ordre suivi
  const attaquants = Math.max(1, Math.round(presents * 0.6));
  const defenseurs = Math.max(1, Math.round(presents * 0.3));
  const assautBrut = attaquants * medJour * 1.2 * 1.2;
  const defenseBrute = defenseurs * medJour * 1.2 * 1.2;
  const degatsNets = Math.max(0, assautBrut - defenseBrute);

  console.log(`\n  Sur une journée, sans garnison achetée :`);
  console.log(`    assaut  ~${Math.round(assautBrut)} (${attaquants} attaquants × ${medJour} pts médians)`);
  console.log(`    défense ~${Math.round(defenseBrute)} (${defenseurs} défenseurs)`);
  console.log(`    dégâts nets sur une porte : ~${Math.round(degatsNets)}`);

  if (degatsNets <= 0) {
    console.log(`\n  ⚠️  La défense absorbe tout : 0 dégât, ratio 0 contre 0.`);
    console.log(`      Les sept journées se soldent par des nuls, et la semaine`);
    console.log(`      se départage au rang. La guerre ne bouge jamais.`);
  } else {
    const joursPorte = pvPorte / degatsNets;
    const joursMur = mur / degatsNets;
    console.log(`\n    une porte tombe en ${joursPorte.toFixed(1)} jour(s)`);
    console.log(`    la forteresse entière en ${joursMur.toFixed(1)} jour(s)`);
    if (joursPorte > 7) console.log(`\n  ⚠️  Aucune porte ne tombe en une semaine : murs trop épais.`);
    else if (joursMur < 3) console.log(`\n  ⚠️  Forteresse rasée en moins de 3 jours : murs trop fins.`);
    else console.log(`\n  ✓ Rythme jouable : la semaine a un enjeu jusqu'au bout.`);
  }
}

console.log('');
await mongoose.disconnect();
