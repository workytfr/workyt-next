import React from 'react';
import type { DecoratedThemeId } from '@/lib/clanThemes';
import { INK, W, TOP, GROUND } from './castleGeometry';

/**
 * Décors saisonniers du château (voir lib/clanThemes).
 *
 * Deux calques par thème :
 *  - le CIEL, dessiné derrière le château (lune, soleil, nuages, guirlandes…) ;
 *  - l'AVANT-PLAN, devant (citrouilles, neige qui tombe, confettis…), qui ne
 *    capte aucun clic : les portes cliquables sont dessous.
 *
 * Même repère que ClanCastle (viewBox 320 de large, sol à 180, haut à -36) et
 * même charte : formes plates, contour à l'encre. Les deux calques sont
 * découpés à la vignette du ciel (`${uid}-skyclip`, définie par ClanCastle).
 */


/* -------------------------------------------------------------- animations */

/** Animations des décors, à poser dans le <style> du château. */
export function decorStyles(uid: string): string {
  return `
    @keyframes ${uid}-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .${uid}-float { animation: ${uid}-float 3.2s ease-in-out infinite; }
    @keyframes ${uid}-flap { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.45); } }
    .${uid}-flap { animation: ${uid}-flap .35s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes ${uid}-drift { 0%,100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
    .${uid}-drift { animation: ${uid}-drift 7s ease-in-out infinite; }
    @keyframes ${uid}-glow { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
    .${uid}-glow { animation: ${uid}-glow 2.2s ease-in-out infinite; }
    @keyframes ${uid}-fall {
      0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
      8%, 85% { opacity: 1; }
      100% { transform: translate(var(--dx), 215px) rotate(320deg); opacity: 0; }
    }
    .${uid}-fall { animation: ${uid}-fall 8s linear infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes ${uid}-burst {
      0% { transform: scale(.2); opacity: 0; }
      15% { opacity: 1; }
      60% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.15); opacity: 0; }
    }
    .${uid}-burst { animation: ${uid}-burst 2.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes ${uid}-spin { to { transform: rotate(360deg); } }
    .${uid}-spin { animation: ${uid}-spin 40s linear infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes ${uid}-sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
    .${uid}-sway { animation: ${uid}-sway 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center top; }
    @media (prefers-reduced-motion: reduce) {
      .${uid}-float, .${uid}-flap, .${uid}-drift, .${uid}-glow,
      .${uid}-burst, .${uid}-spin, .${uid}-sway { animation: none; }
      /* Sans mouvement, chaque particule reste figée à sa hauteur de repos */
      .${uid}-fall { animation: none; transform: translateY(var(--rest)); }
    }
  `;
}

/* ------------------------------------------------------------------ outils */

/** Hasard déterministe : même décor côté serveur et côté client. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Particules qui tombent du haut du ciel (feuilles, neige, pétales, confettis). */
function Falling({
  uid, seed, count, render
}: {
  uid: string;
  seed: number;
  count: number;
  render: (i: number, s: number) => React.ReactNode;
}) {
  const rnd = rng(seed);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = r2(rnd() * W);
        const y = r2(TOP + rnd() * 24);
        const dur = r2(6 + rnd() * 5);
        const delay = r2(-rnd() * dur);
        const style = {
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          '--dx': `${r2((rnd() - 0.5) * 50)}px`,
          '--rest': `${r2(10 + rnd() * 175)}px`
        } as React.CSSProperties;
        const s = r2(0.7 + rnd() * 0.6);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g className={`${uid}-fall`} style={style}>{render(i, s)}</g>
          </g>
        );
      })}
    </g>
  );
}

function Cloud({ x, y, s = 1, fill = '#ffffff' }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M-16,5 a6,6 0 0,1 3,-11 a9,9 0 0,1 16,-4 a7,7 0 0,1 12,6 a6,6 0 0,1 1,9 z"
      fill={fill}
      stroke={INK}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}

