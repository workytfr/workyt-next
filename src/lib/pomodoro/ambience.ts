/**
 * Sons d'ambiance et carillon générés dans le navigateur (Web Audio API) :
 * aucun fichier audio hébergé, donc aucun droit d'auteur en jeu.
 *
 * Singleton de module : il survit aux navigations côté client, le son
 * continue donc quand l'élève change de page.
 *
 * Confort d'écoute : bruits « colorés » (rose, brun) plutôt que blanc, aigus
 * coupés par un passe-bas général, boucles raccordées en fondu (pas de clic
 * à chaque tour), fondu à l'entrée et à la sortie, volume plafonné.
 */

export type AmbienceKind = "pluie" | "bruit-brun" | "vagues" | "feu";

export const AMBIENCES: { kind: AmbienceKind; label: string; emoji: string }[] = [
    { kind: "pluie", label: "Pluie", emoji: "🌧️" },
    { kind: "bruit-brun", label: "Bruit brun", emoji: "🟤" },
    { kind: "vagues", label: "Vagues", emoji: "🌊" },
    { kind: "feu", label: "Feu de bois", emoji: "🔥" },
];

/** Volume maximal (curseur à fond) : volontairement bas, c'est un fond sonore. */
const MAX_GAIN = 0.35;
const FADE_S = 1.5;
const LOOP_S = 12;

let ctx: AudioContext | null = null;
let volumeNode: GainNode | null = null;
let input: AudioNode | null = null;
let volume = 0.4;
let stopCurrent: (() => void) | null = null;
/** Aperçu en cours (choix d'une ambiance hors focus) */
let previewTimer: number | null = null;
const PREVIEW_MS = 4000;

/** Le curseur est perceptif : un quart du curseur ≠ un quart du bruit. */
function gainFor(v: number): number {
    const x = Math.max(0, Math.min(1, v));
    return MAX_GAIN * x * x;
}

function audio(): { ctx: AudioContext; input: AudioNode } | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
        // Chaîne commune : passe-bas (adoucit les aigus) → limiteur → volume
        const soften = ctx.createBiquadFilter();
        soften.type = "lowpass";
        soften.frequency.value = 2400;
        soften.Q.value = 0.5;
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -18;
        limiter.knee.value = 12;
        limiter.ratio.value = 8;
        volumeNode = ctx.createGain();
        volumeNode.gain.value = gainFor(volume);
        soften.connect(limiter).connect(volumeNode).connect(ctx.destination);
        input = soften;
    }
    if (ctx.state === "suspended") void ctx.resume();
    return { ctx, input: input! };
}

/**
 * Bruit coloré bouclable sans clic : on génère un peu plus long, puis on
 * fond le début avec ce qui suit la fin, pour que la boucle se raccorde.
 */
function noiseBuffer(c: AudioContext, color: "pink" | "brown", seconds = LOOP_S): AudioBuffer {
    const len = Math.floor(c.sampleRate * seconds);
    const fade = Math.floor(c.sampleRate * 0.5);
    const raw = new Float32Array(len + fade);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < raw.length; i++) {
        const white = Math.random() * 2 - 1;
        if (color === "pink") {
            // Filtre de Paul Kellet
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        } else {
            last = (last + 0.02 * white) / 1.02;
            raw[i] = last * 3;
        }
    }
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < len; i++) {
        data[i] = i < fade ? raw[i] * (i / fade) + raw[len + i] * (1 - i / fade) : raw[i];
        peak = Math.max(peak, Math.abs(data[i]));
    }
    // Normalisation : même niveau pour toutes les ambiances, sans saturation
    const norm = peak > 0 ? 0.5 / peak : 1;
    for (let i = 0; i < len; i++) data[i] *= norm;
    return buf;
}

function loop(c: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
}

function filter(c: AudioContext, type: BiquadFilterType, frequency: number): BiquadFilterNode {
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    return f;
}

/** À appeler dans un clic : le navigateur n'autorise le son qu'après un geste de l'élève. */
export function unlockAudio() {
    audio();
}

