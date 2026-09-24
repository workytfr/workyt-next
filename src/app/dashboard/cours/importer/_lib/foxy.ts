/**
 * Foxy le Réorganisateur — import de cours SANS IA.
 *
 * Tout se passe dans le navigateur : le fichier n'est envoyé nulle part avant
 * que le rédacteur valide le brouillon.
 *
 * - Word (.docx) : mammoth lit les styles « Titre 1 », « Titre 2 »… posés dans
 *   Word ou Google Docs. C'est une information exacte, rien n'est deviné.
 * - PDF : le PDF ne garde pas les styles, seulement du texte placé sur la page.
 *   Foxy essaie, dans l'ordre : 1) le sommaire intégré (signets), 2) la taille
 *   des caractères, 3) les repères écrits (« Chapitre 1 », « I. », « A. »).
 *
 * Les deux chemins produisent du HTML simple (h1/h2/h3, p, listes, tableaux),
 * puis `htmlToDraft` le découpe en sections et leçons et reconnaît les blocs
 * pédagogiques (« Définition : … » → bloc Définition).
 */

export interface FoxyLesson {
  title: string;
  content: string;
  order: number;
}

export interface FoxySection {
  title: string;
  order: number;
  lessons: FoxyLesson[];
}

export type FoxyMethod = "styles-word" | "sommaire-pdf" | "tailles-pdf" | "reperes-pdf" | "aucune";

export interface FoxyResult {
  sections: FoxySection[];
  /** Titre trouvé dans le document (style « Titre » de Word, gros titre de 1re page) */
  suggestedTitle?: string;
  report: {
    method: FoxyMethod;
    pages?: number;
    blocks: number;
    images: number;
    /** Avertissements affichés au rédacteur (ex : PDF scanné) */
    warnings: string[];
  };
}

/* ------------------------------------------------------------------ */
/* Blocs pédagogiques                                                  */
/* ------------------------------------------------------------------ */

// « Définition : », « Propriété 2 – », « THÉORÈME (Pythagore). » …
const BLOCK_PATTERN =
  /^\s*(d[ée]finitions?|propri[ée]t[ée]s?|th[ée]or[èe]mes?|exemples?|remarques?|attention)\b\s*(\d+)?\s*(\([^)]{0,80}\))?\s*[:.\-–—]?\s*/i;

function blockTypeOf(keyword: string): string {
  const k = keyword.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (k.startsWith("defin")) return "definition";
  if (k.startsWith("propri")) return "propriete";
  if (k.startsWith("theor")) return "theoreme";
  if (k.startsWith("exemple")) return "exemple";
  if (k.startsWith("remarque")) return "remarque";
  return "attention";
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ */
/* HTML → sections / leçons                                            */
/* ------------------------------------------------------------------ */

const HEADING = /^H([1-6])$/;

/**
 * Le site numérote déjà sections et leçons : « Chapitre 1 : Découvrir la notion »
 * devient « Découvrir la notion », « A. Vocabulaire » devient « Vocabulaire ».
 * Si le titre n'est QUE le numéro (« Chapitre 1 »), on le garde tel quel.
 */
function cleanTitle(title: string): string {
  const stripped = title
    .replace(/^(chapitre|partie|th[èe]me|module|le[çc]on|section)\s+([0-9]+|[ivxlc]+|[a-z])\b\s*[:.\-–—]?\s*/i, "")
    .replace(/^([IVX]{1,5}|[0-9]{1,2}|[A-H])\s*[.)\-–—]\s+/, "")
    .trim();
  return stripped || title;
}

/**
 * Découpe un HTML « à plat » en sections et leçons.
 * Le niveau de titre le plus haut présent devient la section, le suivant la
 * leçon ; les niveaux plus profonds restent des titres DANS la leçon.
 */
