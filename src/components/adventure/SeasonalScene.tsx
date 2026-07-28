"use client";

import React from 'react';
import Image from 'next/image';
import type { BoardTheme } from './boardThemes';
import { GROUND_COMPONENTS, WEATHER_COMPONENTS, THEME_FOXY } from './SceneArt';

/**
 * Décor vivant du plateau, façon Pokémon — 100% SVG maison :
 * - Météo saisonnière qui traverse le plateau (neige, pétales de sakura
 *   portés par le vent, feuilles d'érable, étincelles, confettis)
 * - Végétation/décor au sol dans le style des badges Workyt
 * - La mascotte Foxy de l'univers qui court périodiquement à travers
 */

// Positions déterministes des particules météo (évite les soucis d'hydratation)
const WEATHER_SPOTS = [
  { left: '4%' }, { left: '12%' }, { left: '21%' }, { left: '29%' },
  { left: '38%' }, { left: '47%' }, { left: '55%' }, { left: '63%' },
  { left: '71%' }, { left: '79%' }, { left: '87%' }, { left: '94%' }
];

export default function SeasonalScene({ theme }: { theme: BoardTheme }) {
  const { scene } = theme;
  const WeatherComp = scene.weather !== 'none' ? WEATHER_COMPONENTS[scene.weather] : null;
  const foxySrc = THEME_FOXY[theme.id] || THEME_FOXY.default;

  // La météo : la neige et les feuilles TOMBENT, les pétales DÉRIVENT de gauche à droite
  const isDrift = scene.weather === 'petals' || scene.weather === 'sparkles' || scene.weather === 'confetti';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden>
      {/* --- Météo --- */}
      {WeatherComp && WEATHER_SPOTS.map((spot, i) => (
        <span
          key={i}
          className={`absolute ${isDrift ? 'adventure-drift-x' : 'adventure-fall'}`}
          style={{
            left: spot.left,
            top: isDrift ? `${8 + (i * 23) % 55}%` : '-24px',
            animationDuration: `${7 + (i * 1.7) % 8}s`,
            animationDelay: `${i * 1.1}s`,
            opacity: 0.55
          }}
        >
          <WeatherComp
            style={{ width: 12 + (i % 3) * 5, height: 12 + (i % 3) * 5 }}
            color={scene.weather === 'petals' ? '#F9A8D4' : scene.weather === 'leaves' ? '#FB923C' : undefined}
          />
        </span>
      ))}

      {/* --- Sol : végétation & décor dans le style Workyt --- */}
      <div className="absolute bottom-1 inset-x-2 flex items-end justify-between">
        {scene.ground.map((art, i) => {
          const Comp = GROUND_COMPONENTS[art];
          const size = ['pine', 'sakura', 'palm', 'snowman', 'bamboo', 'maple'].includes(art) ? 42 : 26;
          return (
            <span key={i} className="adventure-sway" style={{ animationDelay: `${i * 0.6}s` }}>
              <Comp style={{ width: size, height: size }} />
            </span>
          );
        })}
      </div>

      {/* --- Foxy qui court à travers le plateau (façon Pokémon) --- */}
      <div className="adventure-run absolute" style={{ top: '62%' }}>
        <div className="adventure-bob">
          <Image
            src={foxySrc}
            alt=""
            width={56}
            height={56}
            className="rounded-full border-2 border-white shadow-lg object-cover"
          />
        </div>
      </div>
    </div>
  );
}
