"use client";

import React from 'react';

/**
 * Blason de clan généré à la volée, déterministe.
 *
 * Aucun fichier image, aucun stockage : le blason est recalculé à chaque
 * affichage depuis l'identifiant du clan. Même identifiant → même blason.
 *
 * La RÈGLE DES ÉMAUX est appliquée AU TIRAGE, pas vérifiée après coup :
 * en héraldique, on ne pose jamais métal sur métal ni couleur sur couleur.
 * C'est cette contrainte qui distingue un vrai blason d'un barbouillage.
 *
 * Tout est tracé dans un viewBox 100×115 puis rogné à la forme de l'écu par
 * un <clipPath> — les partitions ne sont donc que des rectangles qui débordent.
 */

const METAUX = ['#D4AF37', '#E8E8E8']; // or, argent
const COULEURS = ['#C8102E', '#0B4EA2', '#1E7A46', '#1C1C1C', '#6B2D5B']; // gueules, azur, sinople, sable, pourpre
const INK = '#3A2E2E';

/* ---------- Tirage déterministe ---------- */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Chaque composante utilise un décalage distinct pour ne pas se corréler. */
function pick<T>(arr: T[], seed: number, offset: number): T {
  const x = Math.sin(seed * 0.0001 + offset * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return arr[Math.min(arr.length - 1, Math.floor(frac * arr.length))];
}

/* ---------- Formes d'écu ---------- */

const FORMES: string[] = [
  // 1. Écu français ancien — flancs droits, pointe arrondie
  'M10,4 H90 V66 Q90,98 50,112 Q10,98 10,66 Z',
  // 2. Écu français moderne — base droite, angles arrondis
  'M10,4 H90 V96 Q90,111 76,111 H24 Q10,111 10,96 Z',
  // 3. Écu en bannière — carré
  'M9,4 H91 V111 H9 Z',
  // 4. Écu à bouche — encoche à dextre
  'M10,4 H62 A9,9 0 0,0 80,4 H90 V66 Q90,98 50,112 Q10,98 10,66 Z',
  // 5. Ovale
  'M50,3 C84,3 93,30 93,58 C93,90 74,112 50,112 C26,112 7,90 7,58 C7,30 16,3 50,3 Z',
  // 6. Losange
  'M50,3 L94,58 L50,112 L6,58 Z'
];

/* ---------- Partitions du champ ---------- */

type Painter = (a: string, b: string) => React.ReactNode;

const PARTITIONS: { nom: string; render: Painter }[] = [
  { nom: 'plain', render: () => null },
  { nom: 'parti', render: (_a, b) => <rect x="50" y="-5" width="55" height="125" fill={b} /> },
  { nom: 'coupé', render: (_a, b) => <rect x="-5" y="57" width="110" height="63" fill={b} /> },
  { nom: 'tranché', render: (_a, b) => <polygon points="-5,-5 105,-5 -5,120" fill={b} /> },
  { nom: 'taillé', render: (_a, b) => <polygon points="105,-5 105,120 -5,120" fill={b} /> },
  {
    nom: 'écartelé',
    render: (_a, b) => (
      <g fill={b}>
        <rect x="-5" y="-5" width="55" height="62" />
        <rect x="50" y="57" width="55" height="63" />
      </g>
    )
  },
  {
    nom: 'chevronné',
    render: (_a, b) => (
      <g fill={b}>
        <polygon points="50,10 105,58 105,40 50,-8" />
        <polygon points="50,45 105,93 105,75 50,27" />
        <polygon points="50,10 -5,58 -5,40 50,-8" />
        <polygon points="50,45 -5,93 -5,75 50,27" />
      </g>
    )
  },
  {
    nom: 'gironné',
    render: (_a, b) => (
      <g fill={b}>
        <polygon points="50,57 105,-5 105,30" />
        <polygon points="50,57 105,85 105,120" />
        <polygon points="50,57 -5,-5 -5,30" />
        <polygon points="50,57 -5,85 -5,120" />
      </g>
    )
  }
];

/* ---------- Pièces honorables ---------- */

const PIECES: { nom: string; render: (c: string) => React.ReactNode }[] = [
  { nom: 'aucune', render: () => null },
  { nom: 'fasce', render: (c) => <rect x="-5" y="45" width="110" height="24" fill={c} /> },
  { nom: 'pal', render: (c) => <rect x="38" y="-5" width="24" height="125" fill={c} /> },
  { nom: 'bande', render: (c) => <polygon points="-5,20 20,-5 105,80 80,105" fill={c} /> },
  {
    nom: 'croix',
    render: (c) => (
      <g fill={c}>
        <rect x="-5" y="45" width="110" height="22" />
        <rect x="39" y="-5" width="22" height="125" />
      </g>
    )
  },
  {
    nom: 'sautoir',
    render: (c) => (
      <g fill={c}>
        <polygon points="-5,12 8,-5 105,92 92,109" />
        <polygon points="105,12 92,-5 -5,92 8,109" />
      </g>
    )
  },
  { nom: 'chevron', render: (c) => <polygon points="50,25 105,80 105,102 50,47 -5,102 -5,80" fill={c} /> }
];

/* ---------- Meubles ---------- */
/* Dessinés centrés sur (0,0), dans un carré d'environ 44×44. */

const MEUBLES: { nom: string; render: (c: string) => React.ReactNode }[] = [
  {
    nom: 'fleur de lys',
    render: (c) => (
      <path
        fill={c}
        d="M0,-22 C4,-14 7,-9 7,-4 C11,-9 17,-11 19,-6 C21,-1 16,4 9,4 L9,8 L-9,8 L-9,4 C-16,4 -21,-1 -19,-6 C-17,-11 -11,-9 -7,-4 C-7,-9 -4,-14 0,-22 Z M-13,12 H13 V17 H-13 Z"
      />
    )
  },
  {
    nom: 'lion',
    render: (c) => (
      <g fill={c}>
        <circle cx="0" cy="-8" r="12" />
        <path d="M-14,2 C-14,14 -7,20 0,20 C7,20 14,14 14,2 C8,8 -8,8 -14,2 Z" />
        <path d="M-18,-14 L-11,-9 M18,-14 L11,-9" stroke={c} strokeWidth="4" strokeLinecap="round" />
      </g>
    )
  },
  {
    nom: 'aigle',
    render: (c) => (
      <g fill={c}>
        <path d="M0,-16 L-22,-4 L-9,0 L-18,14 L0,6 L18,14 L9,0 L22,-4 Z" />
        <circle cx="0" cy="-17" r="5" />
      </g>
    )
  },
  {
    nom: 'tour',
    render: (c) => (
      <path fill={c} d="M-13,-16 H-8 V-11 H-3 V-16 H3 V-11 H8 V-16 H13 V-6 H10 V18 H-10 V-6 H-13 Z" />
    )
  },
  {
    nom: 'étoile',
    render: (c) => (
      <path fill={c} d="M0,-21 L6,-7 L21,-6 L10,4 L13,19 L0,11 L-13,19 L-10,4 L-21,-6 L-6,-7 Z" />
    )
  },
  {
    nom: 'croissant',
    render: (c) => (
      <path fill={c} d="M2,-19 A19,19 0 1,0 2,19 A15,15 0 1,1 2,-19 Z" />
    )
  },
  {
    nom: 'épée',
    render: (c) => (
      <g fill={c}>
        <polygon points="0,-22 4,-14 4,8 -4,8 -4,-14" />
        <rect x="-12" y="8" width="24" height="4" />
        <rect x="-3" y="12" width="6" height="10" />
      </g>
    )
  },
  {
    nom: 'chêne',
    render: (c) => (
      <g fill={c}>
        <circle cx="0" cy="-8" r="14" />
        <circle cx="-11" cy="0" r="9" />
        <circle cx="11" cy="0" r="9" />
        <rect x="-3" y="4" width="6" height="17" />
      </g>
    )
  },
  {
    nom: 'rose',
    render: (c) => (
      <g fill={c}>
        <circle cx="0" cy="0" r="7" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-13" rx="6" ry="8" transform={`rotate(${a})`} />
        ))}
      </g>
    )
  },
  {
    nom: 'soleil',
    render: (c) => (
      <g fill={c}>
        <circle cx="0" cy="0" r="10" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <polygon key={a} points="-3,-13 3,-13 0,-22" transform={`rotate(${a})`} />
        ))}
      </g>
    )
  },
  {
    nom: 'losange',
    render: (c) => <polygon fill={c} points="0,-20 14,0 0,20 -14,0" />
  },
  {
    nom: 'ancre',
    render: (c) => (
      <g fill="none" stroke={c} strokeWidth="4" strokeLinecap="round">
        <line x1="0" y1="-16" x2="0" y2="16" />
        <line x1="-10" y1="-10" x2="10" y2="-10" />
        <path d="M-14,6 A14,14 0 0,0 14,6" />
      </g>
    )
  },
  {
    nom: 'faucon',
    render: (c) => (
      <g fill={c}>
        <path d="M0,-14 C10,-14 18,-4 18,8 L0,18 L-18,8 C-18,-4 -10,-14 0,-14 Z" />
        <polygon points="0,-14 -5,-22 5,-22" />
      </g>
    )
  },
  {
    nom: 'serpent',
    render: (c) => (
      <path
        fill="none"
        stroke={c}
        strokeWidth="5"
        strokeLinecap="round"
        d="M-16,16 C-16,4 -4,4 -4,-4 C-4,-12 8,-12 8,-4 C8,4 16,4 16,-14"
      />
    )
  },
  {
    nom: 'sanglier',
    render: (c) => (
      <g fill={c}>
        <ellipse cx="0" cy="2" rx="18" ry="11" />
        <polygon points="-18,-2 -22,-14 -10,-8" />
        <polygon points="18,-2 22,-14 10,-8" />
        <rect x="-12" y="11" width="4" height="8" />
        <rect x="8" y="11" width="4" height="8" />
      </g>
    )
  },
  {
    nom: 'cerf',
    render: (c) => (
      <g fill={c}>
        <ellipse cx="0" cy="6" rx="9" ry="12" />
        <path d="M-9,-8 L-14,-20 M-9,-8 L-4,-18 M9,-8 L14,-20 M9,-8 L4,-18"
              stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </g>
    )
  },
  {
    nom: 'corbeau',
    render: (c) => (
      <g fill={c}>
        <ellipse cx="2" cy="4" rx="15" ry="9" transform="rotate(-12)" />
        <circle cx="-12" cy="-8" r="6" />
        <polygon points="-17,-8 -25,-6 -17,-4" />
      </g>
    )
  },
  {
    nom: 'clé',
    render: (c) => (
      <g fill={c}>
        <circle cx="0" cy="-12" r="8" />
        <circle cx="0" cy="-12" r="3.5" fill="#00000000" stroke="none" />
        <rect x="-2.5" y="-5" width="5" height="24" />
        <rect x="2" y="8" width="8" height="4" />
        <rect x="2" y="15" width="6" height="4" />
      </g>
    )
  },
  {
    nom: 'couronne',
    render: (c) => (
      <g fill={c}>
        <polygon points="-18,8 -18,-10 -9,-1 0,-14 9,-1 18,-10 18,8" />
        <rect x="-18" y="10" width="36" height="6" />
      </g>
    )
  },
  {
    nom: 'coquille',
    render: (c) => (
      <g fill={c}>
        <path d="M-18,8 A18,18 0 0,1 18,8 Z" />
        <path d="M-9,8 L-6,-8 M0,8 L0,-10 M9,8 L6,-8"
              stroke="#00000033" strokeWidth="2" fill="none" />
        <rect x="-4" y="8" width="8" height="5" rx="2" />
      </g>
    )
  }
];