export function htmlToDraft(html: string): { sections: FoxySection[]; blocks: number; suggestedTitle?: string } {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const nodes = Array.from(doc.body.children) as HTMLElement[];

  // Titre du document (style « Titre » de Word) : proposé comme titre du cours
  let suggestedTitle: string | undefined;
  const titleNode = nodes.find((n) => n.classList.contains("foxy-doc-title"));
  if (titleNode) suggestedTitle = titleNode.textContent?.trim() || undefined;

  const levels = [...new Set(
    nodes
      .filter((n) => !n.classList.contains("foxy-doc-title"))
      .map((n) => HEADING.exec(n.tagName)?.[1])
      .filter(Boolean)
      .map(Number)
  )].sort((a, b) => a - b);

  const sectionLevel = levels[0];
  const lessonLevel = levels[1];

  const sections: FoxySection[] = [];
  let section: FoxySection | null = null;
  let lesson: { title: string; parts: string[] } | null = null;
  let blocks = 0;

  const flushLesson = () => {
    if (!lesson) return;
    if (!section) {
      section = { title: "Introduction", order: sections.length + 1, lessons: [] };
      sections.push(section);
    }
    const content = lesson.parts.join("").trim();
    // Une leçon vide (titre suivi directement d'un autre titre) n'apporte rien
    if (content) section.lessons.push({ title: lesson.title, content, order: section.lessons.length + 1 });
    lesson = null;
  };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.classList.contains("foxy-doc-title")) continue;
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    const level = Number(HEADING.exec(node.tagName)?.[1] || 0);

    if (level && level === sectionLevel) {
      flushLesson();
      section = { title: cleanTitle(text) || `Section ${sections.length + 1}`, order: sections.length + 1, lessons: [] };
      sections.push(section);
      // Sans niveau « leçon » dans le document : une leçon par section
      if (!lessonLevel) lesson = { title: section.title, parts: [] };
      continue;
    }
    if (level && level === lessonLevel) {
      flushLesson();
      lesson = { title: cleanTitle(text) || "Leçon", parts: [] };
      continue;
    }

    // Contenu : avant tout titre, il ouvre une leçon « Introduction »
    if (!lesson) lesson = { title: "Introduction", parts: [] };

    if (level) {
      // Titre plus profond : il reste dans la leçon (h2 puis h3, comme sur le site)
      const tag = level - (lessonLevel ?? sectionLevel) <= 1 ? "h2" : "h3";
      lesson.parts.push(`<${tag}>${escapeHtml(text)}</${tag}>`);
      continue;
    }

    // Bloc pédagogique : « Définition : … » (+ la liste ou le tableau qui suit)
    const match = node.tagName === "P" ? BLOCK_PATTERN.exec(text) : null;
    if (match) {
      const type = blockTypeOf(match[1]);
      const inner = node.innerHTML;
      // On retire le mot-clé du début du paragraphe, en gardant la mise en forme du reste
      const rest = stripLeadingKeyword(inner, match[0].length);
      const parts: string[] = [];
      if (rest.replace(/<[^>]*>/g, "").trim()) parts.push(`<p>${rest}</p>`);
      // Paragraphe réduit au mot-clé (« Définition » seul) : le contenu est juste après
      let j = i + 1;
      if (!parts.length && nodes[j] && nodes[j].tagName === "P" && !HEADING.test(nodes[j].tagName)) {
        parts.push(nodes[j].outerHTML);
        j++;
      }
      // La liste ou le tableau qui suit n'appartient au bloc que s'il est annoncé
      // (« Propriétés : » puis une liste) ; sinon c'est la suite du cours
      const announced = /:\s*$/.test((parts.length ? parts[parts.length - 1] : "").replace(/<[^>]*>/g, "").trim());
      while (announced && nodes[j] && /^(UL|OL|TABLE)$/.test(nodes[j].tagName)) {
        parts.push(nodes[j].outerHTML);
        j++;
      }
      i = j - 1;
      if (!parts.length) parts.push("<p></p>");
      lesson.parts.push(
        `<div data-custom-block="" blocktype="${type}" class="custom-block ${type}">${parts.join("")}</div>`
      );
      blocks++;
      continue;
    }

    lesson.parts.push(node.outerHTML);
  }
  flushLesson();

  // Sections sans leçon (titre seul) : on les garde, le rédacteur complètera
  return { sections, blocks, suggestedTitle };
}

