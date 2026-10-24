/**
 * Illustrations SVG de la fable : Corvy (corbeau), Foxy (renard), le fromage
 * et l'arbre. Même style que SceneArt (Plateau de l'Aventure) : formes plates,
 * contours épais foncés, arrondis kawaii, palette Workyt.
 */

const INK = "#3A2E2E";
const CROW = "#3B3553";
const CROW_DARK = "#2A2540";
const CROW_FEATHER = "#57507A";
const BEAK = "#FFB547";
const FOX = "#FF6A1A";
const CREAM = "#FFF6EA";
const BLUSH = "#FF8A80";

export type CrowMood = "calme" | "concentre" | "inquiet" | "fier" | "triste" | "dort";
export type FoxMood = "ruse" | "charmeur" | "content" | "decu" | "dort";

/* ───────────────────────── Fromage ───────────────────────── */

/** Part de fromage (repère local 44 × 32), à placer dans un autre SVG. */
function CheeseShape({ transform }: { transform: string }) {
    return (
        <g transform={transform}>
            <path d="M2 24 L36 4 L42 24 Z" fill="#FFD166" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M2 24 L42 24 L42 30 L2 30 Z" fill="#F4B400" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <circle cx="28" cy="18" r="2.6" fill="#F4B400" />
            <circle cx="35" cy="12" r="1.8" fill="#F4B400" />
            <circle cx="17" cy="21" r="1.6" fill="#F4B400" />
        </g>
    );
}

/* ───────────────────────── Corvy ───────────────────────── */

