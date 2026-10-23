/**
 * Ancrage d'une question sur un passage de leçon (sélecteur « citation » du
 * modèle W3C Web Annotation) : on garde le texte exact plus quelques caractères
 * avant / après. On retrouve ainsi le passage même si l'auteur modifie la leçon
 * ailleurs ; s'il a disparu, la question reste listée sans surlignage.
 *
 * La recherche ignore les espaces pour résister aux retouches de mise en forme.
 */

export interface PassageAnchor {
    exact: string;
    prefix: string;
    suffix: string;
}

export const ANCHOR_LIMITS = { exactMin: 3, exactMax: 600, context: 48 };

const MARK_CLASS = "wk-qmark";

function textNodes(root: Node): Text[] {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    return nodes;
}

const collapse = (s: string) => s.replace(/\s+/g, " ");
const squeeze = (s: string) => s.replace(/\s+/g, "");

/**
 * Texte du conteneur sans aucun espace + correspondance index → index brut.
 * La comparaison ignore les espaces : entre deux paragraphes, la sélection du
 * navigateur insère un retour à la ligne que le DOM ne contient pas.
 */
function squeezedText(root: Node) {
    const raw = textNodes(root).map((n) => n.data).join("");
    let text = "";
    const map: number[] = [];
    for (let i = 0; i < raw.length; i++) {
        if (/\s/.test(raw[i])) continue;
        text += raw[i];
        map.push(i);
    }
    return { text, map };
}

/**
 * Construit l'ancre d'une sélection faite dans `root` (null si inexploitable).
 * `displayText` : texte de la sélection tel que le navigateur le restitue
 * (avec les sauts de ligne entre paragraphes), plus lisible en citation.
 */
export function captureAnchor(range: Range, root: HTMLElement, displayText?: string): PassageAnchor | null {
    if (!root.contains(range.commonAncestorContainer)) return null;

    const selected = displayText ?? range.toString();
    const exact = collapse(selected).trim();
    if (exact.length < ANCHOR_LIMITS.exactMin || exact.length > ANCHOR_LIMITS.exactMax) return null;

    const before = document.createRange();
    before.setStart(root, 0);
    before.setEnd(range.startContainer, range.startOffset);
    const after = document.createRange();
    after.setStart(range.endContainer, range.endOffset);
    after.setEnd(root, root.childNodes.length);

    // Les espaces retirés en bord de sélection font partie du contexte
    const lead = selected.slice(0, selected.length - selected.trimStart().length);
    const trail = selected.slice(selected.trimEnd().length);

    return {
        exact,
        prefix: collapse(before.toString() + lead).slice(-ANCHOR_LIMITS.context),
        suffix: collapse(trail + after.toString()).slice(0, ANCHOR_LIMITS.context),
    };
}

function commonSuffixLength(a: string, b: string) {
    let n = 0;
    while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
    return n;
}

function commonPrefixLength(a: string, b: string) {
    let n = 0;
    while (n < a.length && n < b.length && a[n] === b[n]) n++;
    return n;
}

/** Position brute [start, end[ du passage dans `root`, ou null s'il a disparu */
export function locateAnchor(root: HTMLElement, anchor: PassageAnchor): [number, number] | null {
    const { text, map } = squeezedText(root);
    const exact = squeeze(anchor.exact);
    if (!exact) return null;
    const prefix = squeeze(anchor.prefix);
    const suffix = squeeze(anchor.suffix);

    let best = -1;
    let bestScore = -1;
    for (let i = text.indexOf(exact), guard = 0; i !== -1 && guard < 200; i = text.indexOf(exact, i + 1), guard++) {
        const score =
            commonSuffixLength(text.slice(Math.max(0, i - prefix.length), i), prefix) +
            commonPrefixLength(text.slice(i + exact.length, i + exact.length + suffix.length), suffix);
        if (score > bestScore) {
            best = i;
            bestScore = score;
        }
    }
    if (best === -1) return null;
    return [map[best], map[best + exact.length - 1] + 1];
}

/** Enveloppe le texte [start, end[ de `root` dans des <mark> (un par nœud texte) */
export function wrapRange(root: HTMLElement, start: number, end: number, attrs: Record<string, string>) {
    let offset = 0;
    for (const node of textNodes(root)) {
        const nodeStart = offset;
        const nodeEnd = offset + node.data.length;
        offset = nodeEnd;
        if (nodeEnd <= start || nodeStart >= end) continue;
        // Les retours à la ligne entre deux blocs ne valent pas un surlignage
        if (!node.data.trim()) continue;

        let target = node;
        const from = Math.max(start, nodeStart) - nodeStart;
        const to = Math.min(end, nodeEnd) - nodeStart;
        if (from > 0) target = target.splitText(from);
        if (to - from < target.data.length) target.splitText(to - from);

        const mark = document.createElement("mark");
        mark.className = MARK_CLASS;
        for (const [k, v] of Object.entries(attrs)) mark.setAttribute(k, v);
        target.parentNode!.insertBefore(mark, target);
        mark.appendChild(target);
    }
}

/** Retire tous les surlignages et recolle les nœuds texte */
export function unwrapAll(root: HTMLElement) {
    root.querySelectorAll(`mark.${MARK_CLASS}`).forEach((mark) => {
        const parent = mark.parentNode!;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
    });
    root.normalize();
}
