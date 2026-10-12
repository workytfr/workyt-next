"use client";

import React from 'react';
import './profile-frames.css';
import { WORKYT_BIRD, WORKYT_BIRD_CENTER } from '@/lib/workytMark';

/**
 * Contours de profil animés, dessinés en SVG.
 *
 * Repère commun : l'origine (0,0) est le CENTRE de l'avatar, la boîte va de
 * -100 à 100. L'image occupe un disque de rayon 85 (profile.tsx la réduit à
 * 85 %) : l'anneau vit donc entre 86 et 100.
 *
 * ⚠️ RIEN NE DÉPASSE DU CERCLE DE RAYON 100. Le contour appartient à l'avatar,
 * il ne déborde ni sur le texte voisin ni sur l'avatar d'à côté. Le SVG a
 * exactement la taille de l'avatar et tout son contenu est découpé par un
 * cercle : c'est une garantie, pas une convention. Les ornements (couronne,
 * chapeau, bulle) se posent donc SUR l'anneau, quitte à mordre le bord de la
 * photo, et les flammes s'effacent avant le bord.
 *
 * Direction artistique — ce qui sépare un objet dessiné d'un clipart :
 *  - la LUMIÈRE plutôt que le contour : volumes en dégradés (un anneau est un
 *    tube, éclairé en haut à gauche), reflets, ombres douces, halos ;
 *  - des formes ORGANIQUES : effilées, irrégulières, jamais deux fois la même.
 *    L'aléatoire est tiré d'une graine fixe, le dessin est donc stable ;
 *  - un mouvement VIVANT : des particules qui naissent et meurent, chacune
 *    avec sa durée et son retard, plutôt que des objets qui tournent en bloc.
 *
 * Une forme pleine qui entoure l'avatar DOIT être percée (anneau en evenodd) :
 * sinon elle recouvre la photo.
 */

/** Rayon extérieur absolu : au-delà, tout est découpé. */
const EDGE = 100;

/* ------------------------------------------------------------ géométrie */

const rad = (deg: number) => (deg * Math.PI) / 180;
const r2 = (n: number) => Math.round(n * 100) / 100;
const pt = (r: number, deg: number): [number, number] => [r2(r * Math.cos(rad(deg))), r2(r * Math.sin(rad(deg)))];

/** Arc de cercle, de a0 à a1 degrés (0 = droite, 90 = bas). */
function arc(r: number, a0: number, a1: number): string {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`;
}

/** Disque complet. */
function disc(r: number): string {
  return `M${r},0 A${r},${r} 0 1,0 ${-r},0 A${r},${r} 0 1,0 ${r},0 Z`;
}

/** Anneau plein, à remplir en evenodd. */
const annulus = (rIn: number, rOut: number) => `${disc(rOut)} ${disc(rIn)}`;

/** Générateur pseudo-aléatoire à graine (mulberry32) : même graine, même dessin. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Branche effilée le long d'un arc : épaisse à la base, fine au bout,
 * légèrement sinueuse. Une forme pleine, pas un trait — c'est ce qui la rend
 * organique.
 */
function taperedArc(r: number, a0: number, a1: number, w0: number, w1: number, seed: number, wob = 1.2): string {
  const R = rng(seed);
  const p1 = R() * 6.28;
  const p2 = R() * 6.28;
  const n = 60;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + (a1 - a0) * t;
    const rr = r + wob * (Math.sin(t * 9 + p1) * 0.6 + Math.sin(t * 23 + p2) * 0.4);
    const ends = Math.max(0.2, Math.min(1, t * 7, (1 - t) * 4));
    const w = (w0 + (w1 - w0) * t) * ends;
    outer.push(pt(rr + w / 2, a).join(','));
    inner.push(pt(rr - w / 2, a).join(','));
  }
  return `M${outer.join(' L')} L${inner.reverse().join(' L')} Z`;
}

/** Brindille effilée, d'un point à un autre, avec une courbure. */
function twig(x0: number, y0: number, x1: number, y1: number, w: number, bend = 0.25): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = (x0 + x1) / 2 + nx * len * bend;
  const cy = (y0 + y1) / 2 + ny * len * bend;
  return (
    `M${r2(x0 + nx * w)},${r2(y0 + ny * w)} Q${r2(cx + nx * w * 0.5)},${r2(cy + ny * w * 0.5)} ${r2(x1)},${r2(y1)} ` +
    `Q${r2(cx - nx * w * 0.5)},${r2(cy - ny * w * 0.5)} ${r2(x0 - nx * w)},${r2(y0 - ny * w)} Z`
  );
}

/** Variables CSS en ligne, typées. */
const vars = (o: Record<string, string | number>) => o as React.CSSProperties;

type U = (k: string) => string;

/** Dégradé « tube » : un anneau éclairé, sombre aux bords, brillant à la crête. */
function TubeGradient({ id, stops }: { id: string; stops: [number, string, number?][] }) {
  return (
    <radialGradient id={id} cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
      {stops.map(([o, c, op], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={op ?? 1} />)}
    </radialGradient>
  );
}

function Blur({ id, s }: { id: string; s: number }) {
  return (
    <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation={s} />
    </filter>
  );
}

function Shadow({ id, dy = 2, s = 2, color = '#000', op = 0.3 }: { id: string; dy?: number; s?: number; color?: string; op?: number }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy={dy} stdDeviation={s} floodColor={color} floodOpacity={op} />
    </filter>
  );
}

/** Éclat lumineux à quatre branches, avec halo. */
function Glint({ x, y, s = 1, delay = 0, dur = 4, color = '#fff', glow }: {
  x: number; y: number; s?: number; delay?: number; dur?: number; color?: string; glow: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="c" style={{ animation: `wkf-glint ${dur}s ease-in-out ${delay}s infinite` }}>
        <circle r="6" fill={color} opacity=".55" filter={`url(#${glow})`} />
        <path d="M0,-11 C.8,-2 2,-.8 11,0 C2,.8 .8,2 0,11 C-.8,2 -2,.8 -11,0 C-2,-.8 -.8,-2 0,-11 Z" fill={color} />
      </g>
    </g>
  );
}

/**
 * Langues de flamme / d'énergie : chacune pousse de l'anneau, déviée vers le
 * haut (le feu monte), et vit sa propre vie. Leur dégradé s'éteint à la
 * pointe : arrivées au bord du cercle, elles s'effacent au lieu d'être coupées.
 */
interface Lick { x: number; y: number; rot: number; len: number; w: number; dur: number; delay: number }

function makeLicks(seed: number, n: number, opts: {
  r: number; up: number; radial: number; len: [number, number]; upLen: number; w: [number, number]; dur: [number, number];
  from?: number; to?: number;
}): Lick[] {
  const R = rng(seed);
  const from = opts.from ?? 0;
  const span = (opts.to ?? 360) - from;
  return Array.from({ length: n }, (_, i) => {
    const a = from + (i / n) * span + (R() - 0.5) * (span / n) * 0.8;
    const upness = (1 - Math.sin(rad(a))) / 2; // 1 au sommet, 0 en bas
    const vx = Math.cos(rad(a)) * opts.radial;
    const vy = Math.sin(rad(a)) * opts.radial - opts.up * (0.35 + 0.65 * upness);
    const rot = (Math.atan2(vx, -vy) * 180) / Math.PI;
    const [x, y] = pt(opts.r + (R() - 0.5) * 3, a);
    const dur = opts.dur[0] + R() * (opts.dur[1] - opts.dur[0]);
    return {
      x, y, rot: r2(rot),
      len: r2(opts.len[0] + R() * (opts.len[1] - opts.len[0]) + opts.upLen * upness),
      w: r2(opts.w[0] + R() * (opts.w[1] - opts.w[0])),
      dur: r2(dur),
      delay: r2(-R() * dur)
    };
  });
}

function Licks({ licks, fill }: { licks: Lick[]; fill: string }) {
  return (
    <>
      {licks.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}>
          <path
            className="o"
            d={`M0,1 C${-l.w},${r2(-l.len * 0.25)} ${r2(-l.w * 0.7)},${r2(-l.len * 0.7)} ${r2(l.w * 0.15)},${-l.len} C${r2(l.w * 0.5)},${r2(-l.len * 0.65)} ${l.w},${r2(-l.len * 0.3)} 0,1 Z`}
            fill={fill}
            style={{ animation: `wkf-lick ${l.dur}s cubic-bezier(.3,.6,.5,1) ${l.delay}s infinite` }}
          />
        </g>
      ))}
    </>
  );
}

/** Particules qui montent (étincelles, braises, bulles). */
interface Mote { x: number; y: number; r: number; dur: number; delay: number; rise: number; sx: number }
function makeMotes(seed: number, n: number, area: (R: () => number) => [number, number], o: { r: [number, number]; dur: [number, number]; rise: [number, number]; sx: number }): Mote[] {
  const R = rng(seed);
  return Array.from({ length: n }, () => {
    const [x, y] = area(R);
    const dur = o.dur[0] + R() * (o.dur[1] - o.dur[0]);
    return {
      x: r2(x), y: r2(y),
      r: r2(o.r[0] + R() * (o.r[1] - o.r[0])),
      dur: r2(dur), delay: r2(-R() * dur),
      rise: r2(-(o.rise[0] + R() * (o.rise[1] - o.rise[0]))),
      sx: r2((R() - 0.5) * 2 * o.sx)
    };
  });
}

function Motes({ motes, render }: { motes: Mote[]; render: (m: Mote) => React.ReactNode }) {
  return (
    <>
      {motes.map((m, i) => (
        <g key={i} transform={`translate(${m.x} ${m.y})`}>
          <g
            className="o"
            style={{
              ...vars({ '--rise': `${m.rise}px`, '--sx': `${m.sx}px` }),
              animation: `wkf-rise ${m.dur}s ease-out ${m.delay}s infinite`
            }}
          >
            {render(m)}
          </g>
        </g>
      ))}
    </>
  );
}

/** Dégradé de langue de feu : plein à la base, éteint à la pointe. */
function LickGradient({ id, stops }: { id: string; stops: [number, string, number][] }) {
  return (
    <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
      {stops.map(([o, c, op], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={op} />)}
    </linearGradient>
  );
}

/* ===================================================== Bulle de chewing-gum */

/**
 * Anneau irrégulier : l'épaisseur ondule doucement, comme une gomme étirée
 * à la main. Un tore parfait trahit l'ordinateur.
 */
function wobblyAnnulus(rIn: number, rOut: number, seed: number, amp: number): string {
  const R = rng(seed);
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28, R() * 6.28];
  const n = 120;
  const loop = (r: number, k: number, reverse: boolean) => {
    const pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360;
      const w = amp * (Math.sin(rad(a) * 3 + ph[k]) * 0.5 + Math.sin(rad(a) * 7 + ph[k + 1]) * 0.3 + Math.sin(rad(a) * 13 + ph[k]) * 0.2);
      pts.push(pt(r + w, a).join(','));
    }
    if (reverse) pts.reverse();
    return `M${pts.join(' L')} Z`;
  };
  return `${loop(rOut, 0, false)} ${loop(rIn, 2, true)}`;
}

const GUM_RING = wobblyAnnulus(86, 97.8, 5, 1.3);

const GUM_SHARDS = (() => {
  const R = rng(3);
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 360 + R() * 25;
    const d = 11 + R() * 8;
    const [dx, dy] = pt(d, a);
    return { dx, dy, rot: r2((R() - 0.5) * 260), len: r2(3 + R() * 3), drop: R() < 0.5 };
  });
})();

const GUM_BUBBLES = makeMotes(4, 5, (R) => pt(92 + R() * 4, 150 + R() * 40), { r: [1.4, 2.8], dur: [3, 5], rise: [16, 28], sx: 3 });

