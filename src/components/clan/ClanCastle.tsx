"use client";

import React from 'react';
import ClanBanner from './ClanBanner';
import { THEMES, type ClanTheme } from '@/lib/clanThemes';
import { DecorSky, DecorFront, decorStyles } from './castleDecor';
import { KeepOrnaments, GateOrnaments } from './castleOrnaments';
import { INK, W, TOP, H, GROUND, GH, KEEP, WALL_TOP, WALLS } from './castleGeometry';

/**
 * Le château d'un clan : trois châtelets (une porte entre deux tourelles)
 * reliés par la courtine, et le donjon qui les domine.
 *
 * Charte Workyt (voir SceneArt.tsx) : formes flat, contours épais à l'encre,
 * arrondis, couleurs de la palette, aucune image externe. Tout est en SVG
 * inline.
 *
 * Le relief ne vient d'aucune texture : de l'appareillage de pierre (assises
 * décalées) et une bande d'ombre à droite de chaque volume. Les dégâts se
 * lisent sur plusieurs registres qui se cumulent — la pierre fonce, les
 * fissures apparaissent, les créneaux et les toits tombent, la fumée puis le
 * feu montent — et la porte tombée laisse une brèche et des gravats.
 *
 * ⚠️ Règles de construction, toutes nées d'un défaut visible :
 *  - chaque volume descend jusqu'au SOL : un volume qui s'arrête avant le
 *    suivant laisse un vide, et le château flotte ;
 *  - un toit se pose sur un PARAPET PLEIN, jamais sur des créneaux : les
 *    merlons dépassaient sous l'avant-toit ;
 *  - la courtine n'existe qu'ENTRE les châtelets, avec ses propres merlons :
 *    tracée d'un bout à l'autre derrière eux, elle laissait des moignons de
 *    créneaux dans les interstices.
 */

const PAPER = '#fdfaf4';

export interface CastleGate {
  name: string;
  hp: number;
  hpMax: number;
  fallen: boolean;
}

export type GateState = 'intacte' | 'entamee' | 'critique' | 'tombee';

export function gateState(g: CastleGate): GateState {
  if (g.fallen || g.hp <= 0) return 'tombee';
  const pct = g.hpMax > 0 ? g.hp / g.hpMax : 0;
  if (pct > 0.66) return 'intacte';
  if (pct > 0.2) return 'entamee';
  return 'critique';
}

/** Pierre plus sombre à mesure que la porte encaisse. */
const STONE: Record<GateState, string> = {
  intacte: '#EFE5D2',
  entamee: '#E0D2B9',
  critique: '#CDBB9E',
  tombee: '#AD9C84'
};

/** Jauges : mêmes teintes que les pastilles d'état de la page. */
const GAUGE: Record<GateState, string> = {
  intacte: '#7ed957',
  entamee: '#ffb547',
  critique: '#ff6a1a',
  tombee: '#e5484d'
};

const STATE_LABEL: Record<GateState, string> = {
  intacte: 'intacte',
  entamee: 'entamée',
  critique: 'critique',
  tombee: 'tombée'
};

/** Créneaux tombés sur le corps du châtelet (3 merlons). */
const MISSING: Record<GateState, number[]> = {
  intacte: [],
  entamee: [],
  critique: [1],
  tombee: [0, 2]
};

/** Couleur du camp : toits, fanions, bannière. */
const TEAM = {
  ally: { main: '#6ec1e4', deep: '#2f86b3' },
  enemy: { main: '#e5484d', deep: '#b3262b' }
} as const;

/* ------------------------------------------------------------ géométrie */

// W, TOP, H, GROUND, GH, KEEP, WALL_TOP : voir castleGeometry

/**
 * Silhouette d'un volume crénelé, en un seul tracé : montant gauche, crête
 * dentelée, montant droit. Un merlon manquant devient un simple palier.
 */
function crenelated(
  x: number, y: number, w: number, h: number,
  n: number, crest: number, missing: readonly number[] = []
): string {
  const u = w / (n * 2 - 1);
  let d = `M${x},${y + h} L${x},${y}`;
  for (let i = 0; i < n; i++) {
    d += missing.includes(i) ? ` h${u.toFixed(2)}` : ` v${-crest} h${u.toFixed(2)} v${crest}`;
    if (i < n - 1) d += ` h${u.toFixed(2)}`;
  }
  return `${d} L${x + w},${y + h} Z`;
}