/** Soleil : rayons qui tournent lentement autour du disque. */
function Sun({ x, y, r = 15, uid }: { x: number; y: number; r?: number; uid: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`${uid}-spin`} stroke="#ffb547" strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i * Math.PI) / 5;
          return (
            <line key={i}
              x1={r2(Math.cos(a) * (r + 4))} y1={r2(Math.sin(a) * (r + 4))}
              x2={r2(Math.cos(a) * (r + 10))} y2={r2(Math.sin(a) * (r + 10))} />
          );
        })}
      </g>
      <circle r={r} fill="#ffd166" stroke={INK} strokeWidth="2.5" />
    </g>
  );
}

/** Oiseau lointain : un « v » à l'encre. */
function Bird({ x, y, s = 1, uid, color = INK }: { x: number; y: number; s?: number; uid: string; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className={`${uid}-flap`} d="M-7,-2 q3.5,-3 7,1 q3.5,-4 7,-1" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Stars({ uid, points, color = '#fff1c7' }: { uid: string; points: number[][]; color?: string }) {
  return (
    <g fill={color}>
      {points.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={i % 3 === 0 ? 1.8 : 1.2} className={i % 2 ? `${uid}-glow` : undefined} />
      ))}
    </g>
  );
}

/** Brume au ras du sol. */
function Mist({ uid, opacity = 0.4 }: { uid: string; opacity?: number }) {
  return (
    <g className={`${uid}-drift`} fill="#fdfaf4" opacity={opacity}>
      <ellipse cx="40" cy={GROUND - 1} rx="46" ry="5" />
      <ellipse cx="160" cy={GROUND + 1} rx="54" ry="4.5" />
      <ellipse cx="280" cy={GROUND - 1} rx="46" ry="5" />
    </g>
  );
}

/** Emplacements au pied des murs, entre les châtelets et aux deux bouts. */
const FOOT = [4, 107.5, 212.5, 316];

/* --------------------------------------------------------------- Halloween */

