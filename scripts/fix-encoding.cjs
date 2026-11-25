// Répare le double-encodage UTF-8 (mojibake) dans un fichier
const fs = require('fs');
const path = process.argv[2];
let text = fs.readFileSync(path, 'utf8');
const fixes = [
  ['â€”', '—'], ['â€“', '–'], ['â€™', '’'], ['â€˜', '‘'],
  ['â€œ', '“'], ['â€', '”'], ['â€¦', '…'],
  ['Ã©', 'é'], ['Ã¨', 'è'], ['Ãª', 'ê'], ['Ã«', 'ë'],
  ['Ã ', 'à'], ['Ã¢', 'â'], ['Ã§', 'ç'], ['Ã¹', 'ù'], ['Ã»', 'û'],
  ['Ã´', 'ô'], ['Ã¶', 'ö'], ['Ã®', 'î'], ['Ã¯', 'ï'],
  ['Ã‡', 'Ç'], ['Ã‰', 'É'], ['Ãˆ', 'È'], ['Ã€', 'À'],
  ['Å“', 'œ'], ['Å’', 'Œ']
];
let count = 0;
for (const [bad, good] of fixes) {
  const occurrences = text.split(bad).length - 1;
  if (occurrences > 0) {
    count += occurrences;
    text = text.split(bad).join(good);
  }
}
fs.writeFileSync(path, text, 'utf8');
console.log(`${count} séquences réparées dans ${path}`);
