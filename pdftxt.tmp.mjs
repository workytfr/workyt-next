import fs from 'node:fs';
const { PDFParse } = await import('pdf-parse');
const p = new PDFParse(new Uint8Array(fs.readFileSync(process.argv[2])));
await p.load();
const r = await p.getText();
console.log('pages', r.total, 'chars', r.text.length);
console.log(r.text.slice(0, 2500));