/** Chauve-souris : ailes qui battent, liseré clair pour se détacher du ciel. */
function Bat({ x, y, s = 1, cls }: { x: number; y: number; s?: number; cls: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        className={cls}
        d="M0,0 C-3,-5 -9,-7 -14,-4 C-11,-3 -10,-1 -10,1 C-8,-1 -5,-1 -4,1 C-2,0 -1,1 0,3 C1,1 2,0 4,1 C5,-1 8,-1 10,1 C10,-1 11,-3 14,-4 C9,-7 3,-5 0,0 Z"
        fill={INK}
        stroke="#b9a4dc"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** Citrouille sculptée, posée sur le sol ; le visage luit doucement. */
function Pumpkin({ x, s = 1, cls }: { x: number; s?: number; cls: string }) {
  return (
    <g transform={`translate(${x} ${GROUND - 7 * s}) scale(${s})`}>
      <path d="M0,-8 q1,-4 4,-5" stroke="#4f7a2a" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <ellipse cx="0" cy="0" rx="11" ry="8.5" fill="#ff7a1a" stroke={INK} strokeWidth="2.5" />
      <path d="M0,-8 v16 M-5,-8 q-3,8 0,16 M5,-8 q3,8 0,16" stroke={INK} strokeWidth="1.3" opacity="0.3" fill="none" />
      <g className={cls} fill="#ffe08a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round">
        <path d="M-6.5,-1 l2.5,-4 l2.5,4 z" />
        <path d="M1.5,-1 l2.5,-4 l2.5,4 z" />
        <path d="M-6,2.5 q6,5 12,0 l-2,1.2 l-2,-1 l-2,1.2 l-2,-1 l-2,1.2 z" />
      </g>
    </g>
  );
}

function HalloweenSky({ uid }: { uid: string }) {
  return (
    <>
      <Stars uid={uid} points={[[100, -14], [232, -24], [292, -6], [258, 24], [14, 46], [306, 62], [84, 32], [204, 6]]} />
      {/* Pleine lune, ses cratères et son halo */}
      <circle cx="44" cy="4" r="26" fill="#fff1c7" opacity="0.12" />
      <circle cx="44" cy="4" r="17" fill="#fff1c7" stroke={INK} strokeWidth="2.5" />
      <g fill="#e8d59c">
        <circle cx="38" cy="-1" r="3.5" />
        <circle cx="50" cy="9" r="2.6" />
        <circle cx="49" cy="-4" r="1.6" />
      </g>
      <Bat x={52} y={0} s={0.8} cls={`${uid}-flap`} />
      <Bat x={96} y={-24} s={0.6} cls={`${uid}-flap`} />
      <Bat x={244} y={-12} s={0.7} cls={`${uid}-flap`} />
      {/* Fantôme, entre les tourelles du châtelet de droite */}
      <g transform="translate(265 18)">
        <g className={`${uid}-float`}>
          <path
            d="M-8,9 V-2 a8,8 0 0,1 16,0 V9 l-2.7,-3 l-2.6,3 l-2.7,-3 l-2.7,3 l-2.6,-3 z"
            fill="#fdfaf4"
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse cx="-2.8" cy="-1.5" rx="1.4" ry="2" fill={INK} />
          <ellipse cx="2.8" cy="-1.5" rx="1.4" ry="2" fill={INK} />
          <ellipse cx="0" cy="3" rx="1.6" ry="1.2" fill={INK} />
        </g>
      </g>
    </>
  );
}

function HalloweenFront({ uid }: { uid: string }) {
  return (
    <>
      {FOOT.map((x, i) => <Pumpkin key={x} x={x} s={i % 3 === 0 ? 0.9 : 0.8} cls={`${uid}-glow`} />)}
      <Mist uid={uid} />
    </>
  );
}

/* ----------------------------------------------------------------- Automne */

const LEAF_COLORS = ['#e0712c', '#c9452b', '#e8a33a', '#8f5a2b'];

function Leaf({ color, s = 1 }: { color: string; s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M0,-5 C4,-4 5,1 0,5 C-5,1 -4,-4 0,-5 Z" fill={color} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M0,-4 V4" stroke={INK} strokeWidth="0.8" opacity="0.5" />
    </g>
  );
}

function AutomneSky({ uid }: { uid: string }) {
  return (
    <>
      {/* Soleil bas d'automne, à demi voilé */}
      <circle cx="272" cy="8" r="24" fill="#ffd59a" opacity="0.35" />
      <circle cx="272" cy="8" r="16" fill="#ffc77a" stroke={INK} strokeWidth="2.5" />
      <Cloud x={262} y={22} s={0.9} fill="#fdf3e6" />
      <Cloud x={52} y={-6} s={1.1} fill="#fdf3e6" />
      {/* Un vol d'oiseaux migrateurs */}
      <Bird x={78} y={20} s={0.9} uid={uid} />
      <Bird x={94} y={12} s={0.75} uid={uid} />
      <Bird x={108} y={22} s={0.7} uid={uid} />
    </>
  );
}

function AutomneFront({ uid }: { uid: string }) {
  return (
    <>
      {/* Tas de feuilles au pied des murs */}
      {FOOT.map((x, k) => (
        <g key={x} transform={`translate(${x} ${GROUND - 2})`}>
          {[-6, 0, 6, -3, 3].map((dx, i) => (
            <g key={i} transform={`translate(${dx} ${i > 2 ? -4 : 0}) rotate(${(i * 47 + k * 31) % 180})`}>
              <Leaf color={LEAF_COLORS[(i + k) % LEAF_COLORS.length]} s={0.85} />
            </g>
          ))}
        </g>
      ))}
      <Falling uid={uid} seed={11} count={14} render={(i, s) => <Leaf color={LEAF_COLORS[i % LEAF_COLORS.length]} s={s} />} />
      <Mist uid={uid} opacity={0.3} />
    </>
  );
}

/* ------------------------------------------------------------------- Hiver */

function Snowman({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      <circle cy="-7" r="7.5" fill="#ffffff" stroke={INK} strokeWidth="2" />
      <circle cy="-18" r="5.5" fill="#ffffff" stroke={INK} strokeWidth="2" />
      <path d="M-4,-23 h8 M-2.5,-23 v-5 h5 v5" fill={INK} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="-2" cy="-19" r="0.9" fill={INK} />
      <circle cx="2" cy="-19" r="0.9" fill={INK} />
      <path d="M0,-17 l5,1 l-5,1 z" fill="#ff7a1a" />
      <path d="M-5,-13 h10" stroke="#e5484d" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

function SnowyPine({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      <rect x="-1.5" y="-5" width="3" height="5" fill="#8b5a2b" />
      <path d="M0,-30 L8,-17 L5,-17 L10,-5 L-10,-5 L-5,-17 L-8,-17 Z" fill="#3f8a5a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M0,-30 L4,-24 L-4,-24 Z M-6,-16 q6,3 12,0" fill="#ffffff" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );
}

function HiverSky() {
  return (
    <>
      <Cloud x={48} y={-6} s={1.2} />
      <Cloud x={92} y={18} s={0.8} />
      <Cloud x={262} y={-10} s={1.1} />
      <Cloud x={292} y={22} s={0.7} />
    </>
  );
}

function HiverFront({ uid }: { uid: string }) {
  return (
    <>
      {/* Congères au pied des murs */}
      <g fill="#ffffff" stroke="#9fc6d9" strokeWidth="1.2">
        <ellipse cx="60" cy={GROUND + 1} rx="30" ry="4" />
        <ellipse cx="160" cy={GROUND + 2} rx="36" ry="4" />
        <ellipse cx="262" cy={GROUND + 1} rx="30" ry="4" />
      </g>
      <SnowyPine x={4} s={0.8} />
      <Snowman x={107.5} s={0.85} />
      <Snowman x={212.5} s={0.85} />
      <SnowyPine x={316} s={0.8} />
      <Falling uid={uid} seed={23} count={26} render={(_, s) => (
        <circle r={r2(1.6 * s + 0.4)} fill="#ffffff" stroke="#9fc6d9" strokeWidth="0.8" />
      )} />
    </>
  );
}

/* --------------------------------------------------------------- Nouvel An */

/** Gerbe de feu d'artifice : rayons qui éclosent puis s'éteignent. */
function Firework({ x, y, color, r = 13, delay = 0, uid }: { x: number; y: number; color: string; r?: number; delay?: number; uid: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`${uid}-burst`} style={{ animationDelay: `${delay}s` }}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i * Math.PI) / 5;
          return (
            <g key={i}>
              <line
                x1={r2(Math.cos(a) * r * 0.35)} y1={r2(Math.sin(a) * r * 0.35)}
                x2={r2(Math.cos(a) * r)} y2={r2(Math.sin(a) * r)}
                stroke={color} strokeWidth="2" strokeLinecap="round"
              />
              <circle cx={r2(Math.cos(a) * (r + 3))} cy={r2(Math.sin(a) * (r + 3))} r="1.4" fill={color} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function NouvelAnSky({ uid }: { uid: string }) {
  return (
    <>
      {/* Aurore boréale : deux voiles qui ondulent */}
      <g className={`${uid}-drift`}>
        <path d={`M-6,30 C40,0 90,40 140,8 C190,-20 250,26 ${W + 6},-4 V14 C250,44 190,0 140,28 C90,58 40,18 -6,48 Z`} fill="#5ee6a8" opacity="0.22" />
        <path d={`M-6,10 C50,-16 100,22 160,-8 C220,-34 270,8 ${W + 6},-20 V-6 C270,22 220,-18 160,6 C100,34 50,-2 -6,24 Z`} fill="#b18cff" opacity="0.2" />
      </g>
      <Stars uid={uid} points={[[18, -20], [110, -26], [212, -28], [304, 4], [12, 52], [308, 58], [96, 40], [236, 40]]} />
      <Firework x={52} y={2} color="#ffb547" uid={uid} />
      <Firework x={272} y={-6} color="#ff6aa2" r={15} delay={1.1} uid={uid} />
      <Firework x={236} y={32} color="#6ec1e4" r={9} delay={0.6} uid={uid} />
      <Firework x={92} y={34} color="#7ed957" r={9} delay={1.8} uid={uid} />
    </>
  );
}

function NouvelAnFront({ uid }: { uid: string }) {
  // Quelques paillettes dorées qui retombent
  return (
    <Falling uid={uid} seed={37} count={14} render={(i, s) => (
      <path transform={`scale(${s})`} d="M0,-3 L0.9,-0.9 L3,0 L0.9,0.9 L0,3 L-0.9,0.9 L-3,0 L-0.9,-0.9 Z" fill={i % 2 ? '#ffd166' : '#fff1c7'} />
    )} />
  );
}

/* ---------------------------------------------------------------- Carnaval */

/*
 * Une fête médiévale plutôt qu'une fête foraine : pavillons de tournoi rayés
 * au pied des murs, oriflammes et fanions accrochés au château lui-même
 * (castleOrnaments), quelques confettis. Pas de ballons ni de guirlandes
 * suspendues dans le vide.
 */

const FESTIVE = ['#e5484d', '#ffb547', '#6ec1e4', '#7ed957', '#c084fc', '#ec4899'];

/** Pavillon de tournoi : tente ronde à rayures, toit conique et fanion. */
function Pavilion({ x, colors, s = 1 }: { x: number; colors: [string, string]; s?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      {/* Pans de toile rayés */}
      <path d="M-11,0 V-12 H11 V0 Z" fill={colors[1]} />
      <path d="M-11,0 V-12 H-6.6 V0 Z M-2.2,0 V-12 H2.2 V0 Z M6.6,0 V-12 H11 V0 Z" fill={colors[0]} />
      <path d="M-11,0 V-12 H11 V0 Z" fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Entrée relevée */}
      <path d="M-3,0 L0,-8 L3,0 Z" fill={INK} opacity="0.75" />
      {/* Toit conique et festons */}
      <path d="M-13,-12 L0,-26 L13,-12 Z" fill={colors[0]} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-13,-12 q2.2,3 4.3,0 q2.2,3 4.3,0 q2.2,3 4.4,0 q2.2,3 4.3,0 q2.2,3 4.3,0 q2.2,3 4.4,0" fill={colors[1]} stroke={INK} strokeWidth="1.2" />
      <line x1="0" y1="-26" x2="0" y2="-34" stroke={INK} strokeWidth="1.4" />
      <path d="M0,-34 l6,2 l-6,2 z" fill={colors[1]} stroke={INK} strokeWidth="1" />
    </g>
  );
}

function CarnavalSky({ uid }: { uid: string }) {
  return (
    <>
      <Cloud x={50} y={-8} s={1.1} fill="#fffaf2" />
      <Cloud x={272} y={-14} s={1} fill="#fffaf2" />
      <Bird x={86} y={16} s={0.8} uid={uid} />
      <Bird x={236} y={12} s={0.7} uid={uid} />
    </>
  );
}

function CarnavalFront({ uid }: { uid: string }) {
  return (
    <>
      <Pavilion x={107.5} colors={['#e5484d', '#fdfaf4']} s={0.85} />
      <Pavilion x={212.5} colors={['#6ec1e4', '#ffd166']} s={0.85} />
      <Falling uid={uid} seed={53} count={14} render={(i, s) => (
        <rect x="-2" y="-1.2" width={r2(4 * s)} height="2.4" rx="0.6" fill={FESTIVE[i % FESTIVE.length]} />
      )} />
    </>
  );
}

/* --------------------------------------------------------------- Printemps */

function Flower({ x, color, s = 1 }: { x: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      <path d="M0,0 V-10 M0,-4 q-4,-2 -5,-5" stroke="#3f8a1f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <g transform="translate(0 -13)" stroke={INK} strokeWidth="1.2">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cy="-3.2" rx="2.2" ry="3" fill={color} transform={`rotate(${a})`} />
        ))}
        <circle r="1.8" fill="#ffd166" />
      </g>
    </g>
  );
}

function Butterfly({ x, y, color, uid }: { x: number; y: number; color: string; uid: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`${uid}-float`}>
        <g className={`${uid}-flap`}>
          <path d="M0,0 C-6,-8 -10,-2 -6,2 C-9,6 -3,8 0,2 C3,8 9,6 6,2 C10,-2 6,-8 0,0 Z" fill={color} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
}

function PrintempsSky({ uid }: { uid: string }) {
  return (
    <>
      <Sun x={46} y={4} uid={uid} />
      <Cloud x={262} y={-8} s={1.1} />
      <Cloud x={296} y={20} s={0.7} />
      <Butterfly x={98} y={26} color="#f9a8d4" uid={uid} />
      <Butterfly x={236} y={30} color="#fde047" uid={uid} />
    </>
  );
}

function PrintempsFront({ uid }: { uid: string }) {
  const colors = ['#f472b6', '#ffffff', '#c084fc', '#fde047'];
  return (
    <>
      {FOOT.flatMap((x, k) => [
        <Flower key={`${x}a`} x={x - 4} color={colors[k % 4]} s={0.8} />,
        <Flower key={`${x}b`} x={x + 4} color={colors[(k + 1) % 4]} s={0.65} />
      ])}
      <Falling uid={uid} seed={71} count={18} render={(_, s) => (
        <ellipse rx={r2(2.6 * s)} ry={r2(1.7 * s)} fill="#f9a8d4" stroke="#db2777" strokeWidth="0.6" />
      )} />
    </>
  );
}

/* ---------------------------------------------------------------- Examens */

function BookStack({ x, s = 1 }: { x: number; s?: number }) {
  const books = [
    { w: 22, c: '#6ec1e4' },
    { w: 18, c: '#e5484d' },
    { w: 20, c: '#7ed957' }
  ];
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      {books.map((b, i) => (
        <g key={i} transform={`translate(${i % 2 ? 1.5 : -1.5} ${-5.5 * (i + 1)})`}>
          <rect x={-b.w / 2} y="0" width={b.w} height="5.5" rx="1" fill={b.c} stroke={INK} strokeWidth="1.6" />
          <line x1={-b.w / 2 + 3} y1="2.75" x2={b.w / 2 - 3} y2="2.75" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

function ExamensSky({ uid }: { uid: string }) {
  return (
    <>
      {/* Page de cahier : lignes bleues et marge rouge */}
      <g stroke="#bcd6ee" strokeWidth="1">
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={-6} y1={TOP + 14 + i * 12} x2={W + 6} y2={TOP + 14 + i * 12} />
        ))}
      </g>
      <line x1="22" y1={TOP} x2="22" y2={GROUND} stroke="#f2a7a7" strokeWidth="1.6" />
      {/* Formules qui flottent au-dessus des remparts */}
      <g fill="#2f4f86" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontSize="11">
        <text x="34" y="-10" className={`${uid}-float`}>E = mc²</text>
        <text x="236" y="-16" className={`${uid}-float`} style={{ animationDelay: '0.7s' }}>a² + b² = c²</text>
        <text x="58" y="30" fontSize="10" className={`${uid}-float`} style={{ animationDelay: '1.3s' }}>π ≈ 3,14</text>
        <text x="250" y="30" fontSize="10" className={`${uid}-float`} style={{ animationDelay: '0.3s' }}>√2</text>
      </g>
      {/* Avion en papier */}
      <g transform="translate(272 6)">
        <g className={`${uid}-float`} style={{ animationDelay: '0.5s' }}>
          <path d="M-10,2 L10,-6 L2,6 L0,1 Z" fill="#ffffff" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10,-6 L0,1" stroke={INK} strokeWidth="1.2" />
        </g>
      </g>
    </>
  );
}

function ExamensFront() {
  return (
    <>
      {FOOT.map((x, i) => <BookStack key={x} x={x} s={i % 3 === 0 ? 0.75 : 0.65} />)}
      {/* Un crayon oublié au pied du donjon */}
      <g transform={`translate(160 ${GROUND + 3}) rotate(-8)`}>
        <rect x="-14" y="-2.5" width="24" height="5" rx="1" fill="#ffd166" stroke={INK} strokeWidth="1.4" />
        <path d="M10,-2.5 L16,0 L10,2.5 Z" fill="#f3d9b1" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="-17" y="-2.5" width="3" height="5" fill="#f9a8d4" stroke={INK} strokeWidth="1.4" />
      </g>
    </>
  );
}

/* --------------------------------------------------------------------- Été */

/*
 * Un fort côtier : la mer au loin derrière les remparts, un navire au
 * mouillage, et au pied des murs le butin des pirates (tonneaux, ancre,
 * coffre). Les canons et le pavillon noir sont sur le château
 * (castleOrnaments).
 */

const HORIZON = 64;

function PirateShip({ x, y, s = 1, uid }: { x: number; y: number; s?: number; uid: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={`${uid}-float`}>
        {/* Deux mâts, voiles carrées gonflées */}
        <line x1="-4" y1="0" x2="-4" y2="-26" stroke={INK} strokeWidth="1.6" />
        <line x1="7" y1="0" x2="7" y2="-20" stroke={INK} strokeWidth="1.6" />
        <path d="M-4,-26 l9,2.5 l-9,2.5 z" fill={INK} />
        <path d="M-11,-22 Q-4,-19 3,-22 Q4,-16 3,-11 Q-4,-14 -11,-11 Q-12,-16 -11,-22 Z" fill="#f3ead8" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M1,-17 Q7,-14 13,-17 Q14,-12 13,-8 Q7,-10 1,-8 Q0,-12 1,-17 Z" fill="#f3ead8" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        {/* Coque, avec sa ligne de sabords */}
        <path d="M-17,-2 L17,-2 L14,6 L-13,6 Z" fill="#7a4a24" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <line x1="-14" y1="1.5" x2="14" y2="1.5" stroke="#d9a35b" strokeWidth="1" />
        {[-9, -3, 3, 9].map((px) => <circle key={px} cx={px} cy="1.5" r="0.9" fill={INK} />)}
      </g>
    </g>
  );
}

function Barrel({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-5,0 Q-6.5,-5.5 -5,-11 H5 Q6.5,-5.5 5,0 Z" fill="#a0662f" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-5.8,-3 H5.8 M-5.8,-8 H5.8" stroke={INK} strokeWidth="1.2" />
    </g>
  );
}

function EteSky({ uid }: { uid: string }) {
  return (
    <>
      <Sun x={274} y={0} r={13} uid={uid} />
      <Cloud x={48} y={-14} s={1.05} />
      <Bird x={226} y={22} s={0.9} uid={uid} color="#fdfaf4" />
      <Bird x={244} y={32} s={0.7} uid={uid} color="#fdfaf4" />
      {/* La mer au loin : bande sombre à l'horizon, plus claire en approchant */}
      <rect x={-6} y={HORIZON} width={W + 12} height={GROUND - HORIZON} fill="#4fb3e3" />
      <rect x={-6} y={HORIZON} width={W + 12} height="5" fill="#2f86b3" />
      <g stroke="#e6f6fd" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M6,78 q4,-3 8,0 M40,86 q4,-3 8,0 M92,74 q4,-3 8,0 M222,80 q4,-3 8,0 M262,90 q4,-3 8,0 M300,76 q4,-3 8,0" />
      </g>
      <PirateShip x={50} y={HORIZON + 4} s={1.05} uid={uid} />
      {/* Une autre voile, très loin */}
      <path d={`M262,${HORIZON + 1} l4,-9 l4,9 z`} fill="#f3ead8" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
    </>
  );
}

function EteFront() {
  return (
    <>
      {/* Tonneaux de rhum entre les deux premiers châtelets */}
      <Barrel x={102} y={GROUND} s={0.8} />
      <Barrel x={112} y={GROUND} s={0.8} />
      <Barrel x={107} y={GROUND - 9} s={0.8} />
      {/* Coffre au trésor */}
      <g transform={`translate(212.5 ${GROUND})`}>
        <rect x="-8" y="-9" width="16" height="9" rx="1.5" fill="#a86a33" stroke={INK} strokeWidth="1.8" />
        <path d="M-8,-9 a8,5 0 0,1 16,0 Z" fill="#c98a4b" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="-1.5" y="-10" width="3" height="4" fill="#ffd166" stroke={INK} strokeWidth="1" />
        <circle cx="-4" cy="-11" r="1.6" fill="#ffd166" stroke={INK} strokeWidth="0.8" />
        <circle cx="3.5" cy="-12" r="1.6" fill="#ffd166" stroke={INK} strokeWidth="0.8" />
      </g>
      {/* Ancre posée contre la première tourelle */}
      <g transform={`translate(5 ${GROUND - 2})`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="0" cy="-17" r="2.2" />
        <path d="M0,-15 V0 M-4,-11 H4 M-6,-4 q6,7 12,0" />
      </g>
      {/* Cordage enroulé au pied de la dernière tourelle */}
      <g transform={`translate(314 ${GROUND - 2})`} fill="#d9b072" stroke={INK} strokeWidth="1.3">
        <ellipse rx="6" ry="2.6" />
        <ellipse cy="-2.4" rx="4.6" ry="2" />
        <ellipse cy="-4.4" rx="3" ry="1.4" />
      </g>
    </>
  );
}

/* ---------------------------------------------------------------- aiguillage */

const SKY: Record<DecoratedThemeId, (p: { uid: string }) => React.ReactNode> = {
  halloween: HalloweenSky,
  automne: AutomneSky,
  hiver: HiverSky,
  nouvel_an: NouvelAnSky,
  carnaval: CarnavalSky,
  printemps: PrintempsSky,
  examens: ExamensSky,
  ete: EteSky
};

const FRONT: Record<DecoratedThemeId, (p: { uid: string }) => React.ReactNode> = {
  halloween: HalloweenFront,
  automne: AutomneFront,
  hiver: HiverFront,
  nouvel_an: NouvelAnFront,
  carnaval: CarnavalFront,
  printemps: PrintempsFront,
  examens: ExamensFront,
  ete: EteFront
};

/** Calque du ciel, derrière le château. */
export function DecorSky({ id, uid }: { id: 'none' | DecoratedThemeId; uid: string }) {
  if (id === 'none') return null;
  const Sky = SKY[id];
  return (
    <g aria-hidden="true" clipPath={`url(#${uid}-skyclip)`}>
      <Sky uid={uid} />
    </g>
  );
}

/** Avant-plan, devant le château : ne capte aucun clic. */
export function DecorFront({ id, uid }: { id: 'none' | DecoratedThemeId; uid: string }) {
  if (id === 'none') return null;
  const Front = FRONT[id];
  return (
    <g aria-hidden="true" pointerEvents="none" clipPath={`url(#${uid}-skyclip)`}>
      <Front uid={uid} />
    </g>
  );
}
