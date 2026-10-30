/**
 * Expressions mathématiques du traceur de courbes : « x^2 - 3x + 1 »,
 * « 2sin(x) », « racine(x) », « e^(-x) », « 1/x »…
 *
 * Petit analyseur maison (pas d'`eval`) : nombres (virgule ou point), x,
 * + − × ÷ ^, parenthèses, multiplication implicite (2x, 3(x+1), x(x−1)),
 * constantes π et e, et les fonctions usuelles du lycée.
 */

type Fn = (x: number) => number;

const FUNCTIONS: Record<string, (v: number) => number> = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    exp: Math.exp,
    ln: Math.log,
    log: Math.log10,
    sqrt: Math.sqrt,
    racine: Math.sqrt,
    abs: Math.abs,
    arcsin: Math.asin,
    arccos: Math.acos,
    arctan: Math.atan,
    floor: Math.floor,
    ent: Math.floor,
};

type Token =
    | { t: "num"; v: number }
    | { t: "id"; v: string }
    | { t: "op"; v: string; implicit?: boolean };

function tokenize(src: string): Token[] {
    const s = src
        .replace(/\s+/g, "")
        .replace(/[−–]/g, "-")
        .replace(/[×·]/g, "*")
        .replace(/÷/g, "/")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/√/g, "sqrt")
        .replace(/π/g, "pi")
        .toLowerCase();
    const out: Token[] = [];
    let i = 0;
    while (i < s.length) {
        const c = s[i];
        if (/[0-9.,]/.test(c)) {
            let j = i;
            while (j < s.length && /[0-9.,]/.test(s[j])) j++;
            const v = Number(s.slice(i, j).replace(",", "."));
            if (Number.isNaN(v)) throw new Error(`Nombre invalide : ${s.slice(i, j)}`);
            out.push({ t: "num", v });
            i = j;
        } else if (/[a-z]/.test(c)) {
            let j = i;
            while (j < s.length && /[a-z]/.test(s[j])) j++;
            // « 2xsin(x) » : on découpe les suites de lettres en noms connus
            let word = s.slice(i, j);
            while (word) {
                const known = [...Object.keys(FUNCTIONS), "pi", "x", "e"].sort((a, b) => b.length - a.length).find((k) => word.startsWith(k));
                if (!known) throw new Error(`Nom inconnu : ${word}`);
                out.push({ t: "id", v: known });
                word = word.slice(known.length);
            }
            i = j;
        } else if ("+-*/^()".includes(c)) {
            out.push({ t: "op", v: c });
            i++;
        } else {
            throw new Error(`Caractère inattendu : ${c}`);
        }
    }
    // Multiplication implicite : 2x, 2(…), x(…), )(…), )x, 2pi…
    const withMul: Token[] = [];
    for (const tok of out) {
        const prev = withMul[withMul.length - 1];
        const prevEnds = prev && (prev.t === "num" || (prev.t === "id" && !FUNCTIONS[prev.v]) || (prev.t === "op" && prev.v === ")"));
        const curStarts = tok.t === "num" || tok.t === "id" || (tok.t === "op" && tok.v === "(");
        if (prevEnds && curStarts) withMul.push({ t: "op", v: "*", implicit: true });
        withMul.push(tok);
    }
    return withMul;
}

export function compileExpression(src: string): Fn {
    const raw = src.replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=\s*/i, "");
    if (!raw.trim()) throw new Error("Expression vide");
    const tokens = tokenize(raw);
    let pos = 0;
    const peek = () => tokens[pos];
    const take = () => tokens[pos++];
    const expectClose = () => {
        const t = take();
        if (!t || t.t !== "op" || t.v !== ")") throw new Error("Parenthèse fermante manquante");
    };

    // expr := term (('+'|'-') term)*
    function expr(): Fn {
        let left = term();
        for (let t = peek(); t && t.t === "op" && (t.v === "+" || t.v === "-"); t = peek()) {
            take();
            const l = left, r = term();
            left = t.v === "+" ? (x) => l(x) + r(x) : (x) => l(x) - r(x);
        }
        return left;
    }
    // term := unary (('*'|'/') unary)*
    function term(): Fn {
        let left = unary();
        for (let t = peek(); t && t.t === "op" && (t.v === "*" || t.v === "/"); t = peek()) {
            take();
            const l = left, r = unary();
            left = t.v === "*" ? (x) => l(x) * r(x) : (x) => l(x) / r(x);
        }
        return left;
    }
    // unary := ('-'|'+') unary | power   (−x^2 = −(x^2))
    function unary(): Fn {
        const t = peek();
        if (t && t.t === "op" && (t.v === "-" || t.v === "+")) {
            take();
            const u = unary();
            return t.v === "-" ? (x) => -u(x) : u;
        }
        return power();
    }
    // power := atom ('^' unary)?   (associatif à droite)
    function power(): Fn {
        const base = atom();
        const t = peek();
        if (t && t.t === "op" && t.v === "^") {
            take();
            const e = unary();
            return (x) => Math.pow(base(x), e(x));
        }
        return base;
    }
    function atom(): Fn {
        const t = take();
        if (!t) throw new Error("Expression incomplète");
        if (t.t === "num") {
            const v = t.v;
            return () => v;
        }
        if (t.t === "id") {
            if (t.v === "x") return (x) => x;
            if (t.v === "pi") return () => Math.PI;
            if (t.v === "e") return () => Math.E;
            const f = FUNCTIONS[t.v];
            // sin(x)^2 = (sin x)^2 : l'appel entre parenthèses est un atome.
            // Sans parenthèses (sin 2x), l'argument est un « unary ».
            const next = peek();
            if (next && next.t === "op" && next.v === "(") {
                take();
                const inner = expr();
                expectClose();
                return (x) => f(inner(x));
            }
            // sin 2x = sin(2x) : l'argument s'étend sur les multiplications implicites
            let arg = unary();
            for (let n = peek(); n && n.t === "op" && n.implicit; n = peek()) {
                take();
                const l = arg, r = power();
                arg = (x) => l(x) * r(x);
            }
            const a = arg;
            return (x) => f(a(x));
        }
        if (t.v === "(") {
            const inner = expr();
            expectClose();
            return inner;
        }
        throw new Error(`Symbole inattendu : ${t.v}`);
    }

    const fn = expr();
    if (pos < tokens.length) throw new Error(`Symbole inattendu : ${(tokens[pos] as Token).v}`);
    // Vérifie que la fonction s'évalue (erreurs de structure)
    fn(1);
    return fn;
}