/** Rangée de mâchicoulis : petits arcs sous un bandeau saillant. */
function corbels(x: number, y: number, w: number, n: number): string {
  const u = w / n;
  let d = `M${x},${y}`;
  for (let i = 0; i < n; i++) d += ` a${u / 2},${u / 2.4} 0 0,0 ${u},0`;
  return d;
}

/** Assises de pierre : lignes horizontales, joints verticaux décalés. */
function Courses({ x, y, w, h, clip, block = 22 }: { x: number; y: number; w: number; h: number; clip: string; block?: number }) {
  const COURSE = 11;
  const rows: React.ReactElement[] = [];

  for (let r = 0; r * COURSE < h; r++) {
    const cy = y + r * COURSE;
    if (r > 0) rows.push(<line key={`h${r}`} x1={x} y1={cy} x2={x + w} y2={cy} />);
    const offset = (r % 2) * (block / 2);
    for (let jx = x + offset; jx < x + w; jx += block) {
      rows.push(<line key={`v${r}-${jx}`} x1={jx} y1={cy} x2={jx} y2={Math.min(cy + COURSE, y + h)} />);
    }
  }

  return (
    <g clipPath={`url(#${clip})`} stroke={INK} strokeWidth="1.1" opacity="0.12">
      {rows}
    </g>
  );
}

/** Toit conique sur un parapet plein. `broken` = charpente effondrée. */
function ConeRoof({
  cx, base, half, height, color, broken
}: { cx: number; base: number; half: number; height: number; color: string; broken?: boolean }) {
  if (broken) {
    // Il ne reste que deux chevrons noircis
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d={`M${cx - half + 3},${base} l${half * 0.55},-${height * 0.45}`} />
        <path d={`M${cx + half - 3},${base} l-${half * 0.35},-${height * 0.3}`} />
      </g>
    );
  }
  return (
    <g>
      <path
        d={`M${cx - half},${base} L${cx},${base - height} L${cx + half},${base} Z`}
        fill={color}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d={`M${cx},${base - height} L${cx + half},${base} L${cx},${base} Z`} fill={INK} opacity="0.13" />
      {/* Rang de tuiles */}
      <line
        x1={cx - half * 0.5} y1={base - height * 0.45}
        x2={cx + half * 0.5} y2={base - height * 0.45}
        stroke={INK} strokeWidth="1.8" opacity="0.25" strokeLinecap="round"
      />
    </g>
  );
}

/** Petit fanion à la pointe d'un toit. */
function Pennant({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 12} stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d={`M${x},${y - 12} l11,3.5 l-11,3.5 z`} fill={color} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  );
}

/** Panache de fumée — trois boules qui montent. */
function Smoke({ x, y, cls, scale = 1, color = '#b9ad9b' }: { x: number; y: number; cls: string; scale?: number; color?: string }) {
  return (
    <g className={cls} fill={color} stroke={INK} strokeWidth="2" opacity="0.85">
      <circle cx={x} cy={y} r={5 * scale} />
      <circle cx={x + 6 * scale} cy={y - 8 * scale} r={6.5 * scale} />
      <circle cx={x + 1 * scale} cy={y - 18 * scale} r={8 * scale} />
    </g>
  );
}

/** Flamme : deux gouttes emboîtées, orange et jaune Workyt (selon le thème). */
function Flame({ x, y, cls, colors = ['#ff6a1a', '#ffb547'] }: { x: number; y: number; cls: string; colors?: readonly [string, string] }) {
  return (
    <g className={cls}>
      <path
        d={`M${x},${y} c-7,0 -9,-7 -5,-12 c1,4 3,4 4,2 c-1,-5 2,-9 5,-11 c-1,5 6,8 5,15 c0,4 -4,6 -9,6 z`}
        fill={colors[0]}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d={`M${x},${y - 1} c-3,0 -4,-4 -1,-7 c1,2 2,2 3,0 c2,3 2,7 -2,7 z`} fill={colors[1]} />
    </g>
  );
}

