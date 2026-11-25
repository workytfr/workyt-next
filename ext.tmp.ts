import fs from 'node:fs';
for (const l of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^(OPENROUTER_API_KEY)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
(async () => {
  const { extractCurriculumFromPdf } = await import('./src/lib/curriculumExtract');
  const t = Date.now();
  const r = await extractCurriculumFromPdf({ pdf: fs.readFileSync(process.argv[2]), filename: 'reperes-c4.pdf', level: process.argv[3], subject: 'mathematiques' });
  console.log('durée', Math.round((Date.now() - t) / 1000), 's');
  fs.writeFileSync(process.argv[4], JSON.stringify(r, null, 2));
  console.log(r.sourceReference, '\nwarnings:', r.warnings);
  for (const th of r.themes) { console.log('#', th.name); for (const c of th.chapters) console.log('  -', c.name, `(${c.skills.length})`, '|', c.skills.map(s => s.description).join(' ; ').slice(0, 260)); }
})().catch(e => { console.error(e); process.exit(1); });