/* ---------- Composant ---------- */

export interface ClanBannerProps {
  /** Identifiant du clan — détermine intégralement le blason */
  seed: string;
  /** Largeur en pixels (la hauteur suit le ratio 100:115) */
  size?: number;
  className?: string;
  /** Nom du clan, pour l'accessibilité */
  label?: string;
}

export default function ClanBanner({ seed, size = 96, className, label }: ClanBannerProps) {
  const s = hash(seed);

  // Règle des émaux : si le champ est un métal, tout ce qui s'y pose est une
  // couleur, et inversement. Appliquée au tirage → jamais de blason invalide.
  const champEstMetal = s % 2 === 0;
  const paletteChamp = champEstMetal ? METAUX : COULEURS;
  const paletteMeuble = champEstMetal ? COULEURS : METAUX;

  const champ = pick(paletteChamp, s, 1);
  const champ2 = pick(paletteChamp.filter((c) => c !== champ), s, 2) ?? champ;
  const meuble = pick(paletteMeuble, s, 3);
  const piece = pick(paletteMeuble, s, 4);

  const forme = pick(FORMES, s, 5);
  const partition = pick(PARTITIONS, s, 6);
  const pieceDef = pick(PIECES, s, 7);
  const meubleDef = pick(MEUBLES, s, 8);

  // Un id unique par instance : deux blasons sur la même page se rogneraient
  // mutuellement s'ils partageaient le même clipPath.
  const clipId = `ecu-${s.toString(36)}`;

  return (
    <svg
      viewBox="0 0 100 115"
      width={size}
      height={Math.round(size * 1.15)}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={forme} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="-5" y="-5" width="110" height="125" fill={champ} />
        {partition.render(champ, champ2)}
        {pieceDef.render(piece)}
        <g transform="translate(50 57)">{meubleDef.render(meuble)}</g>
      </g>

      {/* Contour tracé par-dessus, jamais rogné */}
      <path d={forme} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

/** Description héraldique du blason — utile en infobulle et pour les tests. */
export function blasonDescription(seed: string): string {
  const s = hash(seed);
  const champEstMetal = s % 2 === 0;
  const noms = champEstMetal
    ? { champ: ['or', 'argent'], meuble: ['gueules', 'azur', 'sinople', 'sable', 'pourpre'] }
    : { champ: ['gueules', 'azur', 'sinople', 'sable', 'pourpre'], meuble: ['or', 'argent'] };

  const champ = pick(noms.champ, s, 1);
  const meuble = pick(noms.meuble, s, 3);
  const partition = pick(PARTITIONS, s, 6).nom;
  const piece = pick(PIECES, s, 7).nom;
  const charge = pick(MEUBLES, s, 8).nom;

  const parts = [`De ${champ}`];
  if (partition !== 'plain') parts.push(partition);
  if (piece !== 'aucune') parts.push(`à la ${piece}`);
  parts.push(`chargé d'un(e) ${charge} de ${meuble}`);
  return parts.join(', ');
}