/** Retire les `n` premiers caractères de TEXTE d'un fragment HTML, balises conservées. */
function stripLeadingKeyword(html: string, n: number): string {
  let removed = 0;
  let out = "";
  let i = 0;
  while (i < html.length) {
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      out += html.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    // Entité HTML = un seul caractère de texte
    let ch = html[i];
    if (ch === "&") {
      const end = html.indexOf(";", i);
      if (end > i && end - i < 10) ch = html.slice(i, end + 1);
    }
    if (removed < n) removed++;
    else out += ch;
    i += ch.length;
  }
  // Balises vides laissées par le mot-clé (<strong></strong>)
  return out.replace(/<(strong|b|em|i|u)>\s*<\/\1>/g, "").trim();
}

/* ------------------------------------------------------------------ */
/* Word (.docx)                                                        */
/* ------------------------------------------------------------------ */

export async function readDocx(file: File): Promise<FoxyResult> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value: html, messages } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        // Le style « Titre » du document = titre du cours, pas une section
        "p[style-name='Title'] => p.foxy-doc-title:fresh",
        "p[style-name='Titre'] => p.foxy-doc-title:fresh",
        "p[style-name='Subtitle'] => p:fresh",
        "p[style-name='Sous-titre'] => p:fresh",
        // Styles de titre nommés en français (documents non-Word)
        "p[style-name='Titre 1'] => h1:fresh",
        "p[style-name='Titre 2'] => h2:fresh",
        "p[style-name='Titre 3'] => h3:fresh",
        "p[style-name='Titre 4'] => h4:fresh",
      ],
    }
  );

  const { sections, blocks, suggestedTitle } = htmlToDraft(html);
  const images = (html.match(/<img\b/g) || []).length;
  const warnings: string[] = [];
  const hasHeadings = /<h[1-6]\b/.test(html);
  if (!hasHeadings) {
    warnings.push(
      "Aucun style de titre trouvé : dans Word, applique « Titre 1 » aux chapitres et « Titre 2 » aux leçons, puis réimporte."
    );
  }
  if (images > 0) {
    warnings.push(`${images} image${images > 1 ? "s" : ""} intégrée${images > 1 ? "s" : ""} au texte : vérifie leur place dans l'aperçu.`);
  }
  if (messages.some((m) => m.type === "error")) {
    warnings.push("Une partie du document n'a pas pu être lue : compare l'aperçu avec ton fichier.");
  }

  return {
    sections,
    suggestedTitle,
    report: { method: hasHeadings ? "styles-word" : "aucune", blocks, images, warnings },
  };
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

interface PdfLine {
  page: number;
  y: number; // coordonnée PDF (augmente vers le HAUT de la page)
  size: number;
  text: string;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const BULLET = /^\s*([•●▪◦■\-–—*]|\d+[.)]|[a-z][.)])\s+/;

/** Lignes de texte du PDF, avec leur taille de caractères. */
async function readPdfLines(data: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  // Même worker que le lecteur de fiches (public/pdf.worker.min.mjs)
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data }).promise;

  const lines: PdfLine[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Regroupe les morceaux de texte d'une même ligne (même hauteur à 2 pt près)
    const rows: { y: number; size: number; parts: { x: number; str: string }[] }[] = [];
    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const [, , c, d, x, y] = item.transform as number[];
      const size = Math.round(Math.hypot(c, d) * 10) / 10 || item.height || 0;
      let row = rows.find((r) => Math.abs(r.y - y) < 2);
      if (!row) {
        row = { y, size, parts: [] };
        rows.push(row);
      }
      row.size = Math.max(row.size, size);
      row.parts.push({ x, str: item.str });
    }
    rows
      .sort((a, b) => b.y - a.y)
      .forEach((r) => {
        const text = r.parts
          .sort((a, b) => a.x - b.x)
          .map((pt) => pt.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (text) lines.push({ page: p, y: r.y, size: r.size, text });
      });
  }

  let outline: { title: string; level: number }[] = [];
  try {
    const raw = await pdf.getOutline();
    const flat = (items: any[] | null, level: number) => {
      for (const it of items || []) {
        if (it.title?.trim()) outline.push({ title: it.title.trim(), level });
        flat(it.items, level + 1);
      }
    };
    flat(raw, 0);
  } catch {
    outline = [];
  }

  return { lines, outline, pages: pdf.numPages };
}

