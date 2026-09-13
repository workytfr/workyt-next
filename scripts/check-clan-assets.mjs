/**
 * Vérifie que chaque illustration déclarée dans SOLDIER_CATALOG existe
 * réellement, AVEC LA BONNE CASSE.
 *
 *     node scripts/check-clan-assets.mjs
 *
 * Pourquoi ce script : le développement se fait sous Windows (système de
 * fichiers insensible à la casse) et la production tourne sur un VPS Linux
 * (sensible à la casse). Un `medecin.png` écrit `Medecin.png` s'affiche
 * parfaitement en local et renvoie un 404 en production.
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'public', 'clans', 'soldats');
const SRC = join(process.cwd(), 'src', 'lib', 'clanSoldiers.ts');

if (!existsSync(DIR)) {
  console.error(`✗ Dossier introuvable : ${DIR}`);
  process.exit(1);
}

const onDisk = readdirSync(DIR);
const declared = [...readFileSync(SRC, 'utf8').matchAll(/IMG\('([^']+)'\)/g)].map((m) => m[1]);

let errors = 0;

console.log(`\n${declared.length} illustration(s) déclarée(s)\n`);

for (const file of declared) {
  if (onDisk.includes(file)) {
    console.log(`  ✓ ${file}`);
    continue;
  }
  // Le fichier existe-t-il avec une casse différente ?
  const nearMiss = onDisk.find((f) => f.toLowerCase() === file.toLowerCase());
  if (nearMiss) {
    console.log(`  ✗ ${file}  →  le fichier réel s'appelle « ${nearMiss} »`);
    console.log(`      Fonctionne sous Windows, 404 sur le VPS Linux.`);
  } else {
    console.log(`  ✗ ${file}  →  INTROUVABLE`);
  }
  errors++;
}

const orphans = onDisk.filter((f) => f.endsWith('.png') && !declared.includes(f));
if (orphans.length) {
  console.log(`\n  ⚠ ${orphans.length} image(s) présente(s) mais jamais utilisée(s) :`);
  for (const o of orphans) console.log(`      ${o}`);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(errors === 0 ? 'Toutes les illustrations sont correctement liées.' : `${errors} erreur(s)`);
process.exit(errors > 0 ? 1 : 0);