interface Props {
  gates: CastleGate[];
  keepHp: number;
  keepHpMax: number;
  /** 'ally' = bleu (le tien) · 'enemy' = rouge (l'adversaire) */
  side?: 'ally' | 'enemy';
  /** Graine du blason : l'écusson du clan orne la bannière du donjon. */
  bannerSeed?: string;
  /** Porte mise en avant — l'ordre du jour, ou la cible du joueur */
  highlight?: string | null;
  /**
   * Porte que l'ENNEMI a désignée, révélée par l'Éclaireur.
   *
   * Volontairement distincte de `highlight` : un halo orange pointillé, c'est
   * « c'est là qu'on frappe » ; un halo rouge plein, c'est « c'est là qu'on
   * va nous frapper ». Les confondre était toute l'ambiguïté de la vue.
   */
  threat?: string | null;
  onGateClick?: (gate: string) => void;
  /**
   * Bulles sous chaque porte, la pointe tournée vers elle : ce qui s'y
   * passe aujourd'hui (qui attaque, qui défend, avec quelle force).
   */
  bubbles?: Partial<Record<string, React.ReactNode>>;
  /**
   * Chiffres sous le dessin (donjon et portes). À couper quand la page les
   * affiche déjà ailleurs : deux fois la même jauge, c'est du bruit.
   */
  details?: boolean;
  /** Thème saisonnier : décor seulement, jamais les couleurs des camps */
  theme?: ClanTheme;
  className?: string;
}

