/**
 * Outil « formule » : une notation simple, façon LaTeX, convertie en texte
 * Unicode dessinable sur le tableau (et exportable en image sans police
 * spéciale).
 *
 *   x^2 + 3x      → x² + 3x          H_2O          → H₂O
 *   SO_4^{2-}     → SO₄²⁻            \Delta E      → Δ E
 *   \sqrt{x+1}    → √(x+1)           \frac{a}{b}   → a⁄b
 *   \vec{AB}      → AB⃗               A -> B, <=>   → A → B, ⇌
 */

const SUP: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ", x: "ˣ", a: "ᵃ", b: "ᵇ", c: "ᶜ",
    d: "ᵈ", e: "ᵉ", k: "ᵏ", m: "ᵐ", o: "ᵒ", p: "ᵖ", t: "ᵗ", u: "ᵘ", v: "ᵛ", y: "ʸ", z: "ᶻ",
};
const SUB: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ",
    l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

const SYMBOLS: Record<string, string> = {
    alpha: "α", beta: "β", gamma: "γ", Gamma: "Γ", delta: "δ", Delta: "Δ", epsilon: "ε", varepsilon: "ε",
    zeta: "ζ", eta: "η", theta: "θ", Theta: "Θ", lambda: "λ", Lambda: "Λ", mu: "μ", nu: "ν", xi: "ξ",
    pi: "π", Pi: "Π", rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ", phi: "φ", varphi: "φ", Phi: "Φ",
    chi: "χ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω",
    times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠",
    ne: "≠", approx: "≈", equiv: "≡", infty: "∞", in: "∈", notin: "∉", subset: "⊂", cup: "∪", cap: "∩",
    emptyset: "∅", forall: "∀", exists: "∃", to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒",
    Leftrightarrow: "⇔", rightleftharpoons: "⇌", degree: "°", circ: "°", sum: "∑", prod: "∏", int: "∫",
    partial: "∂", nabla: "∇", sqrt: "√", perp: "⊥", parallel: "∥", angle: "∠", widehat: "", overline: "",
    R: "ℝ", N: "ℕ", Z: "ℤ", Q: "ℚ", C: "ℂ",
};

function script(text: string, map: Record<string, string>, marker: string): string {
    const chars = [...text];
    return chars.every((c) => map[c] !== undefined) ? chars.map((c) => map[c]).join("") : `${marker}(${text})`;
}

export function formulaToText(src: string): string {
    let s = src;
    // Constructions avec arguments, de l'intérieur vers l'extérieur
    for (let i = 0; i < 4; i++) {
        s = s
            .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => `${wrap(a)}⁄${wrap(b)}`)
            .replace(/\\sqrt\{([^{}]*)\}/g, (_, a) => `√${wrap(a)}`)
            .replace(/\\vec\{([^{}]*)\}/g, (_, a) => `${a}⃗`)
            .replace(/\\(?:overline|bar)\{([^{}]*)\}/g, (_, a) => [...a].map((c: string) => `${c}̅`).join(""))
            .replace(/\\(?:widehat|hat)\{([^{}]*)\}/g, (_, a) => `${a}̂`)
            .replace(/\\text\{([^{}]*)\}/g, (_, a) => a);
    }
    s = s
        // Flèches de réaction écrites au clavier
        .replace(/<=>|<->/g, "⇌")
        .replace(/->/g, "→")
        .replace(/<-/g, "←")
        .replace(/>=/g, "≥")
        .replace(/<=/g, "≤")
        .replace(/!=/g, "≠")
        .replace(/\\([a-zA-Z]+)/g, (m, cmd: string) => SYMBOLS[cmd] ?? cmd)
        // Exposants et indices : x^{…}, x^2, H_{2}, H_2
        .replace(/\^\{([^{}]*)\}/g, (_, a) => script(a, SUP, "^"))
        .replace(/_\{([^{}]*)\}/g, (_, a) => script(a, SUB, "_"))
        .replace(/\^([0-9]+|[+-]|[a-z])/g, (_, a) => script(a, SUP, "^"))
        .replace(/_([0-9]+|[a-z])/g, (_, a) => script(a, SUB, "_"))
        .replace(/\\[,;:! ]/g, " ")
        .replace(/[{}]/g, "");
    return s;
}

function wrap(v: string) {
    return /^[\w.]+$/.test(v.trim()) ? v.trim() : `(${v.trim()})`;
}
