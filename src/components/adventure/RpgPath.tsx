"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { BoardTheme } from './boardThemes';
import type { CalendarDay } from './types';
import { getMonsterForDate } from '@/lib/monsters';
import { GROUND_COMPONENTS } from './SceneArt';

/**
 * Le chemin RPG : une route de terre qui SERPENTE DANS TOUTE LA CARTE
 * (zigzag aléatoire lissé par des courbes de Catmull-Rom — régénéré chaque
 * mois via une seed), avec de grands espaces entre les tuiles.
 * Sol en tuiles, étang, arbres en bordure, panneaux, empreintes, champignons…
 */

interface RpgPathProps {
  days: CalendarDay[];
  todayStr: string;
  theme: BoardTheme;
  heroLevel: number;
  avatarUrl: string | null;
  flameTrailSet: Set<string>;
  flameMilestones: Set<string>;
  claiming: string | null;
  quizLocked: boolean;
  canClaim: boolean;
  fainted?: boolean;
  onClaim: (date: string) => void;
  vertical?: boolean;
}

interface Pt { x: number; y: number }

/** RNG déterministe (mulberry32) : le chemin change chaque mois mais pas chaque render */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FLOWER_COLORS = ['#F472B6', '#A78BFA', '#FDE047', '#FB923C', '#F87171', '#FFFFFF'];

