/**
 * Version lisible d'un message du suivi, sans sa mise en forme : pour les
 * aperçus (notifications, listes) qui n'affichent pas le Markdown ni les
 * formules. `**Définition** : $\frac{1}{2}$` → `Définition : 1/2`.
 */

const SYMBOLS: Record<string, string> = {
  times: '×',
  cdot: '·',
  div: '÷',
  pm: '±',
  leq: '≤',
  le: '≤',
  geq: '≥',
  ge: '≥',
  neq: '≠',
  ne: '≠',
  approx: '≈',
  infty: '∞',
  pi: 'π',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  Delta: 'Δ',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  sigma: 'σ',
  Sigma: 'Σ',
  omega: 'ω',
  in: '∈',
  to: '→',
  rightarrow: '→',
  Rightarrow: '⇒',
  Leftrightarrow: '⇔',
  degree: '°'
};

function plainMath(tex: string): string {
  let s = tex;
  // Les fractions et racines imbriquées se résolvent de l'intérieur vers l'extérieur
  for (let i = 0; i < 4; i++) {
    s = s
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${wrap(a)}/${wrap(b)}`)
      .replace(/\\sqrt\{([^{}]*)\}/g, (_, a) => `√${wrap(a)}`);
  }
  return s
    .replace(/\\left|\\right/g, '')
    .replace(/\\([a-zA-Z]+)/g, (_, cmd: string) => SYMBOLS[cmd] ?? cmd)
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// `1+x` → `(1+x)` pour que `a/b` reste juste ; `2` ou `x` restent tels quels
function wrap(v: string) {
  return /^[\w.]+$/.test(v.trim()) ? v.trim() : `(${v.trim()})`;
}

export function plainText(text: string): string {
  return String(text || '')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => plainMath(tex))
    .replace(/\$([^$\n]+?)\$/g, (_, tex) => plainMath(tex))
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?!\w)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Aperçu court d'un message (notifications) */
export function previewText(text: string, max = 80): string {
  const plain = plainText(text);
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}
