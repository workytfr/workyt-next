/**
 * Mascottes ASCII de Workyt — format carré (grille ~9×5), plusieurs émotions.
 * Personnages : Foxy (renard), Pando (panda), Corvy (corbeau).
 *
 * Usage :
 *   import { mascots, getMascot } from "@/data/mascots";
 *   <pre className="font-mono leading-none">{getMascot("foxy", "joyeux")}</pre>
 *
 * Astuce d'affichage : utiliser une police monospace + `whitespace-pre` +
 * `leading-none` (ou leading-tight) pour garder l'alignement des colonnes.
 */

export type MascotName = "foxy" | "pando" | "corvy";
export type Emotion =
    | "joyeux"
    | "triste"
    | "surpris"
    | "amoureux"
    | "fache"
    | "endormi"
    | "clin";

// String.raw garde les backslashes intacts (essentiel pour l'art ASCII).
const A = (s: string) => s.replace(/^\n/, "").replace(/\n$/, "");

/* ───────────────────────── Foxy 🦊 (renard) ───────────────────────── */
const foxy: Partial<Record<Emotion, string>> = {
    joyeux: A(String.raw`
 /\___/\
( ^   ^ )
(   w   )
 \ \_/ /
  \___/
`),
    triste: A(String.raw`
 /\___/\
( u   u )
(   w   )
 / ^^^ \
  \___/
`),
    surpris: A(String.raw`
 /\___/\
( O   O )
(   w   )
 \  o  /
  \___/
`),
    amoureux: A(String.raw`
 /\___/\
( *   * )
(   w   )
 \ \_/ /
  \___/ v
`),
    fache: A(String.raw`
 /\___/\
( >   < )
(   w   )
 / ^^^ \
  \___/
`),
    endormi: A(String.raw`
 /\___/\
( -   - )
(   w   )
 \ --- /
  \___/ z
`),
    clin: A(String.raw`
 /\___/\
( ^   - )
(   w   )
 \ \_/ /
  \___/
`),
};

/* ───────────────────────── Pando 🐼 (panda) ───────────────────────── */
const pando: Partial<Record<Emotion, string>> = {
    joyeux: A(String.raw`
(@)_(@)
( ^   ^ )
(   v   )
 \ \_/ /
  \___/
`),
    triste: A(String.raw`
(@)_(@)
( u   u )
(   v   )
 / ^^^ \
  \___/
`),
    surpris: A(String.raw`
(@)_(@)
( O   O )
(   v   )
 \  o  /
  \___/
`),
    amoureux: A(String.raw`
(@)_(@)
( *   * )
(   v   )
 \ \_/ /
  \___/ v
`),
    fache: A(String.raw`
(@)_(@)
( >   < )
(   v   )
 / ^^^ \
  \___/
`),
    endormi: A(String.raw`
(@)_(@)
( -   - )
(   v   )
 \ --- /
  \___/ z
`),
};

/* ───────────────────────── Corvy 🐦‍⬛ (corbeau) ───────────────────── */
const corvy: Partial<Record<Emotion, string>> = {
    joyeux: A(String.raw`
 v___v
( ^   ^ )
(   >   )
( \___/ )
 ^     ^
`),
    triste: A(String.raw`
 v___v
( u   u )
(   >   )
( /^^^\ )
 ^     ^
`),
    surpris: A(String.raw`
 v___v
( O   O )
(   >   )
(  ___  )
 ^     ^
`),
    fache: A(String.raw`
 v___v
( >   < )
(   >   )
( /^^^\ )
 ^     ^
`),
    endormi: A(String.raw`
 v___v
( -   - )
(   >   )
( --- ) z
 ^     ^
`),
};

export const mascots: Record<MascotName, Partial<Record<Emotion, string>>> = {
    foxy,
    pando,
    corvy,
};

/** Renvoie l'art ASCII, avec repli sur "joyeux" si l'émotion manque. */
export function getMascot(name: MascotName, emotion: Emotion = "joyeux"): string {
    const set = mascots[name];
    return set[emotion] ?? set.joyeux ?? "";
}

/** Toutes les émotions disponibles pour un personnage. */
export function emotionsOf(name: MascotName): Emotion[] {
    return Object.keys(mascots[name]) as Emotion[];
}