export default function RpgPath({
  days, todayStr, theme, heroLevel, avatarUrl, flameTrailSet, flameMilestones,
  claiming, quizLocked, canClaim, fainted = false, onClaim, vertical = false
}: RpgPathProps) {
  const W = vertical ? 480 : 1400;
  const H = vertical ? 1100 : 760;
  const N = days.length;
  const cols = vertical ? 4 : 8;
  const rows = Math.ceil(N / cols);
  const roadW = vertical ? 34 : 46;
  const r = vertical ? 17 : 24;

  const monthSeed = useMemo(() => {
    const d = days[0]?.date || todayStr;
    return parseInt(d.slice(0, 4), 10) * 100 + parseInt(d.slice(5, 7), 10);
  }, [days, todayStr]);

  // ---------- Layout : serpentin qui remplit l'écran + jitter aléatoire ----------
  const nodes: Pt[] = useMemo(() => {
    const rnd = mulberry32(monthSeed);
    const mX = vertical ? 55 : 70;
    const mY = vertical ? 60 : 80;
    const spaceX = (W - 2 * mX) / (cols - 1);
    const spaceY = rows > 1 ? (H - 2 * mY) / (rows - 1) : 0;
    const pts: Pt[] = [];
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / cols);
      let col = i % cols;
      if (row % 2 === 1) col = cols - 1 - col; // zigzag
      const lastRow = row === rows - 1;
      // Dernière ligne partielle : recentrer
      const lastRowCount = N - (rows - 1) * cols;
      let x = mX + col * spaceX;
      if (lastRow && lastRowCount < cols && lastRowCount > 1) {
        const offset = ((cols - lastRowCount) * spaceX) / 2;
        x = row % 2 === 1 ? x - offset : x + offset;
      }
      pts.push({
        x: x + (rnd() - 0.5) * spaceX * 0.5,
        y: mY + row * spaceY + (rnd() - 0.5) * spaceY * 0.4
      });
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, monthSeed, vertical, W, H]);

  // ---------- Lissage Catmull-Rom → courbes de Bézier ----------
  const splineSegment = (pts: Pt[], i: number): { c1: Pt; c2: Pt; p2: Pt } => {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    return {
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2
    };
  };

  const roadPath = useMemo(() => {
    if (nodes.length < 2) return '';
    let d = `M ${nodes[0].x.toFixed(1)} ${nodes[0].y.toFixed(1)} `;
    for (let i = 0; i < nodes.length - 1; i++) {
      const s = splineSegment(nodes, i);
      d += `C ${s.c1.x.toFixed(1)} ${s.c1.y.toFixed(1)}, ${s.c2.x.toFixed(1)} ${s.c2.y.toFixed(1)}, ${s.p2.x.toFixed(1)} ${s.p2.y.toFixed(1)} `;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const segmentPath = (i: number): string => {
    const s = splineSegment(nodes, i);
    return `M ${nodes[i].x.toFixed(1)} ${nodes[i].y.toFixed(1)} C ${s.c1.x.toFixed(1)} ${s.c1.y.toFixed(1)}, ${s.c2.x.toFixed(1)} ${s.c2.y.toFixed(1)}, ${s.p2.x.toFixed(1)} ${s.p2.y.toFixed(1)}`;
  };

  const segPerp = (i: number): Pt => {
    const a = nodes[Math.max(0, i)];
    const b = nodes[Math.min(nodes.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  };

  // ---------- DÉCOR (seedé par le mois) ----------
  const decor = useMemo(() => {
    const rnd = mulberry32(monthSeed + 777);

    // Galets dans la piste
    const pebbles = Array.from({ length: 46 }, (_, k) => {
      const seg = Math.floor(rnd() * (N - 1));
      const t = rnd();
      const a = nodes[seg], b = nodes[seg + 1];
      const base = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const perp = segPerp(seg);
      const off = (rnd() - 0.5) * roadW * 0.45;
      const rx = 1.8 + rnd() * 3.2;
      return {
        x: base.x + perp.x * off, y: base.y + perp.y * off,
        rx, ry: rx * 0.65, rot: rnd() * 180,
        c: ['#A97C50', '#8D6E63', '#B8A99A'][k % 3], o: 0.2 + rnd() * 0.3
      };
    });

    // Empreintes de pas
    const footprints = Array.from({ length: Math.min(16, N - 1) }, (_, k) => {
      const seg = Math.floor((k / 16) * (N - 1));
      const a = nodes[seg], b = nodes[seg + 1];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      return { x: mid.x, y: mid.y, angle };
    });

    // Décor au bord : herbes, fleurs, rochers, champignons, souches
    const edge = Array.from({ length: 40 }, (_, k) => {
      const seg = Math.floor(rnd() * (N - 1));
      const t = rnd();
      const a = nodes[seg], b = nodes[seg + 1];
      const base = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const perp = segPerp(seg);
      const side = k % 2 === 0 ? 1 : -1;
      const dist = roadW * 0.7 + 10 + rnd() * 40;
      return {
        x: base.x + perp.x * side * dist,
        y: base.y + perp.y * side * dist,
        kind: rnd(),
        color: FLOWER_COLORS[Math.floor(rnd() * FLOWER_COLORS.length)],
        s: 0.75 + rnd() * 0.55
      };
    });

    // Panneaux en début de semaine
    const signs = [7, 14, 21, 28]
      .filter(idx => idx < N)
      .map((idx, w) => {
        const p = nodes[idx];
        const perp = segPerp(idx);
        const side = w % 2 === 0 ? 1 : -1;
        const dist = roadW * 0.8 + 20;
        return { x: p.x + perp.x * side * dist, y: p.y + perp.y * side * dist, label: `S${w + 2}` };
      });

    return { pebbles, footprints, edge, signs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthSeed, nodes, vertical]);

  // Étang : placé dans le coin le plus éloigné de tous les nœuds
  const pond = useMemo(() => {
    const corners = [
      { x: 110, y: 100 }, { x: W - 150, y: 100 },
      { x: 110, y: H - 110 }, { x: W - 150, y: H - 110 }
    ];
    let best = corners[0], bestDist = 0;
    for (const c of corners) {
      const d = Math.min(...nodes.map(n => Math.hypot(n.x - c.x, n.y - c.y)));
      if (d > bestDist) { bestDist = d; best = c; }
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, W, H]);

  // Arbres en bordure (overlay HTML pour un contrôle total de la taille)
  const treeKey = (['pine', 'sakura', 'palm', 'maple', 'bamboo'] as const)
    .find(k => theme.scene.ground.includes(k)) || 'flower';
  const TreeArt = GROUND_COMPONENTS[treeKey];

  const borderTrees = useMemo(() => {
    const rnd = mulberry32(monthSeed + 42);
    const arr: Array<{ x: number; y: number; size: number }> = [];
    const count = vertical ? 5 : 6;
    for (let i = 0; i < count; i++) {
      const size = 34 + rnd() * 20;
      if (vertical) {
        arr.push({ x: 2 + rnd() * 4, y: (i + 0.5) * (100 / count) - 3, size });
        arr.push({ x: 88 + rnd() * 6, y: (i + 0.8) * (100 / count) - 4, size });
      } else {
        arr.push({ x: (i + 0.5) * (100 / count) - 3, y: 0.5 + rnd() * 2, size });
        arr.push({ x: (i + 0.9) * (100 / count) - 4, y: 93 + rnd() * 3, size });
      }
    }
    // Ne pas poser un arbre sur un nœud
    return arr.filter(t => {
      const px = (t.x / 100) * W, py = (t.y / 100) * H;
      return !nodes.some(n => Math.hypot(n.x - px, n.y - py) < 70);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthSeed, nodes, vertical, W, H]);

  const todayNode = nodes[days.findIndex(d => d.date === todayStr)];

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        <defs>
          <linearGradient id={`fire-${vertical ? 'v' : 'h'}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          <pattern id={`grass-${vertical ? 'v' : 'h'}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <rect width="48" height="48" fill={theme.mapGround} />
            <circle cx="9" cy="11" r="1.6" fill={theme.mapGroundSpeck} />
            <circle cx="31" cy="35" r="1.8" fill={theme.mapGroundSpeck} />
            <circle cx="41" cy="9" r="1.2" fill={theme.mapGroundSpeck} />
            <circle cx="19" cy="26" r="1.4" fill={theme.mapGroundSpeck} />
            <path d="M20 44 Q 22 37 24 44" fill="none" stroke={theme.mapGroundSpeck} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M38 22 Q 40 15 42 22" fill="none" stroke={theme.mapGroundSpeck} strokeWidth="1.8" strokeLinecap="round" />
          </pattern>
        </defs>

        {/* --- Sol de la carte --- */}
        <rect x="0" y="0" width={W} height={H} fill={`url(#grass-${vertical ? 'v' : 'h'})`} />

        {/* --- Étang (coin le plus libre) --- */}
        <g transform={`translate(${pond.x}, ${pond.y})`}>
          <ellipse rx="85" ry="42" fill="#7DD3FC" stroke="#3A2E2E" strokeWidth="3" opacity="0.9" />
          <ellipse rx="66" ry="29" fill="#BAE6FD" opacity="0.85" />
          <path d="M-38 -6 Q -18 -12 2 -6 M12 8 Q 32 2 52 8 M-52 9 Q -38 4 -24 9" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        </g>

        {/* --- Route : ombre, bordure, piste, coeur --- */}
        <path d={roadPath} transform="translate(0, 7)" fill="none" stroke="#3A2E2E" strokeWidth={roadW} strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
        <path d={roadPath} fill="none" stroke="#6B4F2E" strokeWidth={roadW} strokeLinecap="round" strokeLinejoin="round" />
        <path d={roadPath} fill="none" stroke="#C49A6C" strokeWidth={roadW * 0.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={roadPath} fill="none" stroke="#E3C79B" strokeWidth={roadW * 0.58} strokeLinecap="round" strokeLinejoin="round" />

        {/* Galets */}
        {decor.pebbles.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={p.c} opacity={p.o} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
        ))}

        {/* Empreintes */}
        {decor.footprints.map((f, i) => (
          <g key={`fp-${i}`} transform={`translate(${f.x}, ${f.y}) rotate(${f.angle})`} opacity="0.3">
            <ellipse rx="3" ry="1.9" fill="#6B4F2E" />
            <ellipse cx="5.5" rx="2.5" ry="1.6" fill="#6B4F2E" opacity="0.7" />
          </g>
        ))}

        {/* --- Traînée de flamme --- */}
        {days.map((day, i) => {
          if (i === 0 || !flameTrailSet.has(days[i - 1].date) || !flameTrailSet.has(day.date)) return null;
          return (
            <path key={`fire-${day.date}`} d={segmentPath(i - 1)} fill="none"
              stroke={`url(#fire-${vertical ? 'v' : 'h'})`} strokeWidth={roadW * 0.34}
              strokeLinecap="round" opacity="0.8"
              style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.8))' }} />
          );
        })}

        {/* --- Décor au bord de la route --- */}
        {decor.edge.map((p, i) => (
          <g key={`edge-${i}`} transform={`translate(${p.x}, ${p.y}) scale(${p.s})`} opacity="0.9">
            {p.kind < 0.3 && (
              <g stroke="#3A2E2E" strokeWidth="1.5" strokeLinecap="round" fill="none">
                <path d="M-4 0 C -5 -6, -3 -9, -1 -11 M0 0 C 0 -7, 1 -10, 3 -13 M4 0 C 5 -5, 6 -8, 8 -10" />
                <path d="M-4 0 C -5 -6, -3 -9, -1 -11 M0 0 C 0 -7, 1 -10, 3 -13 M4 0 C 5 -5, 6 -8, 8 -10" stroke="#4ADE80" strokeWidth="0.9" />
              </g>
            )}
            {p.kind >= 0.3 && p.kind < 0.55 && (
              <g>
                <line x1="0" y1="0" x2="0" y2="-8" stroke="#3A2E2E" strokeWidth="1.5" />
                <circle cx="0" cy="-11" r="4" fill={p.color} stroke="#3A2E2E" strokeWidth="1.5" />
                <circle cx="0" cy="-11" r="1.5" fill="#3A2E2E" opacity="0.6" />
              </g>
            )}
            {p.kind >= 0.55 && p.kind < 0.7 && (
              <g>
                <ellipse rx="5.5" ry="4" fill="#B8A99A" stroke="#3A2E2E" strokeWidth="1.5" />
                <ellipse cx="-1.5" cy="-1" rx="2" ry="1.2" fill="#D6CFC7" opacity="0.8" />
              </g>
            )}
            {p.kind >= 0.7 && p.kind < 0.87 && (
              <g>
                <rect x="-2" y="-5" width="4" height="6" rx="1.5" fill="#F5E6D0" stroke="#3A2E2E" strokeWidth="1.4" />
                <path d="M-6 -4 Q 0 -13 6 -4 Z" fill="#EF4444" stroke="#3A2E2E" strokeWidth="1.4" />
                <circle cx="-2" cy="-7" r="1" fill="#fff" />
                <circle cx="2.5" cy="-6" r="0.8" fill="#fff" />
              </g>
            )}
            {p.kind >= 0.87 && (
              <g>
                <rect x="-4.5" y="-7" width="9" height="8" rx="2" fill="#8D6E63" stroke="#3A2E2E" strokeWidth="1.5" />
                <ellipse cy="-7" rx="4.5" ry="2" fill="#C49A6C" stroke="#3A2E2E" strokeWidth="1.5" />
                <ellipse cy="-7" rx="2.2" ry="0.9" fill="none" stroke="#6B4F2E" strokeWidth="0.9" />
              </g>
            )}
          </g>
        ))}

        {/* --- Panneaux de semaine --- */}
        {decor.signs.map((s, i) => (
          <g key={`sign-${i}`} transform={`translate(${s.x}, ${s.y})`}>
            <line x1="0" y1="0" x2="0" y2="-16" stroke="#6B4F2E" strokeWidth="3" strokeLinecap="round" />
            <rect x="-13" y="-27" width="26" height="14" rx="3" fill="#C49A6C" stroke="#3A2E2E" strokeWidth="2" />
            <text textAnchor="middle" y="-16.5" fontSize="9" fontWeight="bold" fill="#3A2E2E">{s.label}</text>
          </g>
        ))}

        {/* --- Drapeau de départ --- */}
        {nodes.length > 0 && (
          <g transform={`translate(${nodes[0].x}, ${nodes[0].y - r - 6})`}>
            <line x1="0" y1="0" x2="0" y2="-32" stroke="#6B4F2E" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M0 -32 L28 -25 L0 -18 Z" fill="#10B981" stroke="#3A2E2E" strokeWidth="2" strokeLinejoin="round" />
          </g>
        )}

        {/* --- Porte du donjon --- */}
        {nodes.length > 1 && (
          <g transform={`translate(${nodes[N - 1].x}, ${nodes[N - 1].y - r - 4})`}>
            <path d="M-17 0 L-17 -27 Q0 -42 17 -27 L17 0 Z" fill="#8B5CF6" stroke="#3A2E2E" strokeWidth="2.5" strokeLinejoin="round" opacity="0.9" />
            <path d="M-6 0 L-6 -14 Q0 -20 6 -14 L6 0 Z" fill="#312E81" stroke="#3A2E2E" strokeWidth="2" />
            <circle cx="0" cy="-31" r="3" fill="#FDE047" stroke="#3A2E2E" strokeWidth="1.5" />
          </g>
        )}

        {/* --- Tuiles médaillons --- */}
        {days.map((day, i) => {
          const { x, y } = nodes[i];
          const state = day.claimed ? 'claimed'
            : day.date < todayStr ? 'missed'
            : day.date === todayStr ? 'today'
            : 'future';
          const isBoss = day.reward.type === 'chest';
          const monster = (state === 'today' || state === 'claimed')
            ? getMonsterForDate(day.date, theme.id, heroLevel)
            : null;
          const nodeR = isBoss ? r * 1.3 : r;

          const ringColor =
            state === 'claimed' ? (flameTrailSet.has(day.date) ? '#F97316' : '#059669')
            : state === 'today' ? '#D97706'
            : state === 'missed' ? '#9CA3AF'
            : '#475569';
          const faceColor =
            state === 'claimed' ? (flameTrailSet.has(day.date) ? '#FFF7ED' : '#ECFDF5')
            : state === 'today' ? '#FFFBEB'
            : state === 'missed' ? '#E5E7EB'
            : '#1E293B';

          return (
            <g key={day.date} transform={`translate(${x}, ${y})`}
              onClick={state === 'today' && canClaim ? () => onClaim(day.date) : undefined}
              style={{ cursor: state === 'today' && canClaim ? 'pointer' : 'default' }}>
              <ellipse cx="0" cy={nodeR * 0.85} rx={nodeR * 0.9} ry={nodeR * 0.3} fill="#3A2E2E" opacity="0.15" />

              {state === 'today' && (
                <circle r={nodeR + 6} fill="none" stroke="#F59E0B" strokeWidth="2.5">
                  <animate attributeName="r" values={`${nodeR + 4};${nodeR + 10};${nodeR + 4}`} dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.15;0.8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              {isBoss && state !== 'claimed' && (
                <circle r={nodeR + 5} fill="none" stroke="#EF4444" strokeWidth="2.5">
                  <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}

              <circle r={nodeR + 3} fill={ringColor} stroke="#3A2E2E" strokeWidth="2"
                opacity={state === 'missed' ? 0.5 : 1}
                style={flameTrailSet.has(day.date) ? { filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.75))' } : undefined} />
              <circle r={nodeR} fill={faceColor} stroke="#FFFFFF" strokeWidth="1.8" opacity={state === 'missed' ? 0.55 : 1} />

              {state === 'future' ? (
                <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.8} fill="#94A3B8" fontWeight="bold">?</text>
              ) : monster ? (
                <>
                  <text textAnchor="middle" dominantBaseline="central" y={-r * 0.28} fontSize={r * 0.9}>
                    {day.claimed ? '💀' : monster.emoji}
                  </text>
                  <text textAnchor="middle" dominantBaseline="central" y={r * 0.6} fontSize={r * 0.48} fill={state === 'claimed' ? '#047857' : '#B45309'} fontWeight="bold">
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </text>
                </>
              ) : (
                <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.68} fill={state === 'missed' ? '#9CA3AF' : '#374151'} fontWeight="bold">
                  {new Date(day.date + 'T00:00:00').getDate()}
                </text>
              )}

              {flameMilestones.has(day.date) && <text textAnchor="middle" y={-nodeR - 10} fontSize={r * 0.8}>🔥</text>}
              {isBoss && state !== 'future' && !day.claimed && <text textAnchor="middle" y={-nodeR - 10} fontSize={r * 0.8}>👑</text>}
              {state === 'today' && quizLocked && <text textAnchor="middle" y={nodeR + 17} fontSize={r * 0.7}>🔒</text>}
            </g>
          );
        })}
      </svg>

      {/* --- Arbres en bordure (overlay, taille maîtrisée) --- */}
      {borderTrees.map((t, i) => (
        <div
          key={`tree-${i}`}
          className="absolute pointer-events-none adventure-sway"
          style={{ left: `${t.x}%`, top: `${t.y}%`, animationDelay: `${i * 0.5}s` }}
          aria-hidden
        >
          <TreeArt style={{ width: t.size, height: t.size }} />
        </div>
      ))}

      {/* --- Mascotte --- */}
      {todayNode && (
        <motion.div
          className="absolute z-20 pointer-events-none"
          style={{ left: `${(todayNode.x / W) * 100}%`, top: `${(todayNode.y / H) * 100}%`, transform: 'translate(-50%, -140%)' }}
          initial={false}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-white shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Ton héros" className="w-full h-full object-cover" />
            ) : ('🧑‍🚀')}
          </div>
          <div className="mx-auto mt-1 w-5 h-1.5 rounded-full bg-black/25 blur-[2px]" />
        </motion.div>
      )}

      {/* --- Bouton Réclamer --- */}
      {todayNode && canClaim && !days.find(d => d.date === todayStr)?.claimed && (
        <div className="absolute z-10" style={{ left: `${(todayNode.x / W) * 100}%`, top: `${(todayNode.y / H) * 100}%`, transform: 'translate(-50%, 50%)' }}>
          {fainted ? (
            <div className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-gray-500 text-white shadow-lg cursor-not-allowed">
              💫 Évanoui — bois une potion 🍄
            </div>
          ) : (
            <button
              onClick={() => onClaim(todayStr)}
              disabled={claiming === todayStr}
              className={cn('px-4 py-1.5 rounded-full text-xs font-extrabold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 bg-gradient-to-r', theme.claimButton)}
            >
              {claiming === todayStr ? '...' : quizLocked ? '🔒 Résous le quiz' : '⚔️ Réclamer'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