export default function ClanCastle({
  gates,
  keepHp,
  keepHpMax,
  side = 'ally',
  bannerSeed,
  highlight,
  threat,
  onGateClick,
  bubbles,
  details = true,
  theme = THEMES.classique,
  className
}: Props) {
  const team = TEAM[side];
  const decor = theme.castle;
  const keepPct = keepHpMax > 0 ? Math.max(0, Math.min(1, keepHp / keepHpMax)) : 0;
  const keepDown = keepPct <= 0;
  const keepHurt = !keepDown && keepPct < 0.5;

  // Les identifiants de clipPath doivent être uniques : deux châteaux
  // cohabitent à l'écran. Selon la version de React, useId contient « : » ou
  // « « » » qui cassent url(#…) et les sélecteurs CSS : on ne garde que le sûr.
  const uid = 'castle' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const keepCx = KEEP.x + KEEP.w / 2;
  const keepBody = `M${KEEP.x},${GROUND} V${KEEP.top} H${KEEP.x + KEEP.w} V${GROUND} Z`;
  const keepParapet = keepDown
    ? crenelated(KEEP.x - 5, KEEP.top - 12, KEEP.w + 10, 12, 5, 8, [1, 3])
    : `M${KEEP.x - 6},${KEEP.top} V${KEEP.top - 12} H${KEEP.x + KEEP.w + 6} V${KEEP.top} Z`;

  const walls = WALLS;

  const label =
    `Château ${side === 'ally' ? 'du clan' : 'adverse'} : donjon ` +
    (keepDown ? 'abattu' : `${keepHp} sur ${keepHpMax} points`);

  return (
    <div className={className}>
      <svg viewBox={`0 ${TOP} ${W} ${H - TOP}`} className="w-full overflow-visible" role="img" aria-label={label}>
        <defs>
          <clipPath id={`${uid}-keep`}><path d={keepBody} /></clipPath>
          {walls.map((w, i) => (
            <clipPath key={i} id={`${uid}-w${i}`}>
              <path d={crenelated(w.x, WALL_TOP, w.w, GROUND - WALL_TOP, 2, 7)} />
            </clipPath>
          ))}
          {gates.map((g, i) => {
            const x = GH.xs[i];
            return (
              <React.Fragment key={g.name}>
                <clipPath id={`${uid}-b${i}`}>
                  <path d={crenelated(x + 14, GH.bodyTop, GH.w - 28, GROUND - GH.bodyTop, 3, 9, MISSING[gateState(g)])} />
                </clipPath>
                <clipPath id={`${uid}-tl${i}`}>
                  <rect x={x} y={GH.turretTop} width={GH.turretW} height={GROUND - GH.turretTop} />
                </clipPath>
                <clipPath id={`${uid}-tr${i}`}>
                  <rect x={x + GH.w - GH.turretW} y={GH.turretTop} width={GH.turretW} height={GROUND - GH.turretTop} />
                </clipPath>
              </React.Fragment>
            );
          })}
          <style>{`
            @keyframes ${uid}-march { to { stroke-dashoffset: -24; } }
            .${uid}-march { animation: ${uid}-march 1.2s linear infinite; }
            @keyframes ${uid}-pulse { 0%,100% { opacity: .95; } 50% { opacity: .4; } }
            .${uid}-pulse { animation: ${uid}-pulse 1.6s ease-in-out infinite; }
            @keyframes ${uid}-rise { 0% { transform: translateY(2px); opacity: .9; } 100% { transform: translateY(-5px); opacity: .55; } }
            .${uid}-smoke { animation: ${uid}-rise 2.4s ease-in-out infinite alternate; }
            @keyframes ${uid}-flick { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.82); } }
            .${uid}-flame { animation: ${uid}-flick .5s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
            .${uid}-gate { transition: transform .18s ease; transform-box: fill-box; transform-origin: center bottom; }
            .${uid}-gate[role="button"]:hover, .${uid}-gate[role="button"]:focus-visible { transform: translateY(-3px); outline: none; }
            ${decor.decor !== 'none' ? decorStyles(uid) : ''}
            @media (prefers-reduced-motion: reduce) {
              .${uid}-march, .${uid}-pulse, .${uid}-smoke, .${uid}-flame { animation: none; }
              .${uid}-gate { transition: none; }
            }
          `}</style>
        </defs>

        {/* ── Le ciel du thème, en vignette arrondie derrière le château ── */}
        {decor.sky && (
          <>
            <defs>
              <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={decor.sky[0]} />
                <stop offset="1" stopColor={decor.sky[1]} />
              </linearGradient>
              <clipPath id={`${uid}-skyclip`}>
                <rect x={-6} y={TOP + 2} width={W + 12} height={GROUND - TOP + 2} rx="18" />
              </clipPath>
            </defs>
            <rect x={-6} y={TOP + 2} width={W + 12} height={GROUND - TOP + 2} rx="18" fill={`url(#${uid}-sky)`} />
          </>
        )}
        <DecorSky id={decor.decor} uid={uid} />

        {/* ── Le décor : collines au loin (dans la vignette du ciel s'il y en a une), puis le tertre ── */}
        <g clipPath={decor.sky ? `url(#${uid}-skyclip)` : undefined}>
          <path d={`M-10,${GROUND - 26} C40,${GROUND - 62} 90,${GROUND - 56} 130,${GROUND - 30} L-10,${GROUND - 30} Z`} fill={decor.hills} />
          <path d={`M180,${GROUND - 30} C222,${GROUND - 70} 284,${GROUND - 66} 330,${GROUND - 34} L330,${GROUND - 30} Z`} fill={decor.hills} />
        </g>
        <path
          d={`M2,${GROUND + 5} C40,${GROUND - 8} 280,${GROUND - 8} ${W - 2},${GROUND + 5} C250,${GROUND + 11} 70,${GROUND + 11} 2,${GROUND + 5} Z`}
          fill={decor.ground}
        />
        {/* Touffes d'herbe */}
        <g stroke={decor.grass} strokeWidth="2" strokeLinecap="round" fill="none">
          {[6, 110, 214, 310].map((gx) => (
            <path key={gx} d={`M${gx},${GROUND + 2} l-2,-6 M${gx + 3},${GROUND + 2} v-8 M${gx + 6},${GROUND + 2} l2,-5`} />
          ))}
        </g>

        {/* ══════════════════ Le donjon, en retrait ══════════════════ */}
        <g>
          {keepDown ? (
            /* Hampe brisée : il n'y a plus rien à hisser */
            <path d={`M${keepCx - 8},${KEEP.top - 12} l3,-14 l-6,-6`} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <g>
              <ConeRoof cx={keepCx} base={KEEP.top - 12} half={KEEP.w / 2 + 12} height={44} color={team.main} />
              {/* Hampe et bannière — la bannière s'amenuise avec les PV du donjon */}
              <line x1={keepCx} y1={KEEP.top - 56} x2={keepCx} y2={KEEP.top - 72} stroke={INK} strokeWidth="3" strokeLinecap="round" />
              <path
                d={`M${keepCx},${KEEP.top - 72} h${10 + 14 * keepPct} l-5,${Math.max(3, 5 * keepPct + 2)} l5,${Math.max(3, 5 * keepPct + 2)} h-${10 + 14 * keepPct} z`}
                fill={team.main}
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Corps du donjon : il descend jusqu'au sol, derrière la courtine */}
          <path
            d={keepBody}
            fill={keepDown ? '#AD9C84' : keepHurt ? '#E0D2B9' : '#EAE0CC'}
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <Courses x={KEEP.x} y={KEEP.top} w={KEEP.w} h={GROUND - KEEP.top} clip={`${uid}-keep`} />
          <rect x={KEEP.x + KEEP.w - 20} y={KEEP.top} width="20" height={GROUND - KEEP.top} fill={INK} opacity="0.08" clipPath={`url(#${uid}-keep)`} />

          {/* Parapet plein, sur ses mâchicoulis : le toit repose dessus */}
          <path d={corbels(KEEP.x, KEEP.top, KEEP.w, 8)} fill="none" stroke={INK} strokeWidth="2" opacity="0.55" />
          <path d={keepParapet} fill={keepDown ? '#A08F78' : '#DED2BC'} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />

          {/* Fenêtres : allumées tant que le donjon tient */}
          {[KEEP.x + 14, KEEP.x + KEEP.w - 24].map((wx) => (
            <path
              key={wx}
              d={`M${wx},${KEEP.top + 32} v-12 a5,5 0 0,1 10,0 v12 z`}
              fill={keepDown ? '#2B211C' : '#ffb547'}
              stroke={INK}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}

          {/* Bannière à queue d'aronde, frappée de l'écusson du clan */}
          {!keepDown && (
            <g>
              <path
                d={`M${keepCx - 13},${KEEP.top + 2} h26 v38 l-13,-7 l-13,7 z`}
                fill={team.main}
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d={`M${keepCx},${KEEP.top + 2} h13 v38 l-13,-7 z`} fill={INK} opacity="0.1" />
              {bannerSeed && (
                <g transform={`translate(${keepCx - 9} ${KEEP.top + 7}) scale(0.18)`}>
                  <ClanBanner seed={bannerSeed} size={100} />
                </g>
              )}
            </g>
          )}

          {/* Le donjon entamé se fissure ; abattu, il se fend et fume */}
          {(keepDown || keepHurt) && (
            <g stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={keepDown ? 0.75 : 0.45} clipPath={`url(#${uid}-keep)`}>
              <path d={`M${KEEP.x + 8},${KEEP.top + 4} l7,14 l-5,10 l7,12`} />
              {keepDown && <path d={`M${KEEP.x + 70},${KEEP.top + 8} l-8,12 l5,11`} />}
            </g>
          )}
          {keepDown && <Smoke x={keepCx + 6} y={KEEP.top - 18} cls={`${uid}-smoke`} color={decor.smoke} scale={1.2} />}
        </g>

        {/* Ornements de saison du donjon : les châtelets passent devant */}
        <KeepOrnaments id={decor.decor} uid={uid} keepDown={keepDown} />

        {/* ══════════════════ La courtine, entre les châtelets ══════════════════ */}
        {walls.map((w, i) => (
          <g key={i}>
            <path d={crenelated(w.x, WALL_TOP, w.w, GROUND - WALL_TOP, 2, 7)} fill="#E3D7C1" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
            <Courses x={w.x} y={WALL_TOP} w={w.w} h={GROUND - WALL_TOP} clip={`${uid}-w${i}`} block={16} />
            <rect x={w.x} y={WALL_TOP} width={w.w} height="6" fill={INK} opacity="0.08" clipPath={`url(#${uid}-w${i})`} />
          </g>
        ))}

        {/* ══════════════════ Les trois châtelets ══════════════════ */}
        {gates.map((g, i) => {
          const x = GH.xs[i];
          const cx = x + GH.w / 2;
          const st = gateState(g);
          const pct = g.hpMax > 0 ? Math.max(0, Math.min(1, g.hp / g.hpMax)) : 0;
          const damage = 1 - pct;
          const isHot = highlight === g.name;
          const isThreatened = threat === g.name;
          const clickable = !!onGateClick;
          const fallen = st === 'tombee';
          const bodyX = x + 14;
          const bodyW = GH.w - 28;
          const body = crenelated(bodyX, GH.bodyTop, bodyW, GROUND - GH.bodyTop, 3, 9, MISSING[st]);
          const stone = STONE[st];

          // Les toits des tourelles tombent avant la porte : l'œil voit
          // l'érosion de loin, avant même de lire la jauge.
          const leftRoofBroken = st === 'tombee';
          const rightRoofBroken = st === 'tombee' || st === 'critique';

          // Le châtelet du centre est coiffé de créneaux, pas de toits : des
          // toits pointus y masquaient la bannière et les fenêtres du donjon.
          const roofed = i !== 1;

          const turret = (tx: number, side: 'l' | 'r', broken: boolean) => (
            <g>
              <rect x={tx} y={GH.turretTop} width={GH.turretW} height={GROUND - GH.turretTop} fill={stone} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
              <Courses x={tx} y={GH.turretTop} w={GH.turretW} h={GROUND - GH.turretTop} clip={`${uid}-t${side}${i}`} block={10} />
              <rect x={tx + GH.turretW - 7} y={GH.turretTop} width="7" height={GROUND - GH.turretTop} fill={INK} opacity="0.08" />
              {/* Archère */}
              {!fallen && (
                <path d={`M${tx + GH.turretW / 2},${GH.turretTop + 16} v10`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
              )}
              {roofed ? (
                <>
                  {/* Parapet plein, un peu plus large que la tourelle */}
                  <rect x={tx - 3} y={GH.turretTop - 7} width={GH.turretW + 6} height="8" rx="1.5" fill={stone} stroke={INK} strokeWidth="3" />
                  <ConeRoof cx={tx + GH.turretW / 2} base={GH.turretTop - 7} half={GH.turretW / 2 + 5} height={26} color={team.main} broken={broken} />
                  {!broken && <Pennant x={tx + GH.turretW / 2} y={GH.turretTop - 33} color={team.main} />}
                </>
              ) : (
                <path
                  d={crenelated(tx - 3, GH.turretTop - 1, GH.turretW + 6, 9, 2, 7, broken ? [1] : [])}
                  fill={stone}
                  stroke={INK}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );

          return (
            <g
              key={g.name}
              className={`${uid}-gate${clickable ? ' cursor-pointer' : ''}`}
              onClick={clickable ? () => onGateClick!(g.name) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onGateClick!(g.name);
                      }
                    }
                  : undefined
              }
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? 'button' : undefined}
              aria-label={
                `Porte ${g.name}, ${fallen ? 'tombée' : `${g.hp} sur ${g.hpMax} points`}` +
                (isHot ? ', désignée' : '') +
                (isThreatened ? ", visée par l'ennemi" : '')
              }
            >
              {/* Halo de menace — révélé par l'Éclaireur. Plus large que le halo
                  de désignation pour que les deux se lisent quand ils tombent
                  sur la même porte : on frappe là où on est frappé. */}
              {isThreatened && (
                <rect
                  x={x - 9}
                  y={GH.turretTop - 52}
                  width={GH.w + 18}
                  height={GROUND - GH.turretTop + 58}
                  rx="16"
                  fill="#e5484d"
                  fillOpacity="0.07"
                  stroke="#e5484d"
                  strokeWidth="3.5"
                  className={`${uid}-pulse`}
                />
              )}

              {/* Corps central, crénelé, avec ses mâchicoulis */}
              <path d={body} fill={stone} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
              <Courses x={bodyX} y={GH.bodyTop} w={bodyW} h={GROUND - GH.bodyTop} clip={`${uid}-b${i}`} />
              <g clipPath={`url(#${uid}-b${i})`}>
                <rect x={bodyX} y={GH.bodyTop} width={bodyW} height="7" fill={INK} opacity="0.09" />
                <path d={corbels(bodyX, GH.bodyTop + 7, bodyW, 5)} fill="none" stroke={INK} strokeWidth="2" opacity="0.5" />
              </g>

              {/* ── La porte ── */}
              {fallen ? (
                <g>
                  {/* Baie éventrée : on voit à travers */}
                  <path d={`M${cx - 16},${GROUND} v-22 a16,16 0 0,1 32,0 v22 z`} fill="#2B211C" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
                  {/* Vantaux arrachés, en travers de la brèche */}
                  <g fill="#B87A44" stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
                    <path d={`M${cx - 18},${GROUND - 2} l13,-20 l6,4 l-11,18 z`} />
                    <path d={`M${cx + 3},${GROUND} l15,-9 l4,6 l-13,5 z`} />
                  </g>
                </g>
              ) : (
                <g>
                  {/* Voussoirs de l'arc */}
                  <path
                    d={`M${cx - 18},${GROUND} v-24 a18,18 0 0,1 36,0 v24`}
                    fill="#D6C7AD"
                    stroke={INK}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Clé de voûte */}
                  <path d={`M${cx - 3.5},${GROUND - 43} h7 l-1.5,6 h-4 z`} fill="#C8B796" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
                  {/* Vantaux de bois, planches et ferrures */}
                  <path d={`M${cx - 13},${GROUND} v-22 a13,13 0 0,1 26,0 v22 z`} fill="#C98A4B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
                  <g stroke={INK} strokeLinecap="round">
                    <line x1={cx} y1={GROUND} x2={cx} y2={GROUND - 35} strokeWidth="2.5" />
                    <line x1={cx - 7} y1={GROUND} x2={cx - 7} y2={GROUND - 31} strokeWidth="1.4" opacity="0.4" />
                    <line x1={cx + 7} y1={GROUND} x2={cx + 7} y2={GROUND - 31} strokeWidth="1.4" opacity="0.4" />
                    <line x1={cx - 13} y1={GROUND - 9} x2={cx + 13} y2={GROUND - 9} strokeWidth="3" />
                    <line x1={cx - 13} y1={GROUND - 22} x2={cx + 13} y2={GROUND - 22} strokeWidth="3" />
                  </g>
                  <circle cx={cx - 3.5} cy={GROUND - 15} r="1.6" fill={INK} />
                  <circle cx={cx + 3.5} cy={GROUND - 15} r="1.6" fill={INK} />
                </g>
              )}

              {/* Les deux tourelles, par-dessus les bords du corps */}
              {turret(x, 'l', leftRoofBroken)}
              {turret(x + GH.w - GH.turretW, 'r', rightRoofBroken)}

              {/* Fissures : elles s'ajoutent à mesure que la porte encaisse */}
              {damage > 0.05 && (
                <g
                  stroke={INK}
                  strokeWidth="2.3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={Math.min(0.8, damage * 0.85)}
                  clipPath={`url(#${uid}-b${i})`}
                >
                  <path d={`M${bodyX + 5},${GH.bodyTop + 12} l7,10 l-4,9 l5,8`} />
                  {damage > 0.33 && <path d={`M${bodyX + bodyW - 6},${GH.bodyTop + 16} l-7,11 l4,8`} />}
                  {damage > 0.66 && <path d={`M${cx + 4},${GH.bodyTop - 4} l-4,9 l6,6`} />}
                </g>
              )}

              {/* Gravats au pied de la brèche */}
              {fallen && (
                <g fill="#B5A58C" stroke={INK} strokeWidth="2.3" strokeLinejoin="round">
                  <path d={`M${x + 2},${GROUND + 2} l8,-9 l10,3 l2,6 z`} />
                  <path d={`M${x + GH.w - 24},${GROUND + 2} l7,-7 l11,2 l4,5 z`} />
                  <circle cx={cx + 20} cy={GROUND - 3} r="3.2" />
                </g>
              )}

              {/* Fumée dès l'entame, feu quand la porte est à bout */}
              {st === 'entamee' && <Smoke x={cx + 8} y={GH.bodyTop - 12} cls={`${uid}-smoke`} color={decor.smoke} scale={0.6} />}
              {st === 'critique' && (
                <>
                  <Smoke x={cx + 4} y={GH.bodyTop - 20} cls={`${uid}-smoke`} color={decor.smoke} scale={0.75} />
                  <Flame x={cx + 2} y={GH.bodyTop - 1} cls={`${uid}-flame`} colors={decor.flame} />
                </>
              )}
              {fallen && <Smoke x={cx - 2} y={GH.bodyTop - 4} cls={`${uid}-smoke`} color={decor.smoke} />}

              {/* Halo de désignation — pointillés qui défilent : « on y va » */}
              {isHot && (
                <rect
                  x={x - 4}
                  y={GH.turretTop - 47}
                  width={GH.w + 8}
                  height={GROUND - GH.turretTop + 49}
                  rx="13"
                  fill="none"
                  stroke="#ff6a1a"
                  strokeWidth="3.5"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                  className={`${uid}-march`}
                />
              )}

              {/* Jauge de PV */}
              <rect x={x + 9} y={GROUND + 12} width={GH.w - 18} height="10" rx="5" fill={PAPER} stroke={INK} strokeWidth="2.5" />
              {pct > 0 && (
                <rect x={x + 11} y={GROUND + 14} width={Math.max(6, (GH.w - 22) * pct)} height="6" rx="3" fill={GAUGE[st]} />
              )}

              <text
                x={cx}
                y={GROUND + 42}
                textAnchor="middle"
                fill={INK}
                fontSize="14"
                fontWeight="700"
                style={{ textTransform: 'capitalize' }}
              >
                {g.name}
              </text>
            </g>
          );
        })}

        <GateOrnaments id={decor.decor} uid={uid} states={gates.map(gateState)} />
        <DecorFront id={decor.decor} uid={uid} />
      </svg>

      {/* ── Les bulles : une par porte, la pointe tournée vers elle ── */}
      {bubbles && (
        <div className="mt-1 grid grid-cols-3 gap-2">
          {gates.map((g) => (
            <div key={g.name} className="relative min-w-0">
              {bubbles[g.name] && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute -top-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-[var(--wk-ink)] bg-white"
                  />
                  <div className="rounded-2xl border-2 border-[var(--wk-ink)] bg-white px-2 py-1.5 text-[11px] leading-snug shadow-[0_3px_0_rgba(26,21,18,0.9)]">
                    {bubbles[g.name]}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {details && (
        <>
          {/* ── Le donjon, en chiffres ──
              Sur le dessin, ses PV ne se lisent que dans la taille de la
              bannière : illisible, alors que c'est LA jauge qui décide de la
              guerre dès qu'une porte est tombée (les assauts sur une brèche
              frappent le donjon, voir clanCombat.resolveGates). */}
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--wk-paper-2)] px-3 py-1.5">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(26,21,18,0.55)]">Donjon</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(26,21,18,0.1)]">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${keepPct * 100}%`,
                  backgroundColor: keepPct > 0.5 ? '#7ed957' : keepPct > 0.2 ? '#ffb547' : '#e5484d'
                }}
              />
            </span>
            <span className={`text-[11px] font-bold tabular-nums ${keepDown ? 'text-[#c2272d]' : 'text-[var(--wk-ink)]'}`}>
              {keepDown ? 'abattu' : `${keepHp}/${keepHpMax}`}
            </span>
          </div>

          {/* Chiffres, sous le dessin : l'état ne doit jamais reposer
              sur la seule couleur */}
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
            {gates.map((g) => {
              const st = gateState(g);
              return (
                <div key={g.name} className="text-[11px] leading-tight">
                  <p className="font-bold tabular-nums text-[var(--wk-ink)]">
                    {g.fallen ? '—' : `${g.hp}/${g.hpMax}`}
                  </p>
                  <p
                    className={
                      st === 'tombee' ? 'font-bold text-[#c2272d]'
                      : st === 'critique' ? 'font-semibold text-[#c24a0a]'
                      : 'text-[rgba(26,21,18,0.45)]'
                    }
                  >
                    {STATE_LABEL[st]}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
