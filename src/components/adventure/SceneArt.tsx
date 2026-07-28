"use client";

import React from 'react';

/**
 * Illustrations SVG sur mesure pour le décor du Plateau de l'Aventure.
 * Style inspiré des badges et de la mascotte Workyt : formes flat,
 * contours épais foncés, couleurs vives, arrondis kawaii.
 * Aucun emoji, aucune image externe.
 */

const INK = '#3A2E2E';

interface ArtProps {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

/* ---------- Végétation & décor au sol ---------- */

export function FlowerArt({ className, style, color = '#F472B6' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M32 34 C 30 44, 30 52, 31 60" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M31 50 C 26 48, 22 48, 19 51" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <g stroke={INK} strokeWidth="3.5" fill={color}>
        <circle cx="32" cy="16" r="7" />
        <circle cx="42" cy="24" r="7" />
        <circle cx="37" cy="35" r="7" />
        <circle cx="27" cy="35" r="7" />
        <circle cx="22" cy="24" r="7" />
      </g>
      <circle cx="32" cy="26" r="6.5" fill="#FDE047" stroke={INK} strokeWidth="3.5" />
    </svg>
  );
}

export function GrassArt({ className, style, color = '#4ADE80' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
        <path d="M18 58 C 17 46, 19 38, 24 32" />
        <path d="M32 58 C 32 44, 34 34, 40 28" />
        <path d="M46 58 C 47 48, 49 42, 54 37" />
      </g>
      <g fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 58 C 17 46, 19 38, 24 32" />
        <path d="M32 58 C 32 44, 34 34, 40 28" />
        <path d="M46 58 C 47 48, 49 42, 54 37" />
      </g>
    </svg>
  );
}

export function PineArt({ className, style, color = '#16A34A' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <rect x="28" y="48" width="8" height="12" rx="2" fill="#8D6E63" stroke={INK} strokeWidth="3.5" />
      <g fill={color} stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
        <path d="M32 4 L44 22 L20 22 Z" />
        <path d="M32 14 L48 36 L16 36 Z" />
        <path d="M32 26 L52 50 L12 50 Z" />
      </g>
      <circle cx="32" cy="10" r="3" fill="#FDE047" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}

export function SakuraArt({ className, style, color = '#F9A8D4' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M30 60 C 31 48, 30 40, 27 32 M34 60 C 33 50, 35 44, 38 38" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      <g fill={color} stroke={INK} strokeWidth="3.5">
        <circle cx="24" cy="24" r="11" />
        <circle cx="40" cy="20" r="12" />
        <circle cx="36" cy="34" r="10" />
      </g>
      <circle cx="33" cy="26" r="4" fill="#FDE68A" opacity="0.7" />
    </svg>
  );
}

export function PalmArt({ className, style, color = '#22C55E' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M34 60 C 32 48, 30 38, 26 28" fill="none" stroke="#8D6E63" strokeWidth="6" strokeLinecap="round" />
      <path d="M34 60 C 32 48, 30 38, 26 28" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" opacity="0.25" />
      <g fill={color} stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
        <path d="M26 28 C 18 20, 10 18, 4 22 C 12 24, 18 28, 24 32 Z" />
        <path d="M26 28 C 24 18, 20 12, 12 10 C 18 16, 22 22, 25 30 Z" />
        <path d="M26 28 C 30 16, 36 10, 44 10 C 38 16, 32 22, 28 30 Z" />
        <path d="M26 28 C 36 22, 46 20, 54 26 C 44 26, 34 28, 28 32 Z" />
      </g>
      <circle cx="27" cy="30" r="4" fill="#A16207" stroke={INK} strokeWidth="3" />
    </svg>
  );
}

export function GiftArt({ className, style, color = '#EF4444' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <rect x="10" y="26" width="44" height="32" rx="4" fill={color} stroke={INK} strokeWidth="4" />
      <rect x="28" y="26" width="8" height="32" fill="#FDE047" stroke={INK} strokeWidth="3" />
      <rect x="8" y="20" width="48" height="10" rx="3" fill={color} stroke={INK} strokeWidth="4" />
      <path d="M32 20 C 24 20, 20 12, 26 10 C 31 8, 32 16, 32 20 C 32 16, 33 8, 38 10 C 44 12, 40 20, 32 20 Z" fill="#FDE047" stroke={INK} strokeWidth="3.5" />
    </svg>
  );
}

export function LanternArt({ className, style, color = '#EF4444' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <line x1="32" y1="4" x2="32" y2="12" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <rect x="22" y="12" width="20" height="6" rx="3" fill="#FDE047" stroke={INK} strokeWidth="3.5" />
      <ellipse cx="32" cy="34" rx="18" ry="18" fill={color} stroke={INK} strokeWidth="4" />
      <path d="M22 20 C 20 30, 20 38, 22 48 M42 20 C 44 30, 44 38, 42 48 M32 18 L32 50" fill="none" stroke={INK} strokeWidth="2.5" opacity="0.5" />
      <rect x="24" y="48" width="16" height="6" rx="3" fill="#FDE047" stroke={INK} strokeWidth="3.5" />
    </svg>
  );
}

export function DiyaArt({ className, style, color = '#F59E0B' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M10 38 C 10 50, 20 56, 32 56 C 44 56, 54 50, 54 38 Z" fill={color} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M32 36 C 28 30, 30 24, 32 18 C 34 24, 36 30, 32 36 Z" fill="#FDE047" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="32" cy="14" r="3" fill="#FB923C" />
    </svg>
  );
}

export function MapleArt({ className, style, color = '#F97316' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M32 6 L38 20 L52 16 L44 30 L56 36 L42 42 L46 56 L32 48 L18 56 L22 42 L8 36 L20 30 L12 16 L26 20 Z"
        fill={color} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M32 48 L32 60" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function BambooArt({ className, style, color = '#22C55E' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <g stroke={INK} strokeWidth="3.5" fill={color}>
        <rect x="18" y="10" width="9" height="50" rx="4" />
        <rect x="36" y="4" width="9" height="56" rx="4" />
      </g>
      <g stroke={INK} strokeWidth="3">
        <line x1="18" y1="28" x2="27" y2="28" />
        <line x1="18" y1="44" x2="27" y2="44" />
        <line x1="36" y1="22" x2="45" y2="22" />
        <line x1="36" y1="40" x2="45" y2="40" />
      </g>
      <path d="M27 14 C 34 12, 38 8, 40 4 C 34 6, 29 8, 27 14 Z" fill={color} stroke={INK} strokeWidth="3" />
    </svg>
  );
}

export function SnowmanArt({ className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <circle cx="32" cy="44" r="16" fill="#F8FAFC" stroke={INK} strokeWidth="4" />
      <circle cx="32" cy="20" r="11" fill="#F8FAFC" stroke={INK} strokeWidth="4" />
      <path d="M34 20 L42 22 L34 24 Z" fill="#F97316" stroke={INK} strokeWidth="2.5" />
      <circle cx="28" cy="17" r="1.8" fill={INK} />
      <circle cx="36" cy="17" r="1.8" fill={INK} />
      <circle cx="32" cy="38" r="2.2" fill={INK} />
      <circle cx="32" cy="46" r="2.2" fill={INK} />
      <path d="M16 38 L6 32 M48 38 L58 32" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Particules météo ---------- */

export function SnowflakeArt({ className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <g stroke="#7DD3FC" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M32 6 L32 58" />
        <path d="M9 19 L55 45" />
        <path d="M55 19 L9 45" />
      </g>
      <circle cx="32" cy="32" r="5" fill="#E0F2FE" />
    </svg>
  );
}

export function PetalArt({ className, style, color = '#F9A8D4' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M32 8 C 48 16, 52 36, 40 50 C 30 58, 16 52, 14 40 C 12 26, 20 12, 32 8 Z"
        fill={color} stroke={INK} strokeWidth="3" opacity="0.9" />
      <path d="M32 12 C 36 26, 34 40, 28 50" fill="none" stroke={INK} strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

export function LeafArt({ className, style, color = '#FB923C' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M12 52 C 12 28, 28 12, 52 12 C 52 36, 36 52, 12 52 Z"
        fill={color} stroke={INK} strokeWidth="3" />
      <path d="M16 48 C 24 36, 36 24, 48 16" fill="none" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}

export function SparkleArt({ className, style, color = '#FDE047' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M32 4 L38 26 L60 32 L38 38 L32 60 L26 38 L4 32 L26 26 Z"
        fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function ConfettiArt({ className, style, color = '#F472B6' }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <rect x="22" y="10" width="20" height="10" rx="3" fill={color} stroke={INK} strokeWidth="3" transform="rotate(24 32 15)" />
      <rect x="18" y="36" width="16" height="8" rx="3" fill="#60A5FA" stroke={INK} strokeWidth="3" transform="rotate(-18 26 40)" />
      <circle cx="46" cy="42" r="6" fill="#FDE047" stroke={INK} strokeWidth="3" />
    </svg>
  );
}

/* ---------- Registres ---------- */

import type { GroundArt, WeatherArt } from './boardThemes';

export const GROUND_COMPONENTS: Record<GroundArt, (props: ArtProps) => React.JSX.Element> = {
  flower: FlowerArt,
  grass: GrassArt,
  pine: PineArt,
  sakura: SakuraArt,
  palm: PalmArt,
  gift: GiftArt,
  lantern: LanternArt,
  diya: DiyaArt,
  maple: MapleArt,
  bamboo: BambooArt,
  snowman: SnowmanArt
};

export const WEATHER_COMPONENTS: Record<Exclude<WeatherArt, 'none'>, (props: ArtProps) => React.JSX.Element> = {
  snow: SnowflakeArt,
  petals: PetalArt,
  leaves: LeafArt,
  sparkles: SparkleArt,
  confetti: ConfettiArt
};

/** Foxy de chaque univers (mascotte officielle qui court sur le plateau) */
export const THEME_FOXY: Record<string, string> = {
  default: '/profile/FoxyWaterMelon.webp',
  christmas: '/profile/FoxyHallo.webp',
  newyear: '/profile/FoxyMecha.webp',
  chinese_newyear: '/profile/FoxyFrenchies.webp',
  eastern: '/profile/FoxySably.webp',
  indian: '/profile/FoxyYumego.webp',
  japanese: '/profile/FoxyPink.webp',
  canadian: '/profile/FoxyWaMe.webp',
  french_civil: '/profile/FoxyFrenchies.webp',
  french_cultural: '/profile/FoxyFrenchies.webp'
};
