'use client';
import { useId } from 'react';

interface PrestigeGemProps {
  color: string;      // hex couleur du tier (ex: "#B87333" pour Bronze)
  intensity: number;  // rang dans le tier : 1–5
  size?: number;      // taille en px (défaut 48)
}

/**
 * Pierre de prestige animée en SVG.
 * Plus l'intensity est élevée, plus la flamme est haute et rapide.
 * Niveaux : 1 = lueur douce | 2 = flammes latérales | 3 = flamme centrale |
 *           4 = étincelles | 5 = embrasement total
 */
export default function PrestigeGem({ color, intensity, size = 48 }: PrestigeGemProps) {
  const uid = useId().replace(/:/g, 'u');

  // Animation : plus rapide à haut niveau
  const spd = +(2.5 - (intensity - 1) * 0.28).toFixed(2); // 2.5s → 1.4s
  // Intensité feu : 0 (niv 1) → 1 (niv 5)
  const fire = (intensity - 1) / 4;
  // Hauteur des flammes : sommet de la flamme (y décroissant = monte)
  const fTop = 54 - fire * 42; // y=54 (plat) → y=12 (très haut)
  const blur = 2.5 + intensity * 1.8;

  // ── Chemins des flammes (template strings) ──────────────────────────────────
  const lA = `M30,72 C19,${58-fire*28} 13,${fTop+4} 21,${fTop} C27,${fTop+9} 33,${58-fire*18} 42,72 Z`;
  const lB = `M30,72 C17,${53-fire*28} 10,${fTop+2} 19,${fTop-6} C26,${fTop+6} 34,${53-fire*18} 42,72 Z`;

  const rA = `M70,72 C81,${58-fire*28} 87,${fTop+4} 79,${fTop} C73,${fTop+9} 67,${58-fire*18} 58,72 Z`;
  const rB = `M70,72 C83,${53-fire*28} 90,${fTop+2} 81,${fTop-6} C74,${fTop+6} 66,${53-fire*18} 58,72 Z`;

  const cA = `M50,70 C43,${56-fire*34} 39,${fTop-3} 45,${fTop-10} C48,${fTop-3} 52,${fTop-3} 55,${fTop-10} C61,${fTop-3} 57,${56-fire*34} 50,70 Z`;
  const cB = `M50,70 C41,${51-fire*34} 37,${fTop-7} 43,${fTop-15} C47,${fTop-5} 53,${fTop-5} 57,${fTop-15} C63,${fTop-7} 59,${51-fire*34} 50,70 Z`;

  const sparkles = [
    { cx: 16, cy: 27, r: 2.4, begin: '0s',    d: `${(spd*0.5).toFixed(2)}s` },
    { cx: 84, cy: 21, r: 2.0, begin: '0.35s', d: `${(spd*0.6).toFixed(2)}s` },
    ...(intensity === 5 ? [
      { cx:  8, cy: 53, r: 1.8, begin: '0.2s',  d: `${(spd*0.45).toFixed(2)}s` },
      { cx: 92, cy: 46, r: 1.6, begin: '0.65s', d: `${(spd*0.5).toFixed(2)}s` },
      { cx: 50, cy:  4, r: 2.2, begin: '0.1s',  d: `${(spd*0.4).toFixed(2)}s` },
    ] : []),
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {/* Glow filter */}
        <filter id={`gf${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Dégradé principal de la gemme */}
        <linearGradient id={`mg${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="white"  stopOpacity="0.95" />
          <stop offset="28%"  stopColor={color}  stopOpacity="0.82" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>

        {/* Dégradé de la table (face supérieure) */}
        <linearGradient id={`tg${uid}`} x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.88" />
          <stop offset="100%" stopColor={color} stopOpacity="0.22" />
        </linearGradient>

        {/* Dégradé du pavillon (pointe basse) */}
        <linearGradient id={`pg${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>

        {/* Dégradé des flammes */}
        <linearGradient id={`fg${uid}`} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.9" />
          <stop offset="55%"  stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>

        {/* Halo radial sous la gemme */}
        <radialGradient id={`rg${uid}`} cx="50%" cy="50%">
          <stop offset="0%"   stopColor={color} stopOpacity={0.22 + fire * 0.48} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>

        {/* CSS keyframes pour la pulsation */}
        <style>{`
          @keyframes gp${uid} {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.02); }
          }
          .gb${uid} {
            transform-origin: 50px 52px;
            animation: gp${uid} ${spd}s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Halo ambiant sous la gemme */}
      <ellipse cx="50" cy="80" rx={16 + fire * 24} ry={4 + fire * 8} fill={`url(#rg${uid})`}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur={`${spd}s`} repeatCount="indefinite" />
        <animate
          attributeName="rx"
          values={`${14+fire*22};${18+fire*26};${14+fire*22}`}
          dur={`${spd}s`} repeatCount="indefinite"
        />
      </ellipse>

      {/* ── Flammes (niv 2+) ─────────────────────────────────────────────── */}
      {intensity >= 2 && (
        <g opacity={Math.min(1, 0.28 + fire * 0.9)}>
          {/* Flamme gauche */}
          <path fill={`url(#fg${uid})`} d={lA}>
            <animate attributeName="d" values={`${lA};${lB};${lA}`}
              dur={`${spd}s`} repeatCount="indefinite" />
          </path>

          {/* Flamme droite */}
          <path fill={`url(#fg${uid})`} d={rA}>
            <animate attributeName="d" values={`${rA};${rB};${rA}`}
              dur={`${(spd * 0.84).toFixed(2)}s`} repeatCount="indefinite" />
          </path>

          {/* Flamme centrale (niv 3+) */}
          {intensity >= 3 && (
            <path fill={`url(#fg${uid})`} d={cA}>
              <animate attributeName="d" values={`${cA};${cB};${cA}`}
                dur={`${(spd * 0.7).toFixed(2)}s`} repeatCount="indefinite" />
            </path>
          )}
        </g>
      )}

      {/* ── Corps de la gemme (par-dessus les flammes) ───────────────────── */}
      <g className={`gb${uid}`} filter={`url(#gf${uid})`}>
        {/* Couronne (forme hexagonale) */}
        <polygon
          points="26,8 74,8 92,36 86,55 14,55 8,36"
          fill={`url(#mg${uid})`}
        />

        {/* Table — face supérieure plate */}
        <polygon
          points="36,18 64,18 76,36 64,48 36,48 24,36"
          fill={`url(#tg${uid})`}
        />

        {/* Arêtes couronne → table */}
        <line x1="26" y1="8"  x2="36" y2="18" stroke="white" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="74" y1="8"  x2="64" y2="18" stroke="white" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="92" y1="36" x2="76" y2="36" stroke="white" strokeWidth="0.5" strokeOpacity="0.35" />
        <line x1="8"  y1="36" x2="24" y2="36" stroke="white" strokeWidth="0.5" strokeOpacity="0.35" />
        <line x1="86" y1="55" x2="64" y2="48" stroke="white" strokeWidth="0.4" strokeOpacity="0.3" />
        <line x1="14" y1="55" x2="36" y2="48" stroke="white" strokeWidth="0.4" strokeOpacity="0.3" />
        {/* Liseret supérieur brillant */}
        <line x1="26" y1="8"  x2="74" y2="8"  stroke="white" strokeWidth="1.3" strokeOpacity="0.65" />

        {/* Pavillon (pointe inférieure) */}
        <polygon
          points="14,55 86,55 50,96"
          fill={`url(#pg${uid})`}
        />
        {/* Arêtes pavillon */}
        <line x1="14" y1="55" x2="50" y2="74" stroke="white" strokeWidth="0.4" strokeOpacity="0.2" />
        <line x1="86" y1="55" x2="50" y2="74" stroke="white" strokeWidth="0.4" strokeOpacity="0.2" />
        <line x1="50" y1="74" x2="50" y2="96" stroke="white" strokeWidth="0.4" strokeOpacity="0.2" />

        {/* Reflets lumineux (coin haut-gauche) */}
        <ellipse cx="38" cy="26" rx="11" ry="6"  fill="white" opacity="0.27" transform="rotate(-20 38 26)" />
        <ellipse cx="36" cy="24" rx="4.5" ry="2.5" fill="white" opacity="0.44" transform="rotate(-20 36 24)" />
      </g>

      {/* ── Étincelles (niv 4–5) ─────────────────────────────────────────── */}
      {intensity >= 4 && sparkles.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={color}>
          <animate attributeName="opacity" values="0;1;0" dur={s.d} repeatCount="indefinite" begin={s.begin} />
          <animate attributeName="r" values={`0;${s.r};0`} dur={s.d} repeatCount="indefinite" begin={s.begin} />
        </circle>
      ))}
    </svg>
  );
}
