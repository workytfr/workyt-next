import mongoose from 'mongoose';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
await mongoose.connect(uri);
const db = mongoose.connection.db;

const POINTS = { cours: 20, verif: 13, quiz: 5, exos: 6 };

async function parMois(nom, coll, champ = 'createdAt', match = {}) {
  const c = db.collection(coll);
  const total = await c.countDocuments(match).catch(() => 0);
  const rows = await c.aggregate([
    { $match: { ...match, [champ]: { $type: 'date' } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$' + champ } }, n: { $sum: 1 } } },
    { $sort: { _id: -1 } }, { $limit: 12 }
  ]).toArray().catch(() => []);
  const douze = rows.reduce((a, r) => a + r.n, 0);
  console.log(`${nom.padEnd(22)} total ${String(total).padStart(5)}   sur 12 mois ${String(douze).padStart(5)}   ~${(douze / 12).toFixed(1)}/mois`);
  return { total, douze, rows };
}

console.log('\n══ CONTRIBUTIONS DE BÉNÉVOLES ══\n');
const cours = await parMois('Cours publiés', 'courses', 'createdAt', { status: 'publie' });
const coursTous = await parMois('Cours (tous statuts)', 'courses');
const quiz = await parMois('Quiz', 'quizzes');
const exos = await parMois('Exercices', 'exercises');
const lecons = await parMois('Leçons', 'lessons');

// statuts réellement présents
const statuts = await db.collection('courses').aggregate([
  { $group: { _id: '$status', n: { $sum: 1 } } }
]).toArray();
console.log('\nstatuts de cours :', statuts.map(s => `${s._id}=${s.n}`).join('  '));

// auteurs distincts
const auteurs = await db.collection('courses').distinct('authors').catch(() => []);
console.log('auteurs de cours distincts :', auteurs.length);

console.log('\n══ CE QUE ÇA AURAIT RAPPORTÉ (12 derniers mois) ══\n');
const ptsCours = coursTous.douze * POINTS.cours;
const ptsVerif = coursTous.douze * POINTS.verif;
const ptsQuiz = quiz.douze * POINTS.quiz;
const ptsExos = exos.douze * POINTS.exos;
const totalNouveau = ptsCours + ptsVerif + ptsQuiz + ptsExos;

console.log(`cours × ${POINTS.cours}      ${String(ptsCours).padStart(6)} pts`);
console.log(`vérif × ${POINTS.verif}      ${String(ptsVerif).padStart(6)} pts`);
console.log(`quiz  × ${POINTS.quiz}       ${String(ptsQuiz).padStart(6)} pts`);
console.log(`exos  × ${POINTS.exos}       ${String(ptsExos).padStart(6)} pts`);
console.log(`${'-'.repeat(34)}\nnouveau flux annuel  ${String(totalNouveau).padStart(6)} pts  (~${Math.round(totalNouveau / 12)}/mois)`);

const ancien = await db.collection('pointtransactions').aggregate([
  { $match: { type: 'gain', createdAt: { $gte: new Date(Date.now() - 365 * 86400000) } } },
  { $group: { _id: null, p: { $sum: '$points' } } }
]).toArray();
const a = ancien[0]?.p ?? 0;
console.log(`flux actuel annuel   ${String(a).padStart(6)} pts  (~${Math.round(a / 12)}/mois)`);
console.log(`\n→ multiplicateur : ×${((a + totalNouveau) / Math.max(1, a)).toFixed(1)}`);

await mongoose.disconnect();
