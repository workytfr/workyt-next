"use client";

import React from 'react';
import ClanBanner from './ClanBanner';

/**
 * Le château d'un clan : trois portes et un donjon.
 *
 * Charte Workyt (voir SceneArt.tsx) : formes flat, contours épais foncés,
 * arrondis kawaii, aucune image externe. Tout est en SVG inline.
 *
 * Le relief ne vient d'aucune texture : c'est de l'appareillage de pierre
 * (lignes d'assises décalées) plus une bande d'ombre à droite de chaque volume.
 * Les dégâts se lisent sur trois registres qui se cumulent — la pierre fonce,
 * les fissures apparaissent, les créneaux s'effondrent — et la porte tombée
 * laisse des gravats. Une seule interpolation, aucun asset.
 */

const INK = '#3A2E2E';

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
  intacte: '#E4D9C6',
  entamee: '#CDBFA8',
  critique: '#B3A189',
  tombee: '#8E8070'
};

/** Créneaux tombés — l'érosion se voit avant même de lire la jauge. */
const MISSING: Record<GateState, number[]> = {
  intacte: [],
  entamee: [3],
  critique: [1, 3],
  tombee: [0, 1, 3, 4]
};

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

/** Assises de pierre : lignes horizontales, joints verticaux décalés. */
function Courses({ x, y, w, h, clip }: { x: number; y: number; w: number; h: number; clip: string }) {
  const COURSE = 11;
  const BLOCK = 20;
  const rows: React.ReactElement[] = [];

  for (let r = 0; r * COURSE < h; r++) {
    const cy = y + r * COURSE;
    if (r > 0) rows.push(<line key={`h${r}`} x1={x} y1={cy} x2={x + w} y2={cy} />);
    const offset = (r % 2) * (BLOCK / 2);
    for (let jx = x + offset; jx < x + w; jx += BLOCK) {
      rows.push(<line key={`v${r}-${jx}`} x1={jx} y1={cy} x2={jx} y2={Math.min(cy + COURSE, y + h)} />);
    }
  }

  return (
    <g clipPath={`url(#${clip})`} stroke={INK} strokeWidth="1.2" opacity="0.16">
      {rows}
    </g>
  );
}

interface Props {
  gates: CastleGate[];
  keepHp: number;
  keepHpMax: number;
  /** 'ally' = bleu (le tien) · 'enemy' = rouge (l'adversaire) */
  side?: 'ally' | 'enemy';
  /** Graine du blason : l'écusson du clan est accroché sur le donjon. */
  bannerSeed?: string;
  /** Porte mise en avant — l'ordre du jour, ou la cible du joueur */
  highlight?: string | null;
  onGateClick?: (gate: string) => void;
  className?: string;
}