/** Retire en-têtes, pieds de page et numéros répétés sur la plupart des pages. */
function dropRepeatedLines(lines: PdfLine[], pages: number): PdfLine[] {
  if (pages < 3) return lines.filter((l) => !/^\d{1,4}$/.test(l.text));
  const key = (t: string) => norm(t).replace(/\d+/g, "#");
  const pagesByKey = new Map<string, Set<number>>();
  for (const l of lines) {
    const k = key(l.text);
    if (!pagesByKey.has(k)) pagesByKey.set(k, new Set());
    pagesByKey.get(k)!.add(l.page);
  }
  return lines.filter((l) => {
    if (/^(page\s*)?\d{1,4}(\s*(\/|sur)\s*\d{1,4})?$/i.test(l.text)) return false;
    return (pagesByKey.get(key(l.text))?.size || 0) < Math.max(3, pages * 0.5);
  });
}

/** Taille de caractères du texte courant (la plus fréquente, pondérée par la longueur). */
function bodySize(lines: PdfLine[]): number {
  const weight = new Map<number, number>();
  for (const l of lines) weight.set(l.size, (weight.get(l.size) || 0) + l.text.length);
  return [...weight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 10;
}

/** Transforme les lignes (avec un niveau de titre éventuel) en HTML simple. */
function linesToHtml(lines: PdfLine[], levelOf: (l: PdfLine, i: number) => number): string {
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let prev: PdfLine | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p>${escapeHtml(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li><p>${escapeHtml(li)}</p></li>`).join("")}</ul>`);
    list = [];
  };

  lines.forEach((l, i) => {
    const level = levelOf(l, i);
    if (level) {
      flushPara();
      flushList();
      // Titre sur deux lignes : même niveau, ligne juste en dessous → on fusionne
      const last = out[out.length - 1];
      if (prev && levelOf(prev, i - 1) === level && prev.page === l.page && last?.startsWith(`<h${level}>`)) {
        out[out.length - 1] = last.replace(`</h${level}>`, ` ${escapeHtml(l.text)}</h${level}>`);
      } else {
        out.push(`<h${level}>${escapeHtml(l.text)}</h${level}>`);
      }
      prev = l;
      return;
    }

    if (BULLET.test(l.text)) {
      flushPara();
      list.push(l.text.replace(BULLET, ""));
      prev = l;
      return;
    }

    // Nouvelle ligne de paragraphe : grand écart vertical, changement de page,
    // ou ligne précédente terminée par un point
    const gap = prev && prev.page === l.page ? prev.y - l.y : Infinity;
    const newPara = !prev || gap > l.size * 1.9 || /[.:!?]$/.test(para[para.length - 1] || "") || BLOCK_PATTERN.test(l.text);
    if (list.length && gap < l.size * 1.9 && !newPara) {
      // Suite d'un élément de liste sur la ligne suivante
      list[list.length - 1] += ` ${l.text}`;
      prev = l;
      return;
    }
    flushList();
    if (newPara) flushPara();
    para.push(l.text);
    prev = l;
  });
  flushPara();
  flushList();
  return out.join("");
}

// Repères écrits, quand le PDF n'a ni sommaire ni différence de taille
const LEVEL1 = /^(chapitre|partie|th[èe]me|module)\s+([0-9]+|[ivxlc]+|[a-z])\b|^[IVX]{1,5}\s*[.)\-–]\s+\S/i;
const LEVEL2 = /^([0-9]{1,2})\s*[.)\-–]\s+[A-ZÀ-Ý]|^[A-H]\s*[.)\-–]\s+[A-ZÀ-Ý]/;