function Bubblegum({ u }: { u: U }) {
  const DUR = 4.2;
  // La bulle naît de l'anneau en bas à droite et gonfle vers l'intérieur :
  // elle reste dans le cercle, en mordant à peine le coin de la photo.
  const A = 42;
  const [ax, ay] = pt(91, A);
  const [bx, by] = pt(-13, A);

  return (
    <>
      <defs>
        <TubeGradient
          id={u('tube')}
          stops={[[0.85, '#a40c52'], [0.875, '#e13a86'], [0.9, '#ff82ba'], [0.922, '#ffc6e0'], [0.945, '#ff7db6'], [0.97, '#d42a78'], [0.99, '#9a0b4c']]}
        />
        <radialGradient id={u('film')} cx=".4" cy=".36" r=".64">
          <stop offset="0" stopColor="#fff0f7" stopOpacity=".4" />
          <stop offset=".62" stopColor="#ffa9cf" stopOpacity=".55" />
          <stop offset=".9" stopColor="#ff5c9f" stopOpacity=".82" />
          <stop offset="1" stopColor="#d81b6a" stopOpacity=".95" />
        </radialGradient>
        <linearGradient id={u('iri')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9ad5" />
          <stop offset=".35" stopColor="#b9a3ff" />
          <stop offset=".65" stopColor="#8ee8ff" />
          <stop offset="1" stopColor="#ffe08a" />
        </linearGradient>
        <linearGradient id={u('gum')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb3d6" />
          <stop offset=".55" stopColor="#ff6fac" />
          <stop offset="1" stopColor="#c81d6c" />
        </linearGradient>
        <Blur id={u('soft')} s={0.9} />
        <Shadow id={u('shadow')} dy={1.6} s={1.6} color="#8a0d48" op={0.3} />
      </defs>

      {/* L'anneau de gomme, en volume ; il frémit quand la bulle éclate */}
      <g filter={`url(#${u('shadow')})`}>
        <g className="o" style={{ animation: `wkf-gum-ring ${DUR}s ease-in-out infinite` }}>
          <path d={GUM_RING} fillRule="evenodd" fill={`url(#${u('tube')})`} />
          {/* Reflets : un large adouci, un fin et net, un rebond de lumière en bas */}
          <path d={arc(94, 198, 262)} fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity=".85" filter={`url(#${u('soft')})`} />
          <path d={arc(94.5, 214, 244)} fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <path d={arc(94, 312, 330)} fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".6" />
          <path d={arc(88, 25, 120)} fill="none" stroke="#ffd2e7" strokeWidth="1" strokeLinecap="round" opacity=".55" />
        </g>
      </g>

      {/* Petites bulles qui montent le long de l'anneau */}
      <Motes
        motes={GUM_BUBBLES}
        render={(m) => (
          <>
            <circle r={m.r} fill={`url(#${u('film')})`} />
            <circle cx={-m.r * 0.35} cy={-m.r * 0.38} r={m.r * 0.3} fill="#fff" />
          </>
        )}
      />

      {/* La bulle : elle sort de l'anneau, gonfle, éclate, revient */}
      <g transform={`translate(${ax} ${ay})`}>
        <ellipse cx="0" cy="0" rx="5" ry="4.2" fill={`url(#${u('gum')})`} transform={`rotate(${A})`} />
        <g className="o" style={{ animation: `wkf-gum-bubble ${DUR}s cubic-bezier(.33,.66,.45,1) infinite` }}>
          <circle cx={bx} cy={by} r="13" fill={`url(#${u('film')})`} />
          <circle cx={bx} cy={by} r="12.2" fill="none" stroke={`url(#${u('iri')})`} strokeWidth="1.2" opacity=".55" />
          <circle cx={bx} cy={by} r="13" fill="none" stroke="#d42a78" strokeWidth=".7" opacity=".75" />
          <path d={`M${bx - 9},${by - 2.5} A10,10 0 0 1 ${bx - 1},${by - 10.5}`} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" filter={`url(#${u('soft')})`} />
          <ellipse cx={bx - 5} cy={by - 7} rx="1.8" ry="1.1" fill="#fff" transform={`rotate(-40 ${bx - 5} ${by - 7})`} />
          <path d={`M${bx + 3},${by + 10.5} A11,11 0 0 0 ${bx + 10.5},${by + 4}`} fill="none" stroke="#fff" strokeWidth=".9" strokeLinecap="round" opacity=".5" />
        </g>

        <g transform={`translate(${bx} ${by})`}>
          <circle className="o" r="13" fill="none" stroke="#fff" strokeWidth="1.6" style={{ animation: `wkf-gum-flash ${DUR}s ease-out infinite` }} />
          {GUM_SHARDS.map((s, i) => (
            <g
              key={i}
              className="o"
              style={{ ...vars({ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--r': `${s.rot}deg` }), animation: `wkf-gum-shard ${DUR}s cubic-bezier(.2,.7,.4,1) infinite` }}
            >
              {s.drop ? (
                <>
                  <circle r="1.7" fill={`url(#${u('gum')})`} />
                  <circle cx="-.5" cy="-.6" r=".5" fill="#fff" />
                </>
              ) : (
                <path d={`M${-s.len},0 Q0,${-s.len * 0.6} ${s.len},0`} fill="none" stroke="#ff7db6" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </g>
          ))}
        </g>
      </g>
    </>
  );
}

/* ================================================================== Sakura */

const SAKURA = (() => {
  const R = rng(11);
  const angles = [-124, -100, -72, -44, -16, 14, 46, 78, 110, 142, 174, 206];
  const flowers = angles.map((a) => ({
    a: a + (R() - 0.5) * 8,
    r: 91.5 + (R() - 0.5) * 2,
    s: 0.4 + R() * 0.16,
    rot: R() * 72,
    dur: 3.6 + R() * 2.4,
    delay: -R() * 5,
    kind: R() < 0.22 ? 'bud' : 'flower'
  }));
  // Les pétales longent les bords de la photo plutôt que de la traverser
  const petals = Array.from({ length: 6 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (58 + R() * 18),
    dur: 6 + R() * 4,
    delay: -R() * 10,
    sx: 4 + R() * 6,
    s: 0.26 + R() * 0.1,
    flutter: 2.4 + R() * 2.2
  }));
  return { flowers, petals };
})();

const PETAL = 'M0,0 C-7,-3 -10,-12 -5,-18.5 C-3,-19.6 -1.4,-18.6 0,-16.4 C1.4,-18.6 3,-19.6 5,-18.5 C10,-12 7,-3 0,0 Z';

function Blossom({ u, s, rot }: { u: U; s: number; rot: number }) {
  return (
    <g transform={`scale(${s}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d={PETAL} fill={`url(#${u('petal')})`} stroke="#ec8db0" strokeWidth=".9" />
          <path d="M0,-3 L0,-12" stroke="#f6a8c4" strokeWidth=".9" strokeLinecap="round" />
        </g>
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const [x, y] = pt(7.5, i * 36 + 10);
        return (
          <g key={i}>
            <line x1="0" y1="0" x2={x} y2={y} stroke="#e5487a" strokeWidth=".8" />
            <circle cx={x} cy={y} r="1.3" fill="#ffd34d" />
          </g>
        );
      })}
      <circle r="3.4" fill={`url(#${u('heart')})`} />
    </g>
  );
}

function Sakura({ u }: { u: U }) {
  return (
    <>
      <defs>
        <linearGradient id={u('bark')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7d5240" />
          <stop offset=".5" stopColor="#4e2f23" />
          <stop offset="1" stopColor="#6b4434" />
        </linearGradient>
        <radialGradient id={u('petal')} cx=".5" cy="1" r="1.05">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#ffe3ec" />
          <stop offset="1" stopColor="#ff9cbe" />
        </radialGradient>
        <radialGradient id={u('heart')}>
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e2306a" />
        </radialGradient>
        <linearGradient id={u('leaf')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9bd97a" />
          <stop offset="1" stopColor="#4a9a3c" />
        </linearGradient>
        <radialGradient id={u('bud')} cx=".4" cy=".35">
          <stop offset="0" stopColor="#ffc2d6" />
          <stop offset="1" stopColor="#d9306a" />
        </radialGradient>
        <Blur id={u('glow')} s={3} />
        <Shadow id={u('shadow')} dy={1.4} s={1.2} color="#5a1e33" op={0.3} />
      </defs>

      {/* Halo rosé, très doux */}
      <circle r="92" fill="none" stroke="#ffb7cf" strokeWidth="10" opacity=".4" filter={`url(#${u('glow')})`} />

      <g filter={`url(#${u('shadow')})`}>
        {/* Deux branches effilées qui se croisent en couronne */}
        <path d={taperedArc(92.5, 128, 374, 7, 2.5, 21)} fill={`url(#${u('bark')})`} />
        <path d={taperedArc(93.5, 330, 472, 5, 1.8, 22)} fill={`url(#${u('bark')})`} />
        <path d={arc(91, 190, 300)} fill="none" stroke="#b8836a" strokeWidth=".9" strokeLinecap="round" opacity=".55" />
        {/* Brindilles, qui suivent l'anneau */}
        {[[-150, 16], [-30, -14], [62, 16], [150, -14], [250, 14]].map(([a, da]) => {
          const [x0, y0] = pt(92, a);
          const [x1, y1] = pt(88, a + da);
          return <path key={a} d={twig(x0, y0, x1, y1, 1.2)} fill={`url(#${u('bark')})`} />;
        })}
        {/* Feuilles tendres, couchées le long de la branche */}
        {[-58, 100, 196, 270].map((a, i) => {
          const [x, y] = pt(93, a);
          return (
            <g key={a} transform={`translate(${x} ${y}) rotate(${a + 90 + (i % 2 ? 20 : -20)}) scale(.75)`}>
              <path d="M0,0 C4,-6 13,-6 18,0 C13,6 4,6 0,0 Z" fill={`url(#${u('leaf')})`} />
              <path d="M1,0 L16,0" stroke="#3f7f33" strokeWidth=".6" opacity=".7" />
            </g>
          );
        })}

        {/* Fleurs et boutons, chacun bercé à son rythme */}
        {SAKURA.flowers.map((f, i) => {
          const [x, y] = pt(f.r, f.a);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g
                className="o"
                style={{ ...vars({ '--amp': '4deg' }), animation: `wkf-sway ${f.dur}s ease-in-out ${f.delay}s infinite` }}
              >
                {f.kind === 'bud' ? (
                  <g transform={`rotate(${f.a + 90}) scale(${f.s * 1.3})`}>
                    <path d="M-3,2 L0,-2 L3,2 Z" fill="#5f9c45" />
                    <ellipse cx="0" cy="-5" rx="3.6" ry="5.4" fill={`url(#${u('bud')})`} />
                    <path d="M-1.4,-8 Q-.9,-5 -1.4,-2.5" stroke="#fff" strokeWidth=".9" opacity=".7" fill="none" />
                  </g>
                ) : (
                  <Blossom u={u} s={f.s} rot={f.rot} />
                )}
              </g>
            </g>
          );
        })}
      </g>

      {/* Pétales qui tombent en tourbillonnant, le long des bords */}
      {SAKURA.petals.map((p, i) => (
        <g key={i} transform={`translate(${r2(p.x)} -80)`}>
          <g className="o" style={{ ...vars({ '--sx': `${r2(p.sx)}px` }), animation: `wkf-fall ${r2(p.dur)}s linear ${r2(p.delay)}s infinite` }}>
            <g className="c" style={{ animation: `wkf-flutter ${r2(p.flutter)}s linear infinite` }}>
              <path transform={`scale(${r2(p.s)})`} d={PETAL} fill={`url(#${u('petal')})`} stroke="#ec8db0" strokeWidth="1.6" />
            </g>
          </g>
        </g>
      ))}
    </>
  );
}

/* ============================================================ Feu réaliste */

/**
 * Le secret d'un feu crédible : un bruit de turbulence qui « bout » en
 * permanence et déforme les langues, plus un halo (bloom) qui fait rayonner
 * le cœur. Sans ça, une flamme reste une goutte de couleur qui grossit.
 *
 * L'animation du bruit est en SMIL (attribut baseFrequency) : AnimatedFrame
 * la met en pause hors écran avec pauseAnimations(), comme le reste.
 */
function FireFilter({ id, scale = 7, freq = '0.045 0.12', freq2 = '0.055 0.16', dur = 2.4, bloom = 2.2, seed = 5 }: {
  id: string; scale?: number; freq?: string; freq2?: string; dur?: number; bloom?: number; seed?: number;
}) {
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x="-100" y="-100" width="200" height="200">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={seed} result="n">
        <animate attributeName="baseFrequency" dur={`${dur}s`} values={`${freq};${freq2};${freq}`} repeatCount="indefinite" />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={bloom} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="d" />
      </feMerge>
    </filter>
  );
}

/* ========================================================= Aura de combat */

/** Sur l'anneau, tout autour */
const KI_OUTER = makeLicks(21, 62, { r: 92, up: 1.2, radial: 0.45, len: [10, 15], upLen: 4, w: [6, 10], dur: [0.5, 0.85] });
/** En bas, l'énergie monte : elle lèche le bord de la photo */
const KI_RISE = makeLicks(24, 22, { r: 89, up: 1, radial: -0.1, len: [12, 22], upLen: 0, w: [6, 10], dur: [0.55, 0.9], from: 18, to: 162 });
const KI_MID = makeLicks(25, 50, { r: 91, up: 1, radial: 0.5, len: [6, 11], upLen: 3, w: [4.5, 7], dur: [0.45, 0.75] });
const KI_CORE = makeLicks(22, 22, { r: 90, up: 0.8, radial: 0.6, len: [5, 8], upLen: 1, w: [3.5, 5], dur: [0.4, 0.65] });
const KI_SPARKS = makeMotes(23, 12, (R) => pt(88 + R() * 8, 20 + R() * 140), { r: [0.7, 1.5], dur: [1.1, 2], rise: [14, 28], sx: 4 });

/** Arc électrique : une ligne brisée qui court le long de l'anneau. */
function boltPath(seed: number, a0: number, span: number): string {
  const R = rng(seed);
  const n = 8;
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = pt(92.5 + (R() - 0.5) * 9, a0 + (span * i) / (n - 1));
    return `${i ? 'L' : 'M'}${x},${y}`;
  }).join(' ');
}

const KI_BOLTS = [
  { a: -160, d: 0.1 }, { a: -60, d: 0.9 }, { a: 20, d: 1.7 }, { a: 120, d: 2.4 }
].map((b, i) => ({ ...b, p1: boltPath(30 + i, b.a, 30), p2: boltPath(40 + i, b.a + 4, 26) }));

function AuraKi({ u }: { u: U }) {
  return (
    <>
      <defs>
        <LickGradient id={u('kiA')} stops={[[0, '#fff3b0', 1], [0.35, '#ffd23f', 0.95], [0.7, '#ffa21a', 0.6], [1, '#ff7a00', 0]]} />
        <LickGradient id={u('kiB')} stops={[[0, '#ffffff', 1], [0.45, '#fff6c4', 0.95], [1, '#ffe14d', 0]]} />
        <LickGradient id={u('kiC')} stops={[[0, '#fffdf0', 0.95], [0.6, '#fff6c4', 0.7], [1, '#fff6c4', 0]]} />
        <TubeGradient id={u('band')} stops={[[0.86, '#ff9f1a', 0.2], [0.9, '#ffd23f', 0.75], [0.93, '#fff6c4', 0.95], [0.96, '#ffd23f', 0.6], [0.995, '#ff9f1a', 0]]} />
        <FireFilter id={u('ki')} scale={5} freq="0.024 0.065" freq2="0.03 0.085" dur={1.6} bloom={1.6} seed={8} />
        <Blur id={u('glow')} s={3} />
        <Blur id={u('glowS')} s={1.2} />
      </defs>

      {/* Bande d'énergie : un anneau lumineux qui pulse */}
      <path
        d={annulus(85, 100)}
        fillRule="evenodd"
        fill={`url(#${u('band')})`}
        style={{ ...vars({ '--lo': '.75', '--hi': '1' }), animation: 'wkf-glow 1s ease-in-out infinite' }}
      />
      <circle r="93" fill="none" stroke="#ffcc33" strokeWidth="8" opacity=".55" filter={`url(#${u('glow')})`} />

      {/* L'aura : trois couches de langues, tordues par le même bruit */}
      <g filter={`url(#${u('ki')})`}>
        <Licks licks={KI_RISE} fill={`url(#${u('kiA')})`} />
        <Licks licks={KI_OUTER} fill={`url(#${u('kiA')})`} />
        <Licks licks={KI_MID} fill={`url(#${u('kiB')})`} />
        <Licks licks={KI_CORE} fill={`url(#${u('kiC')})`} />
      </g>

      {/* Le cœur d'énergie, au ras de l'avatar */}
      <circle r="86.5" fill="none" stroke="#fff3a6" strokeWidth="3" opacity=".9" filter={`url(#${u('glowS')})`} />
      <circle r="86" fill="none" stroke="#ffffff" strokeWidth="1.2" />

      {/* Arcs électriques : deux tracés qui alternent, jamais le même éclair */}
      {KI_BOLTS.map((b, i) => (
        <g key={i}>
          {[b.p1, b.p2].map((p, k) => (
            <g key={k} style={{ animation: `wkf-zap 2.4s linear ${b.d + k * 0.12}s infinite` }}>
              <path d={p} fill="none" stroke="#59d8ff" strokeWidth="3" strokeLinejoin="round" opacity=".7" filter={`url(#${u('glowS')})`} />
              <path d={p} fill="none" stroke="#f2feff" strokeWidth="1" strokeLinejoin="round" />
            </g>
          ))}
        </g>
      ))}

      <Motes
        motes={KI_SPARKS}
        render={(m) => (
          <>
            <circle r={m.r * 2.4} fill="#ffd23f" opacity=".35" />
            <circle r={m.r} fill="#fffbe3" />
          </>
        )}
      />
    </>
  );
}

/* ===================================================== Flammes du dragon */

/** Grandes langues rouge-orangé, sur tout l'anneau */
const FIRE_OUTER = makeLicks(51, 64, { r: 93, up: 1.3, radial: 0.4, len: [10, 16], upLen: 4, w: [7, 11], dur: [0.75, 1.25] });
/** En bas, le feu monte sur le bord de la photo */
const FIRE_RISE = makeLicks(54, 24, { r: 89, up: 1, radial: -0.1, len: [14, 26], upLen: 0, w: [7, 11], dur: [0.8, 1.3], from: 18, to: 162 });
/** Corps orange-jaune, puis cœur presque blanc */
const FIRE_MID = makeLicks(55, 54, { r: 92, up: 1.2, radial: 0.45, len: [7, 12], upLen: 3, w: [5, 8], dur: [0.6, 1] });
const FIRE_CORE = makeLicks(52, 22, { r: 91, up: 1, radial: 0.5, len: [5, 8], upLen: 1, w: [3.5, 5.5], dur: [0.5, 0.8] });
const EMBERS = makeMotes(53, 14, (R) => pt(86 + R() * 10, 15 + R() * 150), { r: [0.6, 1.4], dur: [1.4, 2.6], rise: [16, 34], sx: 6 });

/** Glyphes runiques : trois ou quatre traits dans une petite case. */
const RUNES = (() => {
  const R = rng(57);
  return Array.from({ length: 24 }, () => {
    const pts = Array.from({ length: 3 + Math.floor(R() * 2) }, () => `${r2((R() - 0.5) * 4)},${r2((R() - 0.5) * 5)}`);
    return `M${pts.join(' L')}`;
  });
})();

function FlammeDragon({ u }: { u: U }) {
  return (
    <>
      <defs>
        <LickGradient id={u('fireA')} stops={[[0, '#ffb340', 1], [0.3, '#ff6a1a', 0.95], [0.65, '#d8261a', 0.7], [1, '#6d0b05', 0]]} />
        <LickGradient id={u('fireB')} stops={[[0, '#fff1b0', 1], [0.4, '#ffc23d', 1], [0.8, '#ff7a1a', 0.6], [1, '#ff5a1f', 0]]} />
        <LickGradient id={u('fireC')} stops={[[0, '#fff6d5', 0.95], [0.55, '#ffe08a', 0.75], [1, '#ffc23d', 0]]} />
        <TubeGradient
          id={u('molten')}
          stops={[[0.86, '#2a0603'], [0.885, '#7a170b'], [0.91, '#e2501a'], [0.93, '#ffb347'], [0.95, '#e2501a'], [0.97, '#6a1309'], [0.985, '#2a0603']]}
        />
        <FireFilter id={u('fire')} scale={6} freq="0.022 0.055" freq2="0.028 0.075" dur={2.2} bloom={1.6} seed={3} />
        <Blur id={u('glow')} s={3.5} />
        <Blur id={u('glowS')} s={0.9} />
      </defs>

      {/* Lueur du brasier, qui respire */}
      <circle
        r="91"
        fill="none"
        stroke="#ff4d1a"
        strokeWidth="12"
        filter={`url(#${u('glow')})`}
        style={{ ...vars({ '--lo': '.45', '--hi': '.8' }), animation: 'wkf-glow 1.3s ease-in-out infinite' }}
      />

      {/* L'anneau de métal en fusion, gravé de runes qui tournent */}
      <path d={annulus(86, 98.5)} fillRule="evenodd" fill={`url(#${u('molten')})`} />
      <path
        d={annulus(86, 98.5)}
        fillRule="evenodd"
        fill="#ffb347"
        style={{ ...vars({ '--lo': '0', '--hi': '.28' }), animation: 'wkf-glow .9s ease-in-out infinite' }}
      />
      <g className="o" style={{ animation: 'wkf-spin-rev 30s linear infinite' }}>
        <g filter={`url(#${u('glowS')})`}>
          {RUNES.map((d, i) => {
            const [x, y] = pt(92.2, i * 15);
            return (
              <path key={i} transform={`translate(${x} ${y}) rotate(${i * 15 + 90})`} d={d} fill="none" stroke="#ffe3a0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            );
          })}
        </g>
      </g>

      {/* Le feu : rouge sombre aux pointes, orange au corps, blanc au cœur —
          les quatre couches sont tordues ensemble par le même bruit */}
      <g filter={`url(#${u('fire')})`}>
        <Licks licks={FIRE_RISE} fill={`url(#${u('fireA')})`} />
        <Licks licks={FIRE_OUTER} fill={`url(#${u('fireA')})`} />
        <Licks licks={FIRE_MID} fill={`url(#${u('fireB')})`} />
        <Licks licks={FIRE_CORE} fill={`url(#${u('fireC')})`} />
      </g>

      <Motes
        motes={EMBERS}
        render={(m) => (
          <>
            <circle r={m.r * 2.8} fill="#ff6a1a" opacity=".35" />
            <circle r={m.r} fill="#ffe2a0" />
          </>
        )}
      />
    </>
  );
}

/* ====================================================== Chapeau de paille */

/** Houle : une bande de vagues qui boucle sur 48 px. */
function wavePath(y: number, amp: number, period = 48): string {
  let d = `M-150,${y}`;
  for (let x = -150; x < 160; x += period) {
    d += ` C${x + period * 0.25},${y - amp} ${x + period * 0.5},${y - amp} ${x + period * 0.5},${y}`;
    d += ` C${x + period * 0.75},${y + amp * 0.6} ${x + period},${y + amp * 0.6} ${x + period},${y}`;
  }
  return `${d} L160,110 L-150,110 Z`;
}

function ChapeauPaille({ u }: { u: U }) {
  return (
    <>
      <defs>
        <TubeGradient
          id={u('rope')}
          stops={[[0.865, '#5d3a12'], [0.885, '#a87635'], [0.91, '#e1bd7e'], [0.932, '#f5e0b0'], [0.955, '#c99752'], [0.975, '#8a5a22'], [0.985, '#5d3a12']]}
        />
        <linearGradient id={u('seaFade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset=".35" stopColor="#fff" />
        </linearGradient>
        {/* La mer ne vit que dans le bas du cercle, en fondu vers le haut */}
        <mask id={u('sea')}>
          <rect x="-100" y="58" width="200" height="42" fill={`url(#${u('seaFade')})`} />
        </mask>
        <linearGradient id={u('waterBack')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc8ea" />
          <stop offset="1" stopColor="#2f7fb3" />
        </linearGradient>
        <linearGradient id={u('waterFront')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b2e6f8" />
          <stop offset=".4" stopColor="#5fb7e0" />
          <stop offset="1" stopColor="#2f86b3" />
        </linearGradient>
        <radialGradient id={u('brim')} cx=".5" cy=".42" r=".6">
          <stop offset="0" stopColor="#fbe39a" />
          <stop offset=".7" stopColor="#e8b74c" />
          <stop offset="1" stopColor="#c08628" />
        </radialGradient>
        <linearGradient id={u('crown')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdeab0" />
          <stop offset=".55" stopColor="#ebbb52" />
          <stop offset="1" stopColor="#c48c2c" />
        </linearGradient>
        <linearGradient id={u('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6a5c" />
          <stop offset=".5" stopColor="#d6302d" />
          <stop offset="1" stopColor="#951a17" />
        </linearGradient>
        <Blur id={u('soft')} s={1.3} />
        <Shadow id={u('shadow')} dy={1.6} s={1.6} color="#3a2410" op={0.35} />
      </defs>

      {/* La mer qui clapote au bas de la photo : deux houles à des vitesses
          différentes, d'où la profondeur */}
      <g mask={`url(#${u('sea')})`}>
        <g className="o" style={{ animation: 'wkf-wave 3.6s linear infinite' }}>
          <path d={wavePath(70, 4)} fill={`url(#${u('waterBack')})`} />
        </g>
        <g className="o" style={{ animation: 'wkf-wave 2.2s linear -1s infinite' }}>
          <path d={wavePath(79, 5)} fill={`url(#${u('waterFront')})`} />
          <path d={wavePath(79, 5).split(' L160')[0]} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".75" />
        </g>
      </g>
      <Glint x={-38} y={84} s={0.35} delay={0.4} dur={3.4} glow={u('soft')} />
      <Glint x={30} y={88} s={0.3} delay={2.1} dur={3.8} glow={u('soft')} />

      {/* Le cordage torsadé */}
      <g filter={`url(#${u('shadow')})`}>
        <path d={annulus(86.5, 98.5)} fillRule="evenodd" fill={`url(#${u('rope')})`} />
        {Array.from({ length: 64 }, (_, i) => {
          const a = i * (360 / 64);
          const [x0, y0] = pt(87, a);
          const [cx, cy] = pt(92.5, a + 2.2);
          const [x1, y1] = pt(98, a + 6);
          const [hx0, hy0] = pt(87.6, a + 2);
          const [hcx, hcy] = pt(92.9, a + 4);
          const [hx1, hy1] = pt(97.6, a + 7.4);
          return (
            <g key={i}>
              <path d={`M${x0},${y0} Q${cx},${cy} ${x1},${y1}`} fill="none" stroke="#6b4416" strokeWidth="1.2" opacity=".6" />
              <path d={`M${hx0},${hy0} Q${hcx},${hcy} ${hx1},${hy1}`} fill="none" stroke="#fbe9c2" strokeWidth=".8" opacity=".55" />
            </g>
          );
        })}
      </g>

      {/* Le chapeau, posé de travers sur l'anneau ; il rebondit comme du caoutchouc */}
      <g transform="translate(-45 -66) rotate(-20) scale(.62)">
        <ellipse cx="2" cy="9" rx="34" ry="6" fill="#3a2410" opacity=".25" filter={`url(#${u('soft')})`} />
        <g className="o" style={{ animation: 'wkf-hat 3.8s cubic-bezier(.45,.05,.35,1) infinite' }}>
          <ellipse rx="45" ry="12" fill={`url(#${u('brim')})`} />
          {[38, 31, 24].map((rx) => (
            <ellipse key={rx} rx={rx} ry={rx * 0.27} fill="none" stroke="#b47f25" strokeWidth=".8" opacity=".55" />
          ))}
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * 360;
            const [x0, y0] = [r2(Math.cos(rad(a)) * 24), r2(Math.sin(rad(a)) * 6.5)];
            const [x1, y1] = [r2(Math.cos(rad(a)) * 44), r2(Math.sin(rad(a)) * 11.6)];
            return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#c99634" strokeWidth=".7" opacity=".45" />;
          })}
          <ellipse rx="45" ry="12" fill="none" stroke="#9a6a1c" strokeWidth="1.2" />
          <path d="M-24,-1 C-25,-33 25,-33 24,-1 Z" fill={`url(#${u('crown')})`} stroke="#9a6a1c" strokeWidth="1.2" />
          {[-20, -25].map((y) => (
            <path key={y} d={`M${-21 + (y + 20) * -0.2},${y} Q0,${y - 5} ${21 + (y + 20) * 0.2},${y}`} fill="none" stroke="#b47f25" strokeWidth=".8" opacity=".55" />
          ))}
          <path d="M-24.4,-1 Q0,-6.5 24.4,-1 L23.6,-10 Q0,-15.5 -23.6,-10 Z" fill={`url(#${u('band')})`} stroke="#7a1210" strokeWidth="1" />
          <path d="M-22,-9.6 Q0,-14.6 22,-9.6" fill="none" stroke="#ff9d93" strokeWidth="1" opacity=".8" />
          <ellipse cx="-8" cy="-22" rx="7" ry="3.2" fill="#fff" opacity=".5" transform="rotate(-14 -8 -22)" filter={`url(#${u('soft')})`} />
        </g>
      </g>
    </>
  );
}

/* ===================================================== Ninja de la spirale */

/** Secteur d'anneau : une plaque courbe qui épouse le bandeau. */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = pt(r1, a0);
  const [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1);
  const [x3, y3] = pt(r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3} Z`;
}

const SHURIKEN = 'M0,-13 C1.5,-6 2.5,-3.5 3.2,-3.2 C3.5,-2.5 6,-1.5 13,0 C6,1.5 3.5,2.5 3.2,3.2 C2.5,3.5 1.5,6 0,13 C-1.5,6 -2.5,3.5 -3.2,3.2 C-3.5,2.5 -6,1.5 -13,0 C-6,-1.5 -3.5,-2.5 -3.2,-3.2 C-2.5,-3.5 -1.5,-6 0,-13 Z';

/** La plaque frontale : elle occupe le haut du bandeau, de -121° à -59°. */
const PLATE_A0 = -126;
const PLATE_A1 = -54;
const PLATE = sector(77, 99.4, PLATE_A0, PLATE_A1);
/** L'oiseau Workyt, centré sur la plaque, haut d'environ 10 unités */
const BIRD_AT = `translate(0 -88) scale(.07) translate(${-WORKYT_BIRD_CENTER[0]} ${-WORKYT_BIRD_CENTER[1]})`;

function NinjaSpirale({ u }: { u: U }) {
  return (
    <>
      <defs>
        <TubeGradient
          id={u('cloth')}
          stops={[[0.86, '#0a1328'], [0.885, '#1b2f5c'], [0.91, '#2c4a8a'], [0.932, '#4a6db5'], [0.952, '#2a4380'], [0.975, '#15264a'], [0.99, '#0a1328']]}
        />
        <linearGradient id={u('steel')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7fafc" />
          <stop offset=".4" stopColor="#c3ced8" />
          <stop offset=".55" stopColor="#e6ecf1" />
          <stop offset="1" stopColor="#8796a6" />
        </linearGradient>
        <linearGradient id={u('enamel')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffa25c" />
          <stop offset=".55" stopColor="#f5610c" />
          <stop offset="1" stopColor="#c23e05" />
        </linearGradient>
        <linearGradient id={u('blade')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dfe6ed" />
          <stop offset=".5" stopColor="#6c7b8a" />
          <stop offset="1" stopColor="#b9c3cd" />
        </linearGradient>
        <linearGradient id={u('sheen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={u('plate')}>
          <path d={PLATE} />
        </clipPath>
        <Shadow id={u('shadow')} dy={1.4} s={1.3} color="#050b18" op={0.4} />
      </defs>

      {/* Le bandeau de tissu bleu nuit, coutures comprises */}
      <g filter={`url(#${u('shadow')})`}>
        <path d={annulus(86, 98.5)} fillRule="evenodd" fill={`url(#${u('cloth')})`} />
        <circle r="88.6" fill="none" stroke="#9fb6e8" strokeWidth=".55" strokeDasharray="2 2.4" opacity=".45" />
        <circle r="95.9" fill="none" stroke="#9fb6e8" strokeWidth=".55" strokeDasharray="2 2.4" opacity=".45" />
        <path d={arc(94, 150, 230)} fill="none" stroke="#7d9be0" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
      </g>

      {/* Traînées de vent : le bandeau fend l'air */}
      <g className="o" style={{ animation: 'wkf-spin 1.5s linear infinite' }}>
        {[0, 120, 240].map((a) => (
          <path key={a} d={arc(92.2, a, a + 38)} fill="none" stroke="#dbe6ff" strokeWidth="1" strokeLinecap="round" opacity=".35" />
        ))}
      </g>

      {/* Deux shurikens qui roulent sur le bandeau, flous de vitesse compris */}
      <g className="o" style={{ animation: 'wkf-spin 7s linear infinite' }}>
        {[60, 200].map((a) => {
          const [x, y] = pt(92.2, a);
          return (
            <g key={a} transform={`translate(${x} ${y}) scale(.5)`}>
              <g className="c" style={{ animation: 'wkf-spin .42s linear infinite' }}>
                <path d={SHURIKEN} transform="rotate(-24)" fill="#8d9bab" opacity=".14" />
                <path d={SHURIKEN} transform="rotate(-12)" fill="#8d9bab" opacity=".28" />
                <path d={SHURIKEN} fill={`url(#${u('blade')})`} stroke="#2b3640" strokeWidth="1.1" strokeLinejoin="round" />
                <circle r="2.4" fill="#1b2430" />
                <circle r="1.1" cx="-.4" cy="-.4" fill="#cfd8e0" />
              </g>
            </g>
          );
        })}
      </g>

      {/* La plaque d'acier, cintrée, frappée de l'oiseau Workyt en émail orange */}
      <g filter={`url(#${u('shadow')})`}>
        <path d={PLATE} fill={`url(#${u('steel')})`} stroke="#4f5b67" strokeWidth=".9" strokeLinejoin="round" />
        <path d={sector(78.6, 97.8, PLATE_A0 + 1.3, PLATE_A1 - 1.3)} fill="none" stroke="#fff" strokeWidth=".8" opacity=".8" />
        {[[PLATE_A0 + 4.2, 81], [PLATE_A0 + 4.2, 95.8], [PLATE_A1 - 4.2, 81], [PLATE_A1 - 4.2, 95.8]].map(([a, r]) => {
          const [x, y] = pt(r, a);
          return (
            <g key={`${a}${r}`}>
              <circle cx={x} cy={y} r="1.35" fill="#7d8b99" stroke="#4f5b67" strokeWidth=".4" />
              <circle cx={x - 0.35} cy={y - 0.35} r=".5" fill="#fff" />
            </g>
          );
        })}
        {/* Gravure : un liseré clair décalé, puis l'émail */}
        <g transform={`translate(.5 .55) ${BIRD_AT}`} opacity=".7">
          {WORKYT_BIRD.map((d, i) => <path key={i} d={d} fill="#fff" />)}
        </g>
        <g transform={BIRD_AT}>
          {WORKYT_BIRD.map((d, i) => (
            <path key={i} d={d} fill={`url(#${u('enamel')})`} stroke="#5a2203" strokeWidth="7" strokeLinejoin="round" opacity={i ? 0.92 : 1} />
          ))}
        </g>
      </g>

      {/* Le reflet qui balaie l'acier */}
      <g clipPath={`url(#${u('plate')})`}>
        <g transform="rotate(20)">
          <g className="o" style={{ animation: 'wkf-sweep 4.2s cubic-bezier(.45,0,.25,1) infinite' }}>
            <rect x="-6" y="-130" width="12" height="260" fill={`url(#${u('sheen')})`} />
          </g>
        </g>
      </g>
    </>
  );
}

/* =============================================================== Couronnes */

interface CrownPalette {
  metal: string[];
  stone?: string[];
  gems: string[][];
  pearl: boolean;
}

const RUBY = ['#ff9aa5', '#e5233a', '#a10f22', '#5e0613'];
const SAPPHIRE = ['#a9dcff', '#2f86b3', '#174f78', '#0a2a44'];
const EMERALD = ['#c8ffd9', '#2fbf71', '#137a45', '#06401f'];
const GOLD_METAL = ['#6b4306', '#c48a1c', '#ffe9a3', '#e0a832', '#fff6cf', '#b47a12', '#f3c95a', '#7a4e08'];

const GOLD: CrownPalette = { metal: GOLD_METAL, gems: [RUBY, SAPPHIRE, RUBY], pearl: false };
const JADE: CrownPalette = {
  metal: GOLD_METAL,
  stone: ['#0d4d33', '#1f8a5c', '#6fd9a4', '#2fa36f', '#b6f3d2', '#187a50', '#0b4430'],
  gems: [EMERALD, EMERALD, EMERALD],
  pearl: true
};

/** Pierre taillée en brillant : une table, des facettes à quatre tons. */
function Brilliant({ c, r = 8, metal }: { c: string[]; r?: number; metal: string }) {
  const n = 8;
  const outer = Array.from({ length: n }, (_, i) => pt(r, i * 45 + 22.5));
  const table = Array.from({ length: n }, (_, i) => pt(r * 0.5, i * 45 + 22.5));
  const shade = [c[0], c[1], c[2], c[3], c[2], c[1], c[0], c[1]];
  return (
    <g>
      <circle r={r + 1.8} fill={metal} stroke="#6b4306" strokeWidth=".6" />
      {outer.map((p, i) => {
        const q = outer[(i + 1) % n];
        const t = table[i];
        const t2 = table[(i + 1) % n];
        return <path key={i} d={`M${p.join(',')} L${q.join(',')} L${t2.join(',')} L${t.join(',')} Z`} fill={shade[i]} />;
      })}
      <path d={`M${table.map((p) => p.join(',')).join(' L')} Z`} fill={c[1]} />
      <path d={`M${table[5].join(',')} L${table[6].join(',')} L0,0 Z`} fill={c[0]} opacity=".8" />
      <circle cx={-r * 0.28} cy={-r * 0.3} r={r * 0.16} fill="#fff" />
    </g>
  );
}

const CROWN_SHAPE = 'M-34,0 L-34,-10 C-36,-20 -40,-28 -42,-36 C-30,-30 -24,-24 -18,-18 C-14,-28 -6,-38 0,-46 C6,-38 14,-28 18,-18 C24,-24 30,-30 42,-36 C40,-28 36,-20 34,-10 L34,0 Z';
/** La couronne se pose sur le haut de l'anneau, sans dépasser le cercle */
const CROWN_AT = 'translate(0 -70) scale(.56)';

function Couronne({ p, u }: { p: CrownPalette; u: U }) {
  const metalUrl = `url(#${u('metal')})`;
  return (
    <>
      <defs>
        <linearGradient id={u('metal')} x1="-100" y1="-100" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          {p.metal.map((c, i) => <stop key={i} offset={i / (p.metal.length - 1)} stopColor={c} />)}
        </linearGradient>
        <linearGradient id={u('metalV')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6cf" />
          <stop offset=".35" stopColor="#f3c95a" />
          <stop offset=".6" stopColor="#b47a12" />
          <stop offset="1" stopColor="#e0a832" />
        </linearGradient>
        {p.stone && (
          <linearGradient id={u('stone')} x1="-100" y1="-100" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            {p.stone.map((c, i) => <stop key={i} offset={i / (p.stone!.length - 1)} stopColor={c} />)}
          </linearGradient>
        )}
        <TubeGradient id={u('tube')} stops={[[0.86, '#000', 0.4], [0.9, '#000', 0], [0.93, '#fff', 0.28], [0.96, '#000', 0], [0.99, '#000', 0.45]]} />
        <radialGradient id={u('velvet')} cx=".5" cy=".8" r=".8">
          <stop offset="0" stopColor="#d81b4f" />
          <stop offset="1" stopColor="#5e0a24" />
        </radialGradient>
        <radialGradient id={u('pearl')} cx=".35" cy=".3">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#f3eee2" />
          <stop offset="1" stopColor="#c9c0ad" />
        </radialGradient>
        <linearGradient id={u('sheen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={u('shine')}>
          <path d={annulus(86, 99)} clipRule="evenodd" />
          <path d={CROWN_SHAPE} transform={CROWN_AT} />
        </clipPath>
        <Blur id={u('glow')} s={1.8} />
        <Shadow id={u('shadow')} dy={1.6} s={1.5} color="#3d2603" op={0.35} />
      </defs>

      <g filter={`url(#${u('shadow')})`}>
        {/* L'anneau : métal ciselé, ou jade cerclé d'or */}
        {p.stone ? (
          <>
            <path d={annulus(86, 99)} fillRule="evenodd" fill={metalUrl} />
            <path d={annulus(88.2, 96.8)} fillRule="evenodd" fill={`url(#${u('stone')})`} />
            <g opacity=".35" filter={`url(#${u('glow')})`}>
              <path d={arc(92, 150, 210)} fill="none" stroke="#e6fff2" strokeWidth="1.4" />
              <path d={arc(93.5, 300, 345)} fill="none" stroke="#e6fff2" strokeWidth="1" />
              <path d={arc(90.5, 40, 95)} fill="none" stroke="#e6fff2" strokeWidth="1.2" />
            </g>
          </>
        ) : (
          <path d={annulus(86, 99)} fillRule="evenodd" fill={metalUrl} />
        )}
        <path d={annulus(86, 99)} fillRule="evenodd" fill={`url(#${u('tube')})`} />
        <circle r="86" fill="none" stroke="#5a3804" strokeWidth=".8" />
        <circle r="99" fill="none" stroke="#5a3804" strokeWidth=".8" />

        {/* Perles serties */}
        {Array.from({ length: 30 }, (_, i) => {
          const a = i * 12 + 6;
          if ([180, 90, 0, 270].some((g) => Math.abs(((a - g + 540) % 360) - 180) < 9)) return null;
          const [x, y] = pt(p.stone ? 97.9 : 92.5, a);
          return p.pearl || !p.stone ? (
            <circle key={i} cx={x} cy={y} r={p.stone ? 1.2 : 2} fill={p.pearl ? `url(#${u('pearl')})` : `url(#${u('metalV')})`} stroke="#6b4306" strokeWidth=".4" />
          ) : null;
        })}

        {/* Pierres aux flancs et en bas */}
        {[180, 90, 0].map((a, i) => {
          const [x, y] = pt(92.5, a);
          return (
            <g key={a} transform={`translate(${x} ${y})`}>
              <Brilliant c={p.gems[i]} r={5.2} metal={`url(#${u('metalV')})`} />
            </g>
          );
        })}

        {/* La couronne, posée sur le haut de l'anneau */}
        <g transform={CROWN_AT}>
          <g className="o" style={{ ...vars({ '--h': '-2px' }), animation: 'wkf-bob 3.4s ease-in-out infinite' }}>
            <path d="M-30,-8 C-28,-34 28,-34 30,-8 Z" fill={`url(#${u('velvet')})`} />
            <path d={CROWN_SHAPE} fill={metalUrl} stroke="#5a3804" strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="-35" y="-12" width="70" height="13" rx="2.5" fill={`url(#${u('metalV')})`} stroke="#5a3804" strokeWidth="1.2" />
            <path d="M-33,-10.5 L33,-10.5" stroke="#fff6cf" strokeWidth="1" opacity=".9" />
            {[-21, 21].map((x) => (
              <g key={x} transform={`translate(${x} -5.5) scale(.55)`}>
                <Brilliant c={p.gems[1]} r={7.5} metal={`url(#${u('metalV')})`} />
              </g>
            ))}
            <g transform="translate(0 -5.5) scale(.75)">
              <Brilliant c={p.gems[0]} r={7.5} metal={`url(#${u('metalV')})`} />
            </g>
            {[[-42, -36], [0, -46], [42, -36]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="3.6" fill={`url(#${u('pearl')})`} stroke="#8a7a5c" strokeWidth=".7" />
            ))}
            <path d="M-31,-14 C-34,-22 -36,-27 -37,-31" fill="none" stroke="#fff6cf" strokeWidth="1.5" strokeLinecap="round" opacity=".85" />
          </g>
        </g>
      </g>

      {/* Le reflet qui balaie l'or, de gauche à droite, puis repos */}
      <g clipPath={`url(#${u('shine')})`}>
        <g transform="rotate(24)">
          <g className="o" style={{ animation: 'wkf-sweep 4.8s cubic-bezier(.45,0,.25,1) infinite' }}>
            <rect x="-12" y="-130" width="24" height="260" fill={`url(#${u('sheen')})`} />
          </g>
        </g>
      </g>

      {/* Éclats sur les pierres et la couronne */}
      <Glint x={-92} y={-2} s={0.5} delay={0.2} dur={4.2} glow={u('glow')} />
      <Glint x={2} y={-94} s={0.55} delay={1.4} dur={4.6} glow={u('glow')} />
      <Glint x={92} y={-3} s={0.45} delay={2.5} dur={4} glow={u('glow')} />
      <Glint x={-22} y={-88} s={0.4} delay={3.2} dur={5} glow={u('glow')} />
      <Glint x={-3} y={92} s={0.45} delay={0.9} dur={4.4} glow={u('glow')} />
    </>
  );
}

/* ================================================================= Glitch */

function Glitch({ u }: { u: U }) {
  const slices = [
    { y: -70, h: 10, shift: 10, delay: 0.3 },
    { y: 18, h: 7, shift: -12, delay: 1.7 },
    { y: 58, h: 11, shift: 8, delay: 2.6 }
  ];
  const blocks: [number, number, string, number][] = [
    [-92, -34, '#00e5ff', 0.2], [86, -46, '#ff2bd6', 1.1], [62, 64, '#f4f1ff', 0.6],
    [-68, 62, '#00ff9c', 1.8], [90, 16, '#00e5ff', 2.4], [-30, -92, '#ff2bd6', 1.5]
  ];
  return (
    <>
      <defs>
        <clipPath id={u('band')}>
          <path d={annulus(86.5, 98)} clipRule="evenodd" />
        </clipPath>
        {slices.map((s, i) => (
          <clipPath key={i} id={u(`s${i}`)}>
            <rect x="-100" y={s.y} width="200" height={s.h} />
          </clipPath>
        ))}
        <linearGradient id={u('dark')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#25204a" />
          <stop offset="1" stopColor="#0b0a14" />
        </linearGradient>
        <Blur id={u('glow')} s={3} />
        <Blur id={u('glowS')} s={1.1} />
      </defs>

      {/* Lueur néon, côté intérieur */}
      <circle r="90" fill="none" stroke="#7a5cff" strokeWidth="8" opacity=".4" filter={`url(#${u('glow')})`} style={{ animation: 'wkf-flicker 3.3s linear infinite' }} />

      {/* Anneau d'écran : fond sombre, lignes de balayage */}
      <path d={annulus(86.5, 98)} fillRule="evenodd" fill={`url(#${u('dark')})`} />
      <g clipPath={`url(#${u('band')})`} opacity=".3">
        <g className="o" style={{ animation: 'wkf-scan .35s linear infinite' }}>
          {Array.from({ length: 52 }, (_, i) => (
            <line key={i} x1="-100" x2="100" y1={-104 + i * 4} y2={-104 + i * 4} stroke="#9fb4ff" strokeWidth=".8" />
          ))}
        </g>
      </g>

      {/* Séparation RVB permanente, secouée par à-coups */}
      <g style={{ animation: 'wkf-jitter-c 2.2s steps(1) infinite' }}>
        <circle r="92" fill="none" stroke="#00e5ff" strokeWidth="2.2" opacity=".9" filter={`url(#${u('glowS')})`} />
        <circle r="92" fill="none" stroke="#00e5ff" strokeWidth="1.2" />
      </g>
      <g style={{ animation: 'wkf-jitter-m 2.2s steps(1) infinite' }}>
        <circle r="92" fill="none" stroke="#ff2bd6" strokeWidth="2.2" opacity=".9" filter={`url(#${u('glowS')})`} />
        <circle r="92" fill="none" stroke="#ff2bd6" strokeWidth="1.2" />
      </g>
      <circle r="92" fill="none" stroke="#f4f1ff" strokeWidth=".9" style={{ animation: 'wkf-flicker 2.7s linear infinite' }} />
      <circle r="98" fill="none" stroke="#00e5ff" strokeWidth=".7" opacity=".7" />
      <circle r="86.5" fill="none" stroke="#ff2bd6" strokeWidth=".7" opacity=".7" />

      {/* Tranches déplacées */}
      {slices.map((s, i) => (
        <g key={i} clipPath={`url(#${u(`s${i}`)})`}>
          <g style={{ ...vars({ '--shift': `${s.shift}px` }), animation: `wkf-slice 3.1s steps(1) ${s.delay}s infinite` }}>
            <circle r="92" fill="none" stroke="#00e5ff" strokeWidth="9" opacity=".75" />
            <circle r="92" fill="none" stroke="#ff2bd6" strokeWidth="3" />
          </g>
        </g>
      ))}

      {/* Paquets de pixels */}
      {blocks.map(([x, y, c, d], i) => (
        <g key={i} style={{ animation: `wkf-zap 1.9s steps(1) ${d}s infinite` }}>
          <rect x={x} y={y} width="4" height="4" fill={c} />
          <rect x={x + 4} y={y} width="2.5" height="2.5" fill={c} opacity=".6" />
          <rect x={x - 2.5} y={y + 4} width="2.5" height="2.5" fill={c} opacity=".45" />
        </g>
      ))}

      {/* Étiquette d'erreur, posée sur le bas de l'anneau */}
      <g transform="translate(0 89)">
        <rect x="-15" y="-6.5" width="30" height="13" rx="3" fill="#0b0a14" stroke="#00ff9c" strokeWidth=".7" />
        <text x="-10" y="3.4" fontSize="9" fontWeight="800" fontFamily="ui-monospace, monospace" fill="#00ff9c" style={{ animation: 'wkf-flicker 2.4s linear infinite' }}>404</text>
        <rect x="8" y="-3.5" width="3.5" height="7" fill="#00ff9c" style={{ animation: 'wkf-blink 1s steps(1) infinite' }} />
      </g>
    </>
  );
}

/* ============================================================ Feux follets */

/** Les feux glissent SUR l'anneau, sans jamais le quitter. */
const WISPS = [
  { color: '#5ef2d6', r: 92.5, dur: 10, dir: 1, start: -60, bob: 2.5 },
  { color: '#7cc8ff', r: 92, dur: 13, dir: -1, start: 70, bob: 2.5 },
  { color: '#c3a2ff', r: 93, dur: 16, dir: 1, start: 170, bob: 2 },
  { color: '#a6f07a', r: 92.5, dur: 12, dir: -1, start: 250, bob: 2.5 }
];

const WISP_MOTES = (() => {
  const R = rng(81);
  return Array.from({ length: 18 }, () => ({ a: R() * 360, r: 87 + R() * 11, s: 0.5 + R() * 0.9, d: -R() * 4, dur: 2.5 + R() * 2.5 }));
})();

const FLAME = 'M0,-17 C4,-11 9,-5 9,2 C9,9 5,13 0,13 C-5,13 -9,9 -9,2 C-9,-5 -3,-9 0,-17 Z';

function FeuxFollets({ u }: { u: U }) {
  return (
    <>
      <defs>
        {WISPS.map((w, i) => (
          <React.Fragment key={i}>
            <radialGradient id={u(`h${i}`)}>
              <stop offset="0" stopColor={w.color} stopOpacity=".75" />
              <stop offset="1" stopColor={w.color} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={u(`f${i}`)} cx=".5" cy=".68" r=".7">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".35" stopColor="#f0fffd" />
              <stop offset=".75" stopColor={w.color} stopOpacity=".95" />
              <stop offset="1" stopColor={w.color} stopOpacity="0" />
            </radialGradient>
          </React.Fragment>
        ))}
        <TubeGradient id={u('mist')} stops={[[0.85, '#3fd6c3', 0], [0.92, '#3fd6c3', 0.35], [0.99, '#3fd6c3', 0]]} />
      </defs>

      {/* Anneau de brume et poussière lumineuse */}
      <path d={annulus(84, 100)} fillRule="evenodd" fill={`url(#${u('mist')})`} />
      <circle r="86.5" fill="none" stroke="#9ff7ec" strokeWidth=".9" opacity=".8" />
      <circle r="98" fill="none" stroke="#9ff7ec" strokeWidth=".6" opacity=".45" />
      <g className="o" style={{ animation: 'wkf-spin 60s linear infinite' }}>
        {WISP_MOTES.map((m, i) => {
          const [x, y] = pt(m.r, m.a);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r2(m.s)}
              fill="#d9fffa"
              style={{ ...vars({ '--lo': '.1', '--hi': '.9' }), animation: `wkf-glow ${r2(m.dur)}s ease-in-out ${r2(m.d)}s infinite` }}
            />
          );
        })}
      </g>

      {/* Les feux : chacun sur l'anneau, toujours flamme vers le haut */}
      {WISPS.map((w, i) => (
        <g key={i} transform={`rotate(${w.start})`}>
          <g className="o" style={{ animation: `${w.dir > 0 ? 'wkf-spin' : 'wkf-spin-rev'} ${w.dur}s linear infinite` }}>
            {/* Traîne de lueurs */}
            {[1, 2, 3, 4, 5].map((k) => {
              const [x, y] = pt(w.r, -w.dir * k * 4);
              return <circle key={k} cx={x} cy={y} r={r2(4.4 - k * 0.65)} fill={`url(#${u(`h${i}`)})`} opacity={r2(1 - k * 0.17)} />;
            })}
            <g transform={`translate(${w.r} 0)`}>
              <g className="o" style={{ ...vars({ '--bob': `${w.bob}px` }), animation: `wkf-wisp ${2 + i * 0.35}s ease-in-out infinite` }}>
                {/* Contre-rotation : la flamme reste droite pendant l'orbite */}
                <g transform={`rotate(${-w.start})`}>
                  <g className="o" style={{ animation: `${w.dir > 0 ? 'wkf-spin-rev' : 'wkf-spin'} ${w.dur}s linear infinite` }}>
                    <g transform="scale(.55)">
                      <circle r="16" fill={`url(#${u(`h${i}`)})`} />
                      <g className="o" style={{ animation: `wkf-wisp-flame ${0.9 + i * 0.13}s ease-in-out infinite` }}>
                        <path d={FLAME} fill={`url(#${u(`f${i}`)})`} />
                        <ellipse cx="0" cy="4" rx="3.2" ry="4.2" fill="#fff" opacity=".9" />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      ))}
    </>
  );
}

/* ================================================================== Nuage */

const PUFFS = (() => {
  const R = rng(91);
  return Array.from({ length: 34 }, (_, i) => {
    const a = i * (360 / 34) + (R() - 0.5) * 6;
    const size = 7 + R() * 3;
    // Chaque boule tient dans le cercle, respiration comprise
    const [x, y] = pt(Math.min(91 + (R() - 0.5) * 3, 98 - size * 1.06), a);
    return { x, y, r: r2(size), k: r2(1.03 + R() * 0.03), dur: r2(4 + R() * 3), delay: r2(-R() * 6) };
  });
})();

function Nuage({ u }: { u: U }) {
  const [sx, sy] = pt(90, -48);
  return (
    <>
      <defs>
        <radialGradient id={u('puff')} cx=".38" cy=".3" r=".75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#f7fafd" />
          <stop offset=".82" stopColor="#e1eaf4" />
          <stop offset="1" stopColor="#c4d3e6" />
        </radialGradient>
        <radialGradient id={u('shade')}>
          <stop offset=".5" stopColor="#8aa3c2" stopOpacity=".45" />
          <stop offset="1" stopColor="#8aa3c2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={u('sunGlow')}>
          <stop offset="0" stopColor="#fff3b0" stopOpacity=".95" />
          <stop offset=".5" stopColor="#ffd23f" stopOpacity=".4" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={u('sun')} cx=".4" cy=".35">
          <stop offset="0" stopColor="#fffbe0" />
          <stop offset=".5" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#ffa726" />
        </radialGradient>
        <Blur id={u('soft')} s={1.1} />
      </defs>

      {/* Le soleil, niché dans l'anneau, qui perce entre deux nuages */}
      <g transform={`translate(${sx} ${sy})`}>
        <circle r="15" fill={`url(#${u('sunGlow')})`} />
        <g className="o" style={{ animation: 'wkf-spin 24s linear infinite' }}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = i * 36;
            const [x0, y0] = pt(8, a - 6);
            const [x1, y1] = pt(12.5, a);
            const [x2, y2] = pt(8, a + 6);
            return <path key={i} d={`M${x0},${y0} L${x1},${y1} L${x2},${y2} Z`} fill="#ffd23f" opacity=".8" />;
          })}
        </g>
        <circle r="6.5" fill={`url(#${u('sun')})`} />
      </g>

      {/* L'anneau de nuages : une ombre douce, puis le coton éclairé.
          Chaque boule respire à son rythme : le nuage semble vivant. */}
      <g className="o" style={{ animation: 'wkf-spin 140s linear infinite' }}>
        {PUFFS.map((p, i) => <circle key={`s${i}`} cx={p.x} cy={p.y + 2.2} r={p.r + 1.2} fill={`url(#${u('shade')})`} />)}
        {PUFFS.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <g className="o" style={{ ...vars({ '--k': p.k }), animation: `wkf-breathe ${p.dur}s ease-in-out ${p.delay}s infinite` }}>
              <circle r={p.r} fill={`url(#${u('puff')})`} />
            </g>
          </g>
        ))}
      </g>

      <Glint x={-90} y={-30} s={0.35} delay={0.4} dur={4.4} color="#fff7c2" glow={u('soft')} />
      <Glint x={-50} y={80} s={0.3} delay={2.2} dur={5} color="#fff7c2" glow={u('soft')} />
    </>
  );
}

/* ============================================= Crânes affamés (Halloween) */

const SK_DUR = 6;
const SK_R = 83;
/** Taille des crânes : le plus gros possible sans sortir du cercle */
const SK_SCALE = 0.82;
/** Paires mangeur → mangé, décalées dans le temps : il y a toujours un festin en cours */
const SK_PAIRS: { a: number; b: number; delay: number }[] = [
  { a: -150, b: -98, delay: 0 },
  { a: -30, b: 22, delay: -2 },
  { a: 90, b: 142, delay: -4 }
];

const SK_CRUMBS = (() => {
  const R = rng(66);
  return Array.from({ length: 8 }, (_, i) => {
    const [dx, dy] = pt(6 + R() * 7, (i / 8) * 360 + R() * 30);
    return { dx, dy, s: r2(0.6 + R() * 0.6) };
  });
})();

/** Toile d'araignée tendue dans l'anneau : deux zigzags croisés, comme un filet. */
const SK_WEB = (() => {
  const n = 28;
  const zig = (phase: number) =>
    `M${Array.from({ length: n + 1 }, (_, i) => pt(i % 2 === phase ? 88.6 : 96.4, (i / n) * 360).join(',')).join(' L')}`;
  return { a: zig(0), b: zig(1), spokes: Array.from({ length: n }, (_, i) => (i / n) * 360) };
})();

const SK_INK = '#160913';

const anim = (name: string, delay: number, ease = 'linear') =>
  ({ animation: `${name} ${SK_DUR}s ${ease} ${delay}s infinite` }) as React.CSSProperties;

/** Un crâne, dessiné autour de (0,0), environ 26 × 28. */
function Skull({ u, delay, eater }: { u: U; delay: number; eater: boolean }) {
  return (
    <g>
      {/* Aura : verte quand il rit, rouge quand il enrage */}
      <circle r="16" fill={`url(#${u('auraG')})`} style={anim('wkf-sk-happy', delay)} />
      <circle r="17" fill={`url(#${u('auraR')})`} style={anim('wkf-sk-angry', delay)} />

      {/* Crâne */}
      <path
        d="M-13,-1 C-13,-15 -7,-19.5 0,-19.5 C7,-19.5 13,-15 13,-1 C13,4 10,6.5 9,8.5 L-9,8.5 C-10,6.5 -13,4 -13,-1 Z"
        fill={`url(#${u('bone')})`}
        stroke="#2a1636"
        strokeWidth="1"
      />
      <path d="M3.5,-19.2 l-1.6,4 l2.1,3 l-1.8,3.2" fill="none" stroke="#7a6550" strokeWidth=".7" strokeLinecap="round" />
      <ellipse cx="-7" cy="-13" rx="3.5" ry="2" fill="#fff" opacity=".55" transform="rotate(-25 -7 -13)" />

      {/* Orbites */}
      <ellipse cx="-5.2" cy="-3.5" rx="4.3" ry="4.8" fill={SK_INK} />
      <ellipse cx="5.2" cy="-3.5" rx="4.3" ry="4.8" fill={SK_INK} />

      {/* Rire : pupilles vertes, joues relevées (yeux en arc) */}
      <g style={anim('wkf-sk-happy', delay)}>
        {[-5.2, 5.2].map((x) => (
          <g key={x}>
            <circle cx={x} cy="-5" r="3.2" fill="#7dff6a" opacity=".45" />
            <circle cx={x} cy="-5" r="1.7" fill="#d9ffcf" />
          </g>
        ))}
        <path d="M-10.2,-1.2 Q-5.2,-6.4 -0.2,-1.2 L-0.2,2.2 L-10.2,2.2 Z" fill={`url(#${u('bone')})`} />
        <path d="M0.2,-1.2 Q5.2,-6.4 10.2,-1.2 L10.2,2.2 L0.2,2.2 Z" fill={`url(#${u('bone')})`} />
      </g>

      {/* Colère : sourcils en V, pupilles rouges plus petites */}
      <g style={anim('wkf-sk-angry', delay)}>
        {[-4.6, 4.6].map((x) => (
          <g key={x}>
            <circle cx={x} cy="-2.6" r="2.8" fill="#ff3b2f" opacity=".5" />
            <circle cx={x} cy="-2.6" r="1.3" fill="#ffd2c9" />
          </g>
        ))}
        <path d="M-10.4,-9.4 L-0.4,-4.2 L-0.4,-9.8 Z" fill={`url(#${u('bone')})`} />
        <path d="M10.4,-9.4 L0.4,-4.2 L0.4,-9.8 Z" fill={`url(#${u('bone')})`} />
      </g>

      {/* Nez */}
      <path d="M0,0.8 L-1.9,4.4 Q0,5.5 1.9,4.4 Z" fill={SK_INK} />

      {/* Bouche : la cavité, visible quand la mâchoire s'ouvre */}
      <ellipse cx="0" cy="11" rx="7" ry="3.4" fill={SK_INK} />

      {/* Mâchoire, articulée */}
      <g transform="translate(0 10)">
        <g className="o" style={eater ? anim('wkf-sk-jaw', delay) : undefined}>
          <path d="M-8,0 L8,0 C8,5 5,8 0,8 C-5,8 -8,5 -8,0 Z" fill={`url(#${u('bone')})`} stroke="#2a1636" strokeWidth="1" />
          <rect x="-6.5" y="0" width="13" height="3" rx=".8" fill="#f6efe0" stroke="#2a1636" strokeWidth=".5" />
          {[-3.25, 0, 3.25].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="3" stroke="#2a1636" strokeWidth=".5" />)}
        </g>
      </g>

      {/* Dents du haut */}
      <rect x="-7.5" y="6.6" width="15" height="4" rx="1" fill="#f6efe0" stroke="#2a1636" strokeWidth=".6" />
      {[-4.5, -1.5, 1.5, 4.5].map((x) => <line key={x} x1={x} y1="6.6" x2={x} y2="10.6" stroke="#2a1636" strokeWidth=".55" />)}

      {/* Le trait de bouche : sourire, puis rictus */}
      <path d="M-7.8,8.4 Q0,13.6 7.8,8.4" fill="none" stroke={SK_INK} strokeWidth="1.1" strokeLinecap="round" style={anim('wkf-sk-happy', delay)} />
      <path d="M-7.8,10.6 Q0,6.6 7.8,10.6" fill="none" stroke={SK_INK} strokeWidth="1.1" strokeLinecap="round" style={anim('wkf-sk-angry', delay)} />
    </g>
  );
}

function CranesAffames({ u }: { u: U }) {
  return (
    <>
      <defs>
        <TubeGradient
          id={u('band')}
          stops={[[0.86, '#0d0618'], [0.89, '#2a1048'], [0.92, '#4a1f7a'], [0.95, '#2a1048'], [0.985, '#0d0618']]}
        />
        {/* Os : en repère local, pour que les pièces rapportées se fondent au crâne */}
        <linearGradient id={u('bone')} x1="-10" y1="-20" x2="10" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset=".55" stopColor="#ece2cc" />
          <stop offset="1" stopColor="#c2b39a" />
        </linearGradient>
        <radialGradient id={u('auraG')}>
          <stop offset=".35" stopColor="#7dff6a" stopOpacity=".55" />
          <stop offset="1" stopColor="#7dff6a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={u('auraR')}>
          <stop offset=".35" stopColor="#ff3b2f" stopOpacity=".6" />
          <stop offset="1" stopColor="#ff3b2f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={u('smoke')}>
          <stop offset="0" stopColor="#b8ffb0" stopOpacity=".9" />
          <stop offset="1" stopColor="#7dff6a" stopOpacity="0" />
        </radialGradient>
        <Blur id={u('glow')} s={2.2} />
        <Shadow id={u('shadow')} dy={1.2} s={1} color="#05020a" op={0.55} />
      </defs>

      {/* L'anneau : violet de nuit, liseré orange citrouille */}
      <path d={annulus(86, 98.6)} fillRule="evenodd" fill={`url(#${u('band')})`} />
      <circle r="97.8" fill="none" stroke="#ff7a1a" strokeWidth="4" opacity=".55" filter={`url(#${u('glow')})`} />
      <circle r="98" fill="none" stroke="#ff8a2a" strokeWidth="1.2" />
      <circle r="86.4" fill="none" stroke="#ff9a3c" strokeWidth=".7" opacity=".7" />

      {/* La toile, tendue comme un filet */}
      <g stroke="#eadcff" fill="none" strokeLinejoin="round">
        <path d={SK_WEB.a} strokeWidth=".55" opacity=".5" />
        <path d={SK_WEB.b} strokeWidth=".55" opacity=".5" />
        {SK_WEB.spokes.map((a) => {
          const [x0, y0] = pt(86.6, a);
          const [x1, y1] = pt(98, a);
          return <line key={a} x1={x0} y1={y0} x2={x1} y2={y1} strokeWidth=".4" opacity=".3" />;
        })}
      </g>

      {/* Traînées spectrales, comme des coups de pinceau lumineux */}
      <g className="o" style={{ animation: 'wkf-spin 14s linear infinite' }}>
        {[[20, 95], [150, 215], [260, 320]].map(([a0, a1], i) => (
          <g key={i}>
            <path d={taperedArc(92.5, a0, a1, 3.6, 0.4, 70 + i, 1.4)} fill="#7dff6a" opacity=".55" filter={`url(#${u('glow')})`} />
            <path d={taperedArc(92.5, a0, a1, 1.6, 0.2, 70 + i, 1.4)} fill="#e6ffe0" opacity=".85" />
          </g>
        ))}
      </g>

      {/* Les crânes, par paires : le mangé d'abord, le mangeur passe devant */}
      {SK_PAIRS.map((p, i) => {
        const [ax, ay] = pt(SK_R, p.a);
        const [bx, by] = pt(SK_R, p.b);
        // Il s'arrête juste avant sa proie : les mâchoires se referment dessus
        const rot = r2((p.b - p.a) * 0.78);
        return (
          <g key={i} filter={`url(#${u('shadow')})`}>
            {/* Le mangé */}
            <g transform={`translate(${bx} ${by})`}>
              <circle className="o" r="12" fill={`url(#${u('smoke')})`} style={anim('wkf-sk-puff', p.delay, 'ease-out')} />
              <g className="o" style={anim('wkf-sk-eaten', p.delay, 'cubic-bezier(.3,.6,.4,1)')}>
                <g className="o" style={anim('wkf-sk-shake', p.delay)}>
                  <g transform={`scale(${SK_SCALE})`}>
                    <Skull u={u} delay={p.delay} eater={false} />
                  </g>
                </g>
              </g>
              {SK_CRUMBS.map((c, k) => (
                <g
                  key={k}
                  className="o"
                  style={{ ...vars({ '--dx': `${c.dx}px`, '--dy': `${c.dy}px` }), ...anim('wkf-sk-crumb', p.delay, 'ease-out') }}
                >
                  <path transform={`scale(${c.s})`} d="M-1.6,-1 L1.4,-1.6 L1.8,1 L-1,1.6 Z" fill="#ece2cc" stroke="#2a1636" strokeWidth=".4" />
                </g>
              ))}
            </g>

            {/* Le mangeur : il bondit LE LONG de l'anneau (rotation autour du
                centre) en restant droit (contre-rotation), sans couper la photo */}
            <g className="o" style={{ ...vars({ '--rot': `${rot}deg` }), ...anim('wkf-sk-lunge', p.delay, 'cubic-bezier(.45,0,.3,1)') }}>
              <g transform={`translate(${ax} ${ay})`}>
                <g className="o" style={{ ...vars({ '--rot': `${rot}deg` }), ...anim('wkf-sk-unrot', p.delay, 'cubic-bezier(.45,0,.3,1)') }}>
                  <g className="o" style={anim('wkf-sk-shake', p.delay)}>
                    <g transform={`scale(${SK_SCALE})`}>
                      <Skull u={u} delay={p.delay} eater />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        );
      })}
    </>
  );
}

/* ======================================================= Érable du Canada */

/** La feuille d'érable du drapeau, tige comprise, centrée, haute de 20. */
const MAPLE =
  'M0,-10 L-1.6,-6.8 C-1.8,-6.4 -2.1,-6.4 -2.5,-6.6 L-3.6,-7.2 L-2.8,-2.6 C-2.6,-1.8 -3.1,-1.7 -3.6,-2.3 L-5.2,-4.1 L-5.6,-2.8 ' +
  'C-5.7,-2.5 -5.9,-2.4 -6.2,-2.5 L-8.4,-3 L-7.6,-0.4 C-7.4,0.1 -7.5,0.4 -7.9,0.6 L-8.6,1 L-4.5,4.3 C-4.1,4.6 -4,4.9 -4.1,5.3 ' +
  'L-4.5,6.6 L-0.6,6.1 C-0.3,6.1 -0.1,6.3 -0.1,6.6 L-0.3,10 L0.3,10 L0.1,6.6 C0.1,6.3 0.3,6.1 0.6,6.1 L4.5,6.6 L4.1,5.3 ' +
  'C4,4.9 4.1,4.6 4.5,4.3 L8.6,1 L7.9,0.6 C7.5,0.4 7.4,0.1 7.6,-0.4 L8.4,-3 L6.2,-2.5 C5.9,-2.4 5.7,-2.5 5.6,-2.8 L5.2,-4.1 ' +
  'L3.6,-2.3 C3.1,-1.7 2.6,-1.8 2.8,-2.6 L3.6,-7.2 L2.5,-6.6 C2.1,-6.4 1.8,-6.4 1.6,-6.8 Z';

/** Nervures : du pétiole vers chaque lobe */
const MAPLE_VEINS = 'M0,6 L0,-8.5 M0,3 L-6.8,-1.6 M0,3 L6.8,-1.6 M0,4.6 L-4,5.6 M0,4.6 L4,5.6 M0,0 L-3,-5.2 M0,0 L3,-5.2';

/** Trois teintes d'automne : rouge érable, orange, or */
const MAPLE_TONES = ['red', 'orange', 'gold'] as const;

const MAPLE_DATA = (() => {
  const R = rng(121);
  // Une couronne de feuillage dense, sauf au pied de l'anneau où dort la congère
  const angles = [
    ...Array.from({ length: 17 }, (_, i) => -178 + i * 13.5),
    ...Array.from({ length: 6 }, (_, i) => 138 + i * 13)
  ];
  const leaves = angles.map((a) => ({
    a: a + (R() - 0.5) * 6,
    r: 88.5 + (R() - 0.5) * 3,
    s: 0.78 + R() * 0.28,
    rot: a + 90 + (R() - 0.5) * 70,
    tone: MAPLE_TONES[Math.floor(R() * 3)],
    dur: 3.4 + R() * 2.4,
    delay: -R() * 5
  }));
  const falling = Array.from({ length: 4 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (40 + R() * 40),
    s: 0.32 + R() * 0.12,
    tone: MAPLE_TONES[i % 3],
    dur: 7 + R() * 4,
    delay: -R() * 11,
    sx: 8 + R() * 10,
    flutter: 2.6 + R() * 2
  }));
  // Les flocons évitent plutôt le centre de la photo : la neige encadre le visage
  const flakes = Array.from({ length: 30 }, () => {
    const side = R() < 0.5 ? -1 : 1;
    const x = R() < 0.1 ? (R() - 0.5) * 70 : side * (50 + R() * 46);
    return {
      x: r2(x),
      r: r2(0.7 + R() * 1.3),
      dur: r2(5 + R() * 5),
      delay: r2(-R() * 10),
      sx: r2((R() - 0.5) * 14),
      crystal: R() < 0.13
    };
  });
  return { leaves, falling, flakes };
})();

/** Cristal de neige à six branches */
function Crystal({ s }: { s: number }) {
  return (
    <g transform={`scale(${s})`} stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round">
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <line x1="0" y1="-6" x2="0" y2="6" />
          <path d="M-1.8,-4.2 L0,-2.6 L1.8,-4.2 M-1.8,4.2 L0,2.6 L1.8,4.2" fill="none" />
        </g>
      ))}
    </g>
  );
}