/** Œil de profil (un seul œil visible), sourcil selon l'humeur. */
function CrowEye({ mood }: { mood: CrowMood }) {
    if (mood === "dort" || mood === "fier") {
        const d = mood === "dort" ? "M100 54 Q108 60 116 54" : "M100 56 Q108 48 116 56";
        return <path d={d} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
    }
    const pupilY = mood === "triste" ? 57 : 54;
    return (
        <g>
            <ellipse cx="108" cy="54" rx="9" ry={mood === "inquiet" ? 11 : 10} fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx="111" cy={pupilY} r={mood === "inquiet" ? 3.6 : 4.8} fill={INK} />
            <circle cx="113" cy={pupilY - 2.5} r="1.6" fill="#fff" />
            {mood === "concentre" && <path d="M98 41 L118 45" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
            {mood === "triste" && <path d="M99 45 L117 39" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
            {mood === "inquiet" && <path d="M99 39 Q108 34 117 39" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />}
        </g>
    );
}

/**
 * Corvy de profil, perché, tourné vers la droite. Avec `holding`, il tient le
 * fromage dans le bec ; triste, il a le bec ouvert (le fromage est tombé).
 */
export function CrowArt({ mood, holding, className }: { mood: CrowMood; holding: boolean; className?: string }) {
    const beakOpen = mood === "triste";
    return (
        <svg viewBox="0 0 180 150" className={className} aria-hidden>
            {/* Queue */}
            <path d="M40 98 L6 116 L14 100 L2 92 L38 86 Z" fill={CROW_DARK} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
            {/* Pattes agrippées à la branche */}
            <g stroke={BEAK} strokeWidth="5" strokeLinecap="round">
                <path d="M64 120 L62 138" />
                <path d="M82 120 L84 138" />
            </g>
            <g stroke={BEAK} strokeWidth="3.5" strokeLinecap="round" fill="none">
                <path d="M62 138 L54 143 M62 138 L62 145 M62 138 L70 143" />
                <path d="M84 138 L76 143 M84 138 L84 145 M84 138 L92 143" />
            </g>
            {/* Corps */}
            <ellipse cx="72" cy="96" rx="40" ry="30" fill={CROW} stroke={INK} strokeWidth="3.5" />
            {/* Aile */}
            <path d="M40 92 C 48 74, 82 74, 94 92 C 84 110, 56 116, 40 104 Z" fill={CROW_DARK} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
            <g stroke={CROW_FEATHER} strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M52 96 C 60 92, 70 92, 78 96" />
                <path d="M54 103 C 62 100, 70 100, 76 103" />
            </g>
            {/* Tête */}
            <circle cx="104" cy="60" r="28" fill={CROW} stroke={INK} strokeWidth="3.5" />
            <path d="M96 33 C 92 22, 100 16, 106 20 C 104 24, 106 28, 110 32" fill={CROW} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <CrowEye mood={mood} />
            <ellipse cx="100" cy="72" rx="6" ry="3.5" fill={BLUSH} opacity={mood === "triste" ? 0.3 : 0.6} />
            {holding && !beakOpen && <CheeseShape transform="translate(140 56) rotate(8) scale(0.78)" />}
            {/* Bec */}
            {beakOpen ? (
                <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
                    <path d="M126 56 L158 48 L128 66 Z" fill={BEAK} />
                    <path d="M128 70 L154 84 L126 76 Z" fill="#F29B1D" />
                </g>
            ) : (
                <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
                    <path d="M126 56 L160 66 L126 76 Z" fill={BEAK} />
                    <path d="M128 66 L150 66" fill="none" strokeWidth="2" />
                </g>
            )}
            {mood === "dort" && (
                <g fill={INK} fontFamily="var(--font-funnel-display), sans-serif" fontWeight="700">
                    <text x="128" y="30" fontSize="15">z</text>
                    <text x="142" y="17" fontSize="11">z</text>
                </g>
            )}
        </svg>
    );
}

/* ───────────────────────── Foxy ───────────────────────── */

function FoxFace({ mood }: { mood: FoxMood }) {
    const eyes = (() => {
        switch (mood) {
            case "ruse":
                // Paupières mi-closes, regard en coin vers le corbeau
                return (
                    <g>
                        <ellipse cx="66" cy="58" rx="6" ry="5" fill={INK} />
                        <ellipse cx="94" cy="58" rx="6" ry="5" fill={INK} />
                        <circle cx="64" cy="56" r="1.6" fill="#fff" />
                        <circle cx="92" cy="56" r="1.6" fill="#fff" />
                        <path d="M58 54 L74 52" stroke={INK} strokeWidth="4" strokeLinecap="round" />
                        <path d="M86 52 L102 54" stroke={INK} strokeWidth="4" strokeLinecap="round" />
                    </g>
                );
            case "charmeur":
                return (
                    <g fill={BLUSH} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
                        <path d="M66 64 C 56 56, 58 48, 66 52 C 74 48, 76 56, 66 64 Z" />
                        <path d="M94 64 C 84 56, 86 48, 94 52 C 102 48, 104 56, 94 64 Z" />
                    </g>
                );
            case "content":
            case "dort":
                return (
                    <g fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round">
                        {mood === "content" ? (
                            <>
                                <path d="M59 60 Q66 51 73 60" />
                                <path d="M87 60 Q94 51 101 60" />
                            </>
                        ) : (
                            <>
                                <path d="M59 57 Q66 63 73 57" />
                                <path d="M87 57 Q94 63 101 57" />
                            </>
                        )}
                    </g>
                );
            case "decu":
                return (
                    <g>
                        <circle cx="66" cy="59" r="5" fill={INK} />
                        <circle cx="94" cy="59" r="5" fill={INK} />
                        <circle cx="64.5" cy="57.5" r="1.5" fill="#fff" />
                        <circle cx="92.5" cy="57.5" r="1.5" fill="#fff" />
                        <path d="M58 50 L73 46" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M87 46 L102 50" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                );
        }
    })();

    const mouth =
        mood === "decu" ? (
            <path d="M72 86 Q80 81 88 86" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        ) : mood === "ruse" ? (
            <path d="M70 82 Q78 88 90 80" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        ) : (
            <path d="M72 82 Q76 87 80 83 Q84 87 88 82" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        );

    return (
        <g>
            {eyes}
            <ellipse cx="58" cy="70" rx="6" ry="3.5" fill={BLUSH} opacity="0.6" />
            <ellipse cx="102" cy="70" rx="6" ry="3.5" fill={BLUSH} opacity="0.6" />
            <ellipse cx="80" cy="75" rx="5.5" ry="4" fill={INK} />
            {mouth}
        </g>
    );
}

/** Foxy, assis au pied de l'arbre, la tête levée vers le corbeau. */
export function FoxArt({ mood, holding, className }: { mood: FoxMood; holding: boolean; className?: string }) {
    return (
        <svg viewBox="0 0 190 170" className={className} aria-hidden>
            {/* Queue en panache */}
            <path
                d="M112 146 C 168 150, 186 104, 164 70 C 160 92, 148 104, 132 108 C 120 112, 112 124, 112 146 Z"
                fill={FOX}
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <path d="M164 70 C 176 84, 178 98, 172 110 C 164 104, 160 94, 164 70 Z" fill={CREAM} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
            {/* Corps assis */}
            <path
                d="M46 152 C 40 122, 52 96, 80 94 C 108 94, 122 120, 116 152 Z"
                fill={FOX}
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
            />
            {/* Plastron */}
            <path d="M64 152 C 60 128, 68 104, 80 102 C 92 104, 100 128, 96 152 Z" fill={CREAM} />
            {/* Pattes avant (chaussettes sombres) */}
            <g stroke={INK} strokeWidth="3.5">
                <rect x="58" y="138" width="16" height="20" rx="8" fill={INK} />
                <rect x="86" y="138" width="16" height="20" rx="8" fill={INK} />
            </g>
            {/* Tête légèrement penchée vers le haut à gauche */}
            <g transform="rotate(-8 80 64)">
                {/* Oreilles */}
                <path d="M44 50 L36 8 L70 32 Z" fill={FOX} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
                <path d="M116 50 L124 8 L90 32 Z" fill={FOX} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
                <path d="M46 40 L42 18 L60 31 Z" fill={INK} />
                <path d="M114 40 L118 18 L100 31 Z" fill={INK} />
                {/* Crâne */}
                <path
                    d="M34 58 C 34 34, 56 24, 80 24 C 104 24, 126 34, 126 58 C 126 82, 104 98, 80 98 C 56 98, 34 82, 34 58 Z"
                    fill={FOX}
                    stroke={INK}
                    strokeWidth="4"
                    strokeLinejoin="round"
                />
                {/* Masque clair du museau */}
                <path d="M40 66 C 54 64, 70 70, 80 92 C 90 70, 106 64, 120 66 C 116 86, 100 98, 80 98 C 60 98, 44 86, 40 66 Z" fill={CREAM} />
                <path d="M34 58 C 34 82, 56 98, 80 98 C 104 98, 126 82, 126 58" fill="none" stroke={INK} strokeWidth="4" />
                <FoxFace mood={mood} />
                {holding && <CheeseShape transform="translate(66 78) rotate(-6) scale(0.75)" />}
            </g>
            {mood === "dort" && (
                <g fill={INK} fontFamily="var(--font-funnel-display), sans-serif" fontWeight="700">
                    <text x="136" y="30" fontSize="16">z</text>
                    <text x="150" y="16" fontSize="11">z</text>
                </g>
            )}
        </svg>
    );
}

/* ───────────────────────── Décor ───────────────────────── */

/** Arbre vu de côté : tronc à gauche, branche horizontale où se perche Corvy (y ≈ 128). */
export function TreeArt({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 380 300" className={className} aria-hidden>
            {/* Feuillage */}
            <g fill="#7ED957" stroke={INK} strokeWidth="4" strokeLinejoin="round">
                <circle cx="40" cy="44" r="46" />
                <circle cx="104" cy="30" r="36" />
                <circle cx="-6" cy="96" r="40" />
            </g>
            <g fill="#A3E77F">
                <circle cx="28" cy="30" r="14" />
                <circle cx="100" cy="20" r="10" />
            </g>
            {/* Tronc */}
            <path d="M20 300 C 28 220, 26 150, 40 70 L72 70 C 64 150, 70 230, 82 300 Z" fill="#A0673F" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <path d="M44 120 C 48 140, 46 160, 50 180" fill="none" stroke="#7A4A2A" strokeWidth="3" strokeLinecap="round" />
            {/* Branche */}
            <path
                d="M56 136 C 120 122, 200 130, 300 120 C 312 119, 318 128, 306 132 C 210 144, 130 140, 60 154 Z"
                fill="#A0673F"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
            />
            {/* Rameau et feuilles */}
            <path d="M232 128 C 246 112, 262 104, 280 102" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <g fill="#7ED957" stroke={INK} strokeWidth="3" strokeLinejoin="round">
                <path d="M280 102 C 290 90, 306 92, 310 100 C 300 108, 288 108, 280 102 Z" />
                <path d="M258 108 C 258 94, 270 88, 276 92 C 274 102, 266 108, 258 108 Z" />
                <path d="M150 132 C 154 146, 166 152, 172 148 C 168 138, 160 132, 150 132 Z" />
            </g>
        </svg>
    );
}