export async function readPdf(file: File): Promise<FoxyResult> {
  const { lines: rawLines, outline, pages } = await readPdfLines(await file.arrayBuffer());
  const warnings: string[] = [];

  if (rawLines.length === 0) {
    return {
      sections: [],
      report: {
        method: "aucune",
        pages,
        blocks: 0,
        images: 0,
        warnings: [
          "Aucun texte trouvé : ce PDF est probablement scanné (des images de pages). Foxy ne peut lire que du texte : utilise le fichier Word d'origine si tu l'as.",
        ],
      },
    };
  }

  const lines = dropRepeatedLines(rawLines, pages);
  const body = bodySize(lines);
  let method: FoxyMethod = "aucune";
  let levelOf: (l: PdfLine, i: number) => number = () => 0;
  let suggestedTitle: string | undefined;

  // 1) Sommaire intégré : les titres des signets, retrouvés dans le texte, dans l'ordre
  if (outline.length >= 2) {
    const headingAt = new Map<number, number>();
    let k = 0;
    lines.forEach((l, i) => {
      const t = outline[k];
      if (!t) return;
      const a = norm(l.text);
      const b = norm(t.title);
      if (a && b && (a === b || (a.length > 6 && b.startsWith(a)) || (b.length > 6 && a.startsWith(b)))) {
        headingAt.set(i, Math.min(t.level + 1, 3));
        k++;
      }
    });
    if (headingAt.size >= Math.ceil(outline.length * 0.6)) {
      method = "sommaire-pdf";
      levelOf = (_l, i) => headingAt.get(i) || 0;
    }
  }

  // 2) Tailles de caractères : plus gros que le texte courant = titre
  if (method === "aucune") {
    const candidates = lines.filter((l) => l.size >= body * 1.15 && l.text.length <= 120);
    let sizes = [...new Set(candidates.map((l) => l.size))].sort((a, b) => b - a);
    // Le plus gros texte, une seule fois en page 1 : c'est le titre du document
    const biggest = sizes[0];
    const atBiggest = candidates.filter((l) => l.size === biggest);
    if (atBiggest.length === 1 && atBiggest[0].page === 1 && sizes.length > 1) {
      suggestedTitle = atBiggest[0].text;
      sizes = sizes.slice(1);
    }
    // Tailles presque égales (arrondis du PDF) : un seul niveau
    const levels: number[] = [];
    for (const s of sizes) if (!levels.some((x) => Math.abs(x - s) < 0.6)) levels.push(s);
    if (levels.length >= 1 && candidates.length >= 2) {
      method = "tailles-pdf";
      levelOf = (l) => {
        if (suggestedTitle && l.text === suggestedTitle) return -1; // ignoré ci-dessous
        if (l.size < body * 1.15 || l.text.length > 120) return 0;
        const idx = levels.findIndex((x) => Math.abs(x - l.size) < 0.6);
        return idx < 0 ? 0 : Math.min(idx + 1, 3);
      };
    }
  }

  // 3) Repères écrits : « Chapitre 1 », « I. », « 1. », « A. »
  if (method === "aucune") {
    const l1 = lines.filter((l) => LEVEL1.test(l.text) && l.text.length <= 100).length;
    if (l1 >= 1) {
      method = "reperes-pdf";
      levelOf = (l) => (l.text.length > 100 ? 0 : LEVEL1.test(l.text) ? 1 : LEVEL2.test(l.text) ? 2 : 0);
    }
  }

  const kept = suggestedTitle ? lines.filter((l) => !(l.page === 1 && l.text === suggestedTitle)) : lines;
  const html = linesToHtml(kept, (l, i) => Math.max(0, levelOf(l, i)));
  const { sections, blocks } = htmlToDraft(html);

  if (method === "aucune") {
    warnings.push(
      "Foxy n'a trouvé aucun titre (ni sommaire, ni titres plus gros, ni « Chapitre 1 ») : tout est dans une seule leçon. Découpe-la dans l'aperçu, ou pars du fichier Word."
    );
  }
  warnings.push("Un PDF perd une partie de la mise en forme (gras, formules, tableaux) : relis chaque leçon.");

  return { sections, suggestedTitle, report: { method, pages, blocks, images: 0, warnings } };
}

export async function readWithFoxy(file: File): Promise<FoxyResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) return readDocx(file);
  if (name.endsWith(".pdf")) return readPdf(file);
  throw new Error("Foxy lit les fichiers Word (.docx) et PDF.");
}

export const METHOD_LABEL: Record<FoxyMethod, string> = {
  "styles-word": "les styles de titre du document Word",
  "sommaire-pdf": "le sommaire intégré au PDF (signets)",
  "tailles-pdf": "la taille des caractères du PDF",
  "reperes-pdf": "les repères écrits (« Chapitre 1 », « I. », « A. »)",
  aucune: "aucune structure trouvée",
};