function ErableCanada({ u }: { u: U }) {
  return (
    <>
      <defs>
        <linearGradient id={u('bark')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b4a39" />
          <stop offset=".5" stopColor="#3b261c" />
          <stop offset="1" stopColor="#5a3d2e" />
        </linearGradient>
        <linearGradient id={u('red')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a4d" />
          <stop offset=".55" stopColor="#d62828" />
          <stop offset="1" stopColor="#8f1414" />
        </linearGradient>
        <linearGradient id={u('orange')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb057" />
          <stop offset=".55" stopColor="#f77f00" />
          <stop offset="1" stopColor="#b84d00" />
        </linearGradient>
        <linearGradient id={u('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset=".55" stopColor="#fcbf49" />
          <stop offset="1" stopColor="#c98a12" />
        </linearGradient>
        <linearGradient id={u('snow')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d6e6f5" />
        </linearGradient>
        <radialGradient id={u('flake')}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#ffffff" stopOpacity=".85" />
          <stop offset="1" stopColor="#e6f2ff" stopOpacity="0" />
        </radialGradient>
        <Blur id={u('glow')} s={3} />
        <Blur id={u('soft')} s={0.5} />
        <Shadow id={u('shadow')} dy={1.4} s={1.2} color="#2a1208" op={0.32} />
      </defs>

      {/* Air froid : un halo bleuté autour de la photo */}
      <circle r="92" fill="none" stroke="#bfe0ff" strokeWidth="11" opacity=".45" filter={`url(#${u('glow')})`} />

      <g filter={`url(#${u('shadow')})`}>
        {/* Deux branches d'érable, effilées, qui se croisent en couronne */}
        <path d={taperedArc(92.5, 120, 386, 7.5, 2.4, 131)} fill={`url(#${u('bark')})`} />
        <path d={taperedArc(94, 300, 470, 5.2, 1.8, 132)} fill={`url(#${u('bark')})`} />
        <path d={arc(91, 160, 250)} fill="none" stroke="#9a7259" strokeWidth=".9" strokeLinecap="round" opacity=".55" />
        {[[-150, 14], [-60, -14], [30, 16], [160, -14], [235, 14]].map(([a, da]) => {
          const [x0, y0] = pt(92.5, a);
          const [x1, y1] = pt(88.5, a + da);
          return <path key={a} d={twig(x0, y0, x1, y1, 1.2)} fill={`url(#${u('bark')})`} />;
        })}

        {/* Neige posée sur le dessus des branches */}
        <path d={taperedArc(96.2, -168, -12, 3.2, 1.2, 141, 0.8)} fill={`url(#${u('snow')})`} />
        <path d={taperedArc(96.6, 150, 188, 2.2, 0.8, 142, 0.5)} fill={`url(#${u('snow')})`} />

        {/* Les feuilles, chacune bercée par le vent à son rythme */}
        {MAPLE_DATA.leaves.map((l, i) => {
          const [x, y] = pt(l.r, l.a);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g className="o" style={{ ...vars({ '--amp': '6deg' }), animation: `wkf-sway ${r2(l.dur)}s ease-in-out ${r2(l.delay)}s infinite` }}>
                <g transform={`rotate(${r2(l.rot)}) scale(${r2(l.s)})`}>
                  <path d={MAPLE} fill={`url(#${u(l.tone)})`} />
                  <path d={MAPLE_VEINS} fill="none" stroke="#5a0f0f" strokeWidth=".45" opacity=".45" />
                  <path d="M-3,-5 Q-1,-7 0,-8" fill="none" stroke="#fff" strokeWidth=".7" opacity=".5" strokeLinecap="round" />
                </g>
              </g>
            </g>
          );
        })}

        {/* Une congère au pied de l'anneau, ombrée de bleu */}
        <path d={taperedArc(94.5, 58, 122, 6.5, 2, 151, 1.2)} fill={`url(#${u('snow')})`} />
        <path d={arc(97, 70, 110)} fill="none" stroke="#a9c7e6" strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
      </g>

      {/* Feuilles qui se détachent et tombent en virevoltant */}
      {MAPLE_DATA.falling.map((f, i) => (
        <g key={i} transform={`translate(${r2(f.x)} -88)`}>
          <g className="o" style={{ ...vars({ '--sx': `${r2(f.sx)}px` }), animation: `wkf-fall ${r2(f.dur)}s linear ${r2(f.delay)}s infinite` }}>
            <g className="c" style={{ animation: `wkf-flutter ${r2(f.flutter)}s linear infinite` }}>
              <path transform={`scale(${r2(f.s)})`} d={MAPLE} fill={`url(#${u(f.tone)})`} />
            </g>
          </g>
        </g>
      ))}

      {/* La neige qui tombe : des flocons doux, et quelques cristaux qui tournent */}
      {MAPLE_DATA.flakes.map((f, i) => (
        <g key={i} transform={`translate(${f.x} -100)`}>
          <g className="o" style={{ ...vars({ '--sx': `${f.sx}px` }), animation: `wkf-snow ${f.dur}s linear ${f.delay}s infinite` }}>
            {f.crystal ? (
              <g className="c" style={{ animation: `wkf-spin ${r2(f.dur * 0.6)}s linear infinite` }}>
                <Crystal s={r2(0.38 + f.r * 0.12)} />
              </g>
            ) : (
              <circle r={f.r * 1.6} fill={`url(#${u('flake')})`} />
            )}
          </g>
        </g>
      ))}
    </>
  );
}

/* ======================================================= Tempête de sable */

const SAND_DUR = 8;

/** Voiles de sable : de longues écharpes douces, chacune sur son orbite */
const SAND_VEILS = [
  { r: 88.5, a0: 0, a1: 150, w: 7, color: '#d9a05a', op: 0.55, dur: 2.6, dir: 1, seed: 201 },
  { r: 93, a0: 40, a1: 230, w: 9, color: '#e8bb73', op: 0.6, dur: 3.4, dir: 1, seed: 202 },
  { r: 96.5, a0: 160, a1: 300, w: 6, color: '#c98a3e', op: 0.5, dur: 2.1, dir: 1, seed: 203 },
  { r: 91, a0: 200, a1: 340, w: 8, color: '#f2cf8e', op: 0.55, dur: 4.2, dir: -1, seed: 204 },
  { r: 85, a0: 90, a1: 190, w: 5, color: '#e3ad62', op: 0.45, dur: 3, dir: 1, seed: 205 }
];

/** Grains : trois nuées qui filent à des vitesses différentes */
const SAND_GRAINS = (() => {
  const R = rng(211);
  return [1.6, 2.4, 3.6].map((dur, k) => ({
    dur,
    grains: Array.from({ length: 16 }, () => ({
      ...(() => { const [x, y] = pt(83 + R() * 16, R() * 360); return { x, y }; })(),
      r: r2(0.45 + R() * 0.9),
      c: ['#a8682a', '#d9a05a', '#fff1c9'][Math.floor(R() * 3)],
      k
    }))
  }));
})();

/**
 * Nuées de sable : des grappes de boules gonflées, ombrées en bas, éclairées
 * en haut — le volume « cartoon » d'un nuage de poussière. Deux couronnes qui
 * tournent en sens contraires font le tourbillon.
 */
const SAND_CLOUDS = [0, 1].map((ring) => {
  const R = rng(231 + ring);
  const puffs: { x: number; y: number; r: number }[] = [];
  const clumps = ring ? 5 : 6;
  for (let c = 0; c < clumps; c++) {
    const center = (c / clumps) * 360 + R() * 25;
    for (let k = 0; k < 5; k++) {
      const a = center + (k - 2) * (5 + R() * 4);
      const size = (ring ? 5.5 : 7) + R() * 5;
      const [x, y] = pt(Math.min((ring ? 86 : 91) + (R() - 0.5) * 6, 99 - size), a);
      puffs.push({ x, y, r: r2(size) });
    }
  }
  return { puffs, dur: ring ? 4.2 : 3, dir: ring ? -1 : 1 };
});

/** Traits de vitesse : des arcs fins qui filent */
const SAND_STREAKS = (() => {
  const R = rng(241);
  return Array.from({ length: 14 }, () => {
    const a0 = R() * 360;
    return { r: r2(82 + R() * 17), a0: r2(a0), a1: r2(a0 + 18 + R() * 40), c: R() < 0.5 ? '#fff3d6' : '#9a5c22', w: r2(0.5 + R() * 0.7) };
  });
})();

/** Rides de la dune : des vagues fines qui suivent l'anneau */
const SAND_RIPPLES = (() => {
  const lines: string[] = [];
  [89, 92.5, 96].forEach((r, k) => {
    const n = 90;
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const a = (i / n) * 360;
      return pt(r + Math.sin(rad(a) * 18 + k) * 0.9, a).join(',');
    });
    lines.push(`M${pts.join(' L')}`);
  });
  return lines;
})();

function TempeteSable({ u }: { u: U }) {
  const cycle = (name: string) => ({ animation: `${name} ${SAND_DUR}s ease-in-out infinite` });
  return (
    <>
      <defs>
        <TubeGradient
          id={u('dune')}
          stops={[[0.86, '#8a5220'], [0.885, '#c98a3e'], [0.91, '#ecbc72'], [0.932, '#fbe2a8'], [0.955, '#e3ad62'], [0.975, '#b8742f'], [0.99, '#7a4518']]}
        />
        <radialGradient id={u('dust')} cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <stop offset=".78" stopColor="#e8bb73" stopOpacity="0" />
          <stop offset=".9" stopColor="#e8bb73" stopOpacity=".55" />
          <stop offset="1" stopColor="#e8bb73" stopOpacity=".15" />
        </radialGradient>
        <radialGradient id={u('puff')} cx=".38" cy=".3" r=".75">
          <stop offset="0" stopColor="#fff1cf" />
          <stop offset=".45" stopColor="#f0c681" />
          <stop offset=".8" stopColor="#d49a52" />
          <stop offset="1" stopColor="#a8682a" stopOpacity=".7" />
        </radialGradient>
        <radialGradient id={u('puffShade')}>
          <stop offset=".5" stopColor="#6b3a12" stopOpacity=".35" />
          <stop offset="1" stopColor="#6b3a12" stopOpacity="0" />
        </radialGradient>
        <Blur id={u('soft')} s={1.4} />
        <Blur id={u('haze')} s={3.2} />
        {/* Bords de nuée adoucis : de la poussière, pas des bulles */}
        <Blur id={u('dusty')} s={1.1} />
        <Shadow id={u('shadow')} dy={1.4} s={1.3} color="#5a3010" op={0.3} />
      </defs>

      {/* La dune, éclairée par un soleil d'après-midi */}
      <g filter={`url(#${u('shadow')})`}>
        <path d={annulus(86, 98.8)} fillRule="evenodd" fill={`url(#${u('dune')})`} />
      </g>
      <path d={arc(94.5, 200, 270)} fill="none" stroke="#fff6dc" strokeWidth="2" strokeLinecap="round" opacity=".7" filter={`url(#${u('soft')})`} />

      {/* Les rides du sable : visibles quand la tempête retombe */}
      <g style={cycle('wkf-calm')}>
        {SAND_RIPPLES.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="#a8682a" strokeWidth=".7" opacity=".55" />
            <path d={d} transform="rotate(.8)" fill="none" stroke="#fff1c9" strokeWidth=".5" opacity=".6" />
          </g>
        ))}
      </g>

      {/* La tempête : brume, voiles et grains, qui retombent en fin de cycle */}
      <g style={cycle('wkf-storm')}>
        <path
          d={annulus(80, 100)}
          fillRule="evenodd"
          fill={`url(#${u('dust')})`}
          style={{ ...vars({ '--lo': '.6', '--hi': '1' }), animation: 'wkf-glow 1.7s ease-in-out infinite' }}
        />
        {SAND_VEILS.map((v, i) => (
          <g key={i} className="o" style={{ animation: `${v.dir > 0 ? 'wkf-spin' : 'wkf-spin-rev'} ${v.dur}s linear infinite` }}>
            <path d={taperedArc(v.r, v.a0, v.a1, v.w, 0.6, v.seed, 1.6)} fill={v.color} opacity={v.op} filter={`url(#${u('haze')})`} />
            <path d={taperedArc(v.r - 0.8, v.a0 + 15, v.a1 - 10, v.w * 0.35, 0.2, v.seed + 50, 1.6)} fill="#fff4d6" opacity=".55" filter={`url(#${u('soft')})`} />
          </g>
        ))}
        {SAND_CLOUDS.map((cl, k) => (
          <g key={`c${k}`} className="o" filter={`url(#${u('dusty')})`} style={{ animation: `${cl.dir > 0 ? 'wkf-spin' : 'wkf-spin-rev'} ${cl.dur}s linear infinite` }}>
            {cl.puffs.map((p, i) => <circle key={`s${i}`} cx={p.x} cy={p.y + 2} r={p.r + 1} fill={`url(#${u('puffShade')})`} />)}
            {cl.puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={`url(#${u('puff')})`} />)}
          </g>
        ))}
        <g className="o" style={{ animation: 'wkf-spin 1.2s linear infinite' }}>
          {SAND_STREAKS.map((t, i) => (
            <path key={i} d={arc(t.r, t.a0, t.a1)} fill="none" stroke={t.c} strokeWidth={t.w} strokeLinecap="round" opacity=".8" />
          ))}
        </g>
        {SAND_GRAINS.map((g, k) => (
          <g key={k} className="o" style={{ animation: `wkf-spin ${g.dur}s linear infinite` }}>
            {g.grains.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} />)}
          </g>
        ))}
      </g>

      {/* La traînée de vent : elle fait le tour et balaie le sable */}
      <g className="o" style={cycle('wkf-gust')}>
        <path d={taperedArc(92, -15, 80, 10, 0.5, 221, 0.8)} fill="#ffffff" opacity=".55" filter={`url(#${u('haze')})`} />
        <path d={taperedArc(92, 0, 78, 4, 0.2, 222, 0.8)} fill="#ffffff" opacity=".95" />
        {Array.from({ length: 10 }, (_, i) => {
          const [x, y] = pt(87 + ((i * 37) % 11), -4 - i * 3.2);
          return <circle key={i} cx={x} cy={y} r={r2(1.3 - i * 0.09)} fill="#e8bb73" opacity={r2(0.9 - i * 0.08)} />;
        })}
        <path d={taperedArc(87.5, 10, 60, 1.4, 0.15, 223, 0.6)} fill="#fff6dc" opacity=".85" />
        <path d={taperedArc(96.5, 5, 55, 1.2, 0.15, 224, 0.6)} fill="#fff6dc" opacity=".8" />
      </g>
    </>
  );
}