export default function ClanCastle({
  gates,
  keepHp,
  keepHpMax,
  side = 'ally',
  bannerSeed,
  highlight,
  onGateClick,
  className
}: Props) {
  const banner = side === 'ally' ? '#0B4EA2' : '#C8102E';
  const keepPct = keepHpMax > 0 ? Math.max(0, Math.min(1, keepHp / keepHpMax)) : 0;
  const keepDown = keepPct <= 0;

  // Les identifiants de clipPath doivent être uniques : deux châteaux
  // cohabitent à l'écran. Les « : » de useId cassent url(#…), on les retire.
  const uid = React.useId().replace(/:/g, '');

  const TOWER_TOP = 62;
  const GROUND = 142;

  return (
    <div className={className}>
      <svg viewBox="0 0 300 190" className="w-full" role="img" aria-label="Château du clan">
        <defs>
          <clipPath id={`${uid}-keep`}>
            <path d={crenelated(120, 20, 60, 48, 5, 9, keepDown ? [1, 3] : [])} />
          </clipPath>
          <clipPath id={`${uid}-wall`}>
            <path d={crenelated(8, 96, 284, 16, 19, 7)} />
          </clipPath>
          {gates.map((g, i) => (
            <clipPath key={g.name} id={`${uid}-t${i}`}>
              <path d={crenelated(20 + i * 96, TOWER_TOP, 76, GROUND - TOWER_TOP, 5, 10, MISSING[gateState(g)])} />
            </clipPath>
          ))}
        </defs>

        {/* ── Le tertre : le château est posé sur quelque chose ── */}
        <path
          d="M0,150 C40,138 78,144 108,142 C150,139 186,145 226,141 C258,138 280,144 300,150 L300,190 L0,190 Z"
          fill="#DCCDAF"
          opacity="0.45"
        />

        {/* ══════════════════ Le donjon, en retrait ══════════════════ */}
        <g>
          {/* Hampe et bannière — la hauteur suit les PV du donjon */}
          <line x1="150" y1="20" x2="150" y2={keepDown ? 14 : 0} stroke={INK} strokeWidth="3" strokeLinecap="round" />
          {!keepDown && (
            <path
              d={`M150,2 h22 l-6,${Math.max(4, 9 * keepPct)} l6,${Math.max(4, 9 * keepPct)} h-22 z`}
              fill={banner}
              stroke={INK}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          <path
            d={crenelated(120, 20, 60, 48, 5, 9, keepDown ? [1, 3] : [])}
            fill={keepDown ? '#9A8B78' : '#D9CCB6'}
            stroke={INK}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <Courses x={120} y={20} w={60} h={48} clip={`${uid}-keep`} />
          {/* Ombre portée à droite : le volume se lit sans dégradé */}
          <rect x="164" y="20" width="16" height="48" fill={INK} opacity="0.09" clipPath={`url(#${uid}-keep)`} />

          {/* L'écusson du clan, accroché sur la face du donjon.
              Un <svg> imbriqué est valide : on le place par une transformation
              plutôt que de le superposer en HTML, pour qu'il suive l'échelle. */}
          {bannerSeed && (
            <g transform="translate(135 26) scale(0.3)" opacity={keepDown ? 0.5 : 1}>
              <ClanBanner seed={bannerSeed} size={100} />
            </g>
          )}

          {/* Archères, de part et d'autre de l'écusson */}
          {[127, 170].map((bx) => (
            <path
              key={bx}
              d={`M${bx + 1.5},34 v11 M${bx - 2},39 h7`}
              stroke={INK}
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}

          {/* Le donjon abattu se fend de haut en bas */}
          {keepDown && (
            <g stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75">
              <path d="M138,24 l6,14 l-5,10 l7,12" />
              <path d="M166,30 l-7,12 l5,11" />
            </g>
          )}
        </g>

        {/* ══════════════════ La courtine, derrière les tours ══════════════════ */}
        <g>
          <path
            d={crenelated(8, 96, 284, 16, 19, 7)}
            fill="#CFC2AC"
            stroke={INK}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <Courses x={8} y={96} w={284} h={16} clip={`${uid}-wall`} />
        </g>

        {/* ══════════════════ Les trois tours-portes ══════════════════ */}
        {gates.map((g, i) => {
          const x = 20 + i * 96;
          const st = gateState(g);
          const pct = g.hpMax > 0 ? Math.max(0, Math.min(1, g.hp / g.hpMax)) : 0;
          const damage = 1 - pct;
          const isHot = highlight === g.name;
          const clickable = !!onGateClick;
          const fallen = st === 'tombee';

          return (
            <g
              key={g.name}
              onClick={clickable ? () => onGateClick!(g.name) : undefined}
              className={clickable ? 'cursor-pointer' : undefined}
              role={clickable ? 'button' : undefined}
              aria-label={`Porte ${g.name}, ${g.fallen ? 'tombée' : `${g.hp} sur ${g.hpMax} points`}`}
            >
              {/* Corps de la tour, créneaux compris */}
              <path
                d={crenelated(x, TOWER_TOP, 76, GROUND - TOWER_TOP, 5, 10, MISSING[st])}
                fill={STONE[st]}
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Courses x={x} y={TOWER_TOP} w={76} h={GROUND - TOWER_TOP} clip={`${uid}-t${i}`} />
              <rect
                x={x + 54}
                y={TOWER_TOP}
                width={22}
                height={GROUND - TOWER_TOP}
                fill={INK}
                opacity="0.09"
                clipPath={`url(#${uid}-t${i})`}
              />

              {/* Mâchicoulis : le bandeau saillant sous les créneaux */}
              <g stroke={INK} strokeWidth="2.5" clipPath={`url(#${uid}-t${i})`}>
                <line x1={x} y1={TOWER_TOP + 12} x2={x + 76} y2={TOWER_TOP + 12} />
                {[10, 25, 40, 55, 66].map((o) => (
                  <line key={o} x1={x + o} y1={TOWER_TOP + 12} x2={x + o} y2={TOWER_TOP + 4} strokeWidth="2" opacity="0.6" />
                ))}
              </g>

              {/* Archères, de part et d'autre de la porte */}
              {!fallen && [16, 60].map((o) => (
                <path
                  key={o}
                  d={`M${x + o},${TOWER_TOP + 24} v9 M${x + o - 3.5},${TOWER_TOP + 28} h7`}
                  stroke={INK}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}

              {/* ── La porte ── */}
              {fallen ? (
                <g>
                  {/* Baie éventrée : on voit à travers */}
                  <path d={`M${x + 21},${GROUND} v-24 a17,17 0 0,1 34,0 v24 z`} fill="#241D1B" stroke={INK} strokeWidth="3.5" />
                  {/* Herse arrachée, tordue en travers */}
                  <path
                    d={`M${x + 25},${GROUND} l6,-20 l11,9 l9,-13 l4,24`}
                    fill="none"
                    stroke="#8E8070"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {/* Gravats au pied de la brèche */}
                  <g fill="#9A8B78" stroke={INK} strokeWidth="2" strokeLinejoin="round">
                    <path d={`M${x + 8},${GROUND} l7,-8 l9,3 l2,5 z`} />
                    <path d={`M${x + 52},${GROUND} l6,-6 l10,2 l3,4 z`} />
                    <path d={`M${x + 34},${GROUND} l5,-5 l7,2 l1,3 z`} />
                  </g>
                </g>
              ) : (
                <g>
                  {/* Voussoirs de l'arc */}
                  <path
                    d={`M${x + 18},${GROUND} v-26 a20,20 0 0,1 40,0 v26`}
                    fill="#C2B39B"
                    stroke={INK}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Baie */}
                  <path d={`M${x + 23},${GROUND} v-23 a15,15 0 0,1 30,0 v23 z`} fill="#5E4A3D" stroke={INK} strokeWidth="3" />
                  {/* Herse à barreaux — pas un aplat : on voit la grille */}
                  <g stroke="#241D1B" strokeWidth="2.2" opacity="0.8">
                    {[30, 38, 46].map((o) => (
                      <line key={o} x1={x + o} y1={GROUND} x2={x + o} y2={GROUND - 30} />
                    ))}
                    {[10, 20].map((o) => (
                      <line key={o} x1={x + 24} y1={GROUND - o} x2={x + 52} y2={GROUND - o} />
                    ))}
                  </g>
                </g>
              )}

              {/* Fissures : opacité proportionnelle aux dégâts, aucun asset */}
              <g
                stroke={INK}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={Math.max(0, damage * 0.8)}
                clipPath={`url(#${uid}-t${i})`}
              >
                <path d={`M${x + 9},${TOWER_TOP + 16} l8,13 l-5,11 l6,9`} />
                <path d={`M${x + 67},${TOWER_TOP + 26} l-9,14 l6,10 l-4,8`} />
                <path d={`M${x + 38},${TOWER_TOP + 2} l-5,12 l8,9`} />
              </g>

              {/* Halo de désignation */}
              {isHot && (
                <rect
                  x={x - 5}
                  y={TOWER_TOP - 14}
                  width="86"
                  height={GROUND - TOWER_TOP + 20}
                  rx="9"
                  fill="none"
                  stroke="#ff6a1a"
                  strokeWidth="4"
                  strokeDasharray="7 5"
                />
              )}

              {/* Jauge de PV */}
              <rect x={x + 6} y="150" width="64" height="9" rx="4.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
              <rect
                x={x + 8}
                y="152"
                width={Math.max(0, 60 * pct)}
                height="5"
                rx="2.5"
                fill={pct > 0.5 ? '#1E7A46' : pct > 0.2 ? '#ffb547' : '#C8102E'}
              />

              <text
                x={x + 38}
                y="176"
                textAnchor="middle"
                fill={INK}
                fontSize="13"
                fontWeight="700"
                style={{ textTransform: 'capitalize' }}
              >
                {g.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Chiffres, sous le dessin : l'état ne doit jamais reposer
          sur la seule couleur */}
      <div className="mt-1 grid grid-cols-3 gap-2 text-center">
        {gates.map((g) => {
          const st = gateState(g);
          return (
            <div key={g.name} className="text-[11px] leading-tight">
              <p className="font-bold tabular-nums text-gray-800">
                {g.fallen ? '—' : `${g.hp}/${g.hpMax}`}
              </p>
              <p
                className={
                  st === 'tombee' ? 'font-bold text-red-600'
                  : st === 'critique' ? 'font-semibold text-orange-600'
                  : 'text-gray-400'
                }
              >
                {st === 'tombee' ? 'tombée' : st === 'critique' ? 'critique' : st === 'entamee' ? 'entamée' : 'intacte'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