export function playAmbience(kind: AmbienceKind) {
    const a = audio();
    if (!a) return;
    stopAmbience();
    const { ctx: c, input: out } = a;
    const nodes: AudioScheduledSourceNode[] = [];
    const timers: number[] = [];

    // Chaque ambiance passe par son propre fondu d'entrée / de sortie
    const env = c.createGain();
    env.gain.setValueAtTime(0, c.currentTime);
    env.gain.linearRampToValueAtTime(1, c.currentTime + FADE_S);
    env.connect(out);

    if (kind === "bruit-brun") {
        const src = loop(c, noiseBuffer(c, "brown"));
        src.connect(filter(c, "lowpass", 900)).connect(env);
        nodes.push(src);
    } else if (kind === "pluie") {
        // Pluie douce : bruit rose, ni grave ni sifflant
        const src = loop(c, noiseBuffer(c, "pink"));
        const g = c.createGain();
        g.gain.value = 0.8;
        src.connect(filter(c, "highpass", 250)).connect(filter(c, "lowpass", 1800)).connect(g).connect(env);
        nodes.push(src);
    } else if (kind === "vagues") {
        const src = loop(c, noiseBuffer(c, "brown"));
        const swell = c.createGain();
        swell.gain.value = 0.6;
        // Ressac : le volume ondule lentement (une vague toutes les ~11 s)
        const lfo = c.createOscillator();
        lfo.frequency.value = 0.09;
        const depth = c.createGain();
        depth.gain.value = 0.35;
        lfo.connect(depth).connect(swell.gain);
        src.connect(filter(c, "lowpass", 700)).connect(swell).connect(env);
        nodes.push(src, lfo);
    } else if (kind === "feu") {
        const src = loop(c, noiseBuffer(c, "brown"));
        const g = c.createGain();
        g.gain.value = 0.8;
        src.connect(filter(c, "lowpass", 450)).connect(g).connect(env);
        nodes.push(src);
        // Crépitements discrets : petits craquements feutrés, avec enveloppe
        const crackle = c.createBuffer(1, Math.floor(c.sampleRate * 0.02), c.sampleRate);
        const d = crackle.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        timers.push(window.setInterval(() => {
            if (Math.random() > 0.25) return;
            const s = c.createBufferSource();
            s.buffer = crackle;
            const cg = c.createGain();
            const t = c.currentTime;
            cg.gain.setValueAtTime(0.0001, t);
            cg.gain.exponentialRampToValueAtTime(0.04 + Math.random() * 0.08, t + 0.003);
            cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
            s.connect(filter(c, "bandpass", 900 + Math.random() * 1200)).connect(cg).connect(env);
            s.start(t);
        }, 140));
    }

    nodes.forEach((n) => n.start());
    stopCurrent = () => {
        timers.forEach((t) => clearInterval(t));
        // Fondu de sortie avant l'arrêt
        const t = c.currentTime;
        env.gain.cancelScheduledValues(t);
        env.gain.setValueAtTime(env.gain.value, t);
        env.gain.linearRampToValueAtTime(0, t + 0.6);
        nodes.forEach((n) => { try { n.stop(t + 0.7); } catch { /* déjà arrêté */ } });
    };
}

/**
 * Arrête l'ambiance. Avec keepPreview, un aperçu en cours continue jusqu'à
 * sa fin (le Pomodoro coupe le son hors focus sans couper l'aperçu).
 */
export function stopAmbience(opts?: { keepPreview?: boolean }) {
    if (opts?.keepPreview && previewTimer !== null) return;
    if (previewTimer !== null) {
        clearTimeout(previewTimer);
        previewTimer = null;
    }
    stopCurrent?.();
    stopCurrent = null;
}

/** Court aperçu d'une ambiance, quand l'élève la choisit en dehors d'un focus. */
export function previewAmbience(kind: AmbienceKind) {
    playAmbience(kind);
    previewTimer = window.setTimeout(() => {
        previewTimer = null;
        stopAmbience();
    }, PREVIEW_MS);
}

export function setAmbienceVolume(v: number) {
    volume = v;
    if (ctx && volumeNode) volumeNode.gain.setTargetAtTime(gainFor(v), ctx.currentTime, 0.1);
}

/** Carillon de fin de phase : deux notes douces (montantes = pause, descendantes = reprise). */
export function playChime(direction: "up" | "down") {
    if (typeof window === "undefined") return;
    // Le carillon ne passe pas par le volume d'ambiance : il doit s'entendre même sans ambiance
    const c = ctx ?? audio()?.ctx;
    if (!c) return;
    if (c.state === "suspended") void c.resume();
    const notes = direction === "up" ? [523.25, 783.99] : [783.99, 523.25];
    notes.forEach((freq, i) => {
        const t = c.currentTime + i * 0.3;
        const osc = c.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        osc.connect(g).connect(c.destination);
        osc.start(t);
        osc.stop(t + 1.45);
    });
}