/* =============================================================== registre */

const FRAMES: Record<string, (p: { u: U }) => React.ReactElement> = {
  bubblegum: ({ u }) => <Bubblegum u={u} />,
  yumego_manga: ({ u }) => <Sakura u={u} />,
  aura_ki: ({ u }) => <AuraKi u={u} />,
  flamme_dragon: ({ u }) => <FlammeDragon u={u} />,
  chapeau_paille: ({ u }) => <ChapeauPaille u={u} />,
  ninja_spirale: ({ u }) => <NinjaSpirale u={u} />,
  couronne_or: ({ u }) => <Couronne p={GOLD} u={u} />,
  couronne_jade: ({ u }) => <Couronne p={JADE} u={u} />,
  glitch: ({ u }) => <Glitch u={u} />,
  feux_follets: ({ u }) => <FeuxFollets u={u} />,
  nuage: ({ u }) => <Nuage u={u} />,
  halloween_2026: ({ u }) => <CranesAffames u={u} />,
  erable_canada: ({ u }) => <ErableCanada u={u} />,
  tempete_sable: ({ u }) => <TempeteSable u={u} />
};

interface AnimatedFrameProps {
  /** Identifiant du contour (voir lib/profileFrames) */
  id: string;
  /** Fige le dessin — pour les avatars minuscules */
  still?: boolean;
  className?: string;
}

/**
 * Le contour, à poser dans un parent `relative` de la taille de l'avatar.
 * Il en épouse exactement la boîte, et rien ne sort du cercle.
 *
 * Hors de l'écran, il se met en pause : un fil de forum peut aligner vingt
 * avatars animés, seuls ceux qu'on voit doivent consommer quelque chose.
 */
export default function AnimatedFrame({ id, still, className = '' }: AnimatedFrameProps) {
  const uid = 'f' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = React.useRef<SVGSVGElement>(null);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Les animations SMIL (le bruit du feu) ne suivent pas animation-play-state :
  // on les suspend à la main, hors écran comme en mouvement réduit.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still || !visible || reduce) el.pauseAnimations?.();
    else el.unpauseAnimations?.();
  }, [still, visible]);

  const Frame = FRAMES[id];
  if (!Frame) return null;
  const u: U = (k) => `${uid}-${k}`;

  return (
    <svg
      ref={ref}
      viewBox={`${-EDGE} ${-EDGE} ${EDGE * 2} ${EDGE * 2}`}
      aria-hidden="true"
      className={`wkf absolute inset-0 z-10 h-full w-full ${still || !visible ? 'wkf-static' : ''} ${className}`}
    >
      <defs>
        <clipPath id={u('edge')}>
          <circle r={EDGE} />
        </clipPath>
      </defs>
      {/* La garantie : tout ce qui sortirait du cercle est découpé */}
      <g clipPath={`url(#${u('edge')})`}>
        <Frame u={u} />
      </g>
    </svg>
  );
}

export function hasAnimatedFrame(id: string | null | undefined): boolean {
  return !!id && id in FRAMES;
}
