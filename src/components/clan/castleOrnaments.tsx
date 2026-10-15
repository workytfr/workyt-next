import React from 'react';
import type { DecoratedThemeId } from '@/lib/clanThemes';
import type { GateState } from './ClanCastle';
import { INK, GROUND, GH, KEEP, KEEP_ROOF, KEEP_WINDOWS, WALL_TOP, WALLS, isRoofed, turretRoofs } from './castleGeometry';

/**
 * Ornements de saison posés SUR le château : neige sur les toits, lierre sur
 * les murs, lanternes, oriflammes, canons dans les créneaux…
 *
 * Ils suivent l'état du dessin : rien sur un toit effondré, une porte tombée
 * ou un donjon abattu — un ornement qui flotte au-dessus d'une ruine, c'est
 * un bug visible.
 *
 * Deux calques : `KeepOrnaments` juste après le donjon (les châtelets passent
 * devant), `GateOrnaments` après les châtelets. Aucun ne capte de clic.
 */

interface Roof { cx: number; base: number; half: number; height: number }

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Toits encore debout (même règle que ClanCastle : la droite tombe d'abord). */
function standingRoofs(states: readonly GateState[]): Roof[] {
  return states.flatMap((st, i) => {
    if (!isRoofed(i)) return [];
    const [left, right] = turretRoofs(i);
    const out: Roof[] = [];
    if (st !== 'tombee') out.push(left);
    if (st !== 'tombee' && st !== 'critique') out.push(right);
    return out;
  });
}

/** Point d'un pan de toit : t = 0 au sommet, 1 au bord. */
const onRoof = (r: Roof, t: number, side: -1 | 1) => ({ x: r.cx + side * r.half * t, y: r.base - r.height * (1 - t) });

/** Merlons d'un segment de courtine (deux par segment). */
function wallMerlons(w: { x: number; w: number }) {
  const u = w.w / 3;
  return [w.x, w.x + 2 * u].map((x) => ({ x, w: u, top: WALL_TOP - 7 }));
}

/** Créneau du milieu d'un segment de courtine (le vide entre les merlons). */
const wallGap = (w: { x: number; w: number }) => ({ x: w.x + w.w / 2, y: WALL_TOP - 3.5 });

/** Corps d'un châtelet : bord gauche visible (les tourelles masquent les bords). */
const body = (i: number) => {
  const x = GH.xs[i];
  return { x, cx: x + GH.w / 2, bodyX: x + 14, bodyW: GH.w - 28, visibleLeft: x + GH.turretW + 2 };
};

/** Créneaux d'un châtelet encore debout (vides entre merlons présents). */
function bodyGaps(i: number, st: GateState) {
  const missing = st === 'critique' ? [1] : st === 'tombee' ? [0, 2] : [];
  const { bodyX, bodyW } = body(i);
  const u = bodyW / 5;
  return [0, 1]
    .filter((k) => !missing.includes(k) && !missing.includes(k + 1))
    .map((k) => ({ x: bodyX + (2 * k + 1.5) * u, y: GH.bodyTop - 4.5 }));
}

/** Guirlande pendante entre deux points : renvoie le tracé et ses n points. */
function hang(a: [number, number], b: [number, number], sag: number, n: number) {
  const c: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2];
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    return {
      x: r2((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0]),
      y: r2((1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1])
    };
  });
  return { d: `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`, pts };
}

/* --------------------------------------------------------------- éléments */

/** Toile d'araignée en quart de cercle, dans un angle. */
function Cobweb({ x, y, r, flip = false }: { x: number; y: number; r: number; flip?: boolean }) {
  const angles = [0, 30, 60, 90].map((a) => (a * Math.PI) / 180);
  const pt = (a: number, rr: number) => `${r2(Math.cos(a) * rr)},${r2(Math.sin(a) * rr)}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} stroke="#e8e2f3" strokeWidth="0.8" fill="none" opacity="0.9">
      {angles.map((a, i) => <path key={i} d={`M0,0 L${pt(a, r)}`} />)}
      {[0.4, 0.7, 1].map((k) => (
        <path key={k} d={`M${angles.map((a) => pt(a, r * k)).join(' L')}`} />
      ))}
    </g>
  );
}

function Leaf({ x, y, color, rot = 0, s = 1 }: { x: number; y: number; color: string; rot?: number; s?: number }) {
  return (
    <path
      transform={`translate(${r2(x)} ${r2(y)}) rotate(${rot}) scale(${s})`}
      d="M0,-4 C3,-3 4,1 0,4 C-4,1 -3,-3 0,-4 Z"
      fill={color} stroke={INK} strokeWidth="1" strokeLinejoin="round"
    />
  );
}

/** Lierre qui grimpe le long d'un mur, de `y0` (bas) à `y1` (haut). */
function Ivy({ x, y0, y1, leaves, flowers }: { x: number; y0: number; y1: number; leaves: string[]; flowers?: string }) {
  const steps = Math.max(2, Math.round((y0 - y1) / 10));
  let d = `M${x},${y0}`;
  for (let i = 0; i < steps; i++) d += ` q${i % 2 ? 4 : -4},${r2(-(y0 - y1) / steps / 2)} 0,${r2(-(y0 - y1) / steps)}`;
  return (
    <g>
      <path d={d} fill="none" stroke="#5a7a2a" strokeWidth="1.6" strokeLinecap="round" />
      {Array.from({ length: steps * 2 }, (_, i) => {
        const y = y0 - ((i + 0.5) * (y0 - y1)) / (steps * 2);
        const side = i % 2 ? 1 : -1;
        return flowers && i % 3 === 0 ? (
          <circle key={i} cx={x + side * 3} cy={r2(y)} r="1.9" fill={flowers} stroke={INK} strokeWidth="0.8" />
        ) : (
          <Leaf key={i} x={x + side * 3.5} y={y} color={leaves[i % leaves.length]} rot={side * 50} s={0.75} />
        );
      })}
    </g>
  );
}

/** Calotte de neige sur un toit conique, bord inférieur festonné. */
function SnowCap({ r }: { r: Roof }) {
  const k = 0.5;
  const y = r.base - r.height * (1 - k);
  const xr = r.cx + r.half * k;
  const xl = r.cx - r.half * k;
  const n = 4;
  const step = (xr - xl) / n;
  let d = `M${r.cx},${r.base - r.height} L${r2(xr)},${r2(y)}`;
  for (let i = 0; i < n; i++) d += ` q${r2(-step / 2)},${i % 2 ? 2.5 : 5} ${r2(-step)},0`;
  return <path d={`${d} Z`} fill="#ffffff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />;
}

function Star({ x, y, r = 4, fill = '#ffd166' }: { x: number; y: number; r?: number; fill?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${r2(x + Math.cos(a) * rr)},${r2(y + Math.sin(a) * rr)}`;
  });
  return <path d={`M${pts.join(' L')} Z`} fill={fill} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />;
}

const BULBS = ['#ffd166', '#ff6aa2', '#6ec1e4', '#7ed957'];

/** Guirlande lumineuse : ampoules qui scintillent à tour de rôle. */
function Lights({ a, b, sag, n, uid }: { a: [number, number]; b: [number, number]; sag: number; n: number; uid: string }) {
  const { d, pts } = hang(a, b, sag, n);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth="1" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y + 1.5} r="1.9" fill={BULBS[i % BULBS.length]} stroke={INK} strokeWidth="0.7"
          className={`${uid}-glow`} style={{ animationDelay: `${r2(-i * 0.35)}s` }} />
      ))}
    </g>
  );
}

const FESTIVE = ['#e5484d', '#ffb547', '#6ec1e4', '#7ed957', '#c084fc'];

/** Fanions de tournoi tendus entre deux points. */
function Pennons({ a, b, sag, n, offset = 0 }: { a: [number, number]; b: [number, number]; sag: number; n: number; offset?: number }) {
  const { d, pts } = hang(a, b, sag, n);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth="1.2" />
      {pts.map((p, i) => (
        <path key={i} d={`M${r2(p.x - 3)},${p.y} h6 l-3,7 z`} fill={FESTIVE[(i + offset) % FESTIVE.length]} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      ))}
    </g>
  );
}

/** Oriflamme rayée qui pend d'un rempart, à queue d'aronde. */
function Oriflamme({ x, y, w = 8, h = 24, colors }: { x: number; y: number; w?: number; h?: number; colors: [string, string] }) {
  const outline = `M${x},${y} h${w} v${h} l${-w / 2},-4 l${-w / 2},4 z`;
  return (
    <g>
      <path d={outline} fill={colors[0]} />
      <path d={`M${x + w / 2},${y} h${w / 2} v${h} l${-w / 2},-4 z`} fill={colors[1]} />
      <path d={outline} fill="none" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </g>
  );
}

/** Loup de carnaval vénitien. */
function Mask({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-8,-2 C-8,-6 -2,-5 0,-3 C2,-5 8,-6 8,-2 C8,3 3,4 0,1 C-3,4 -8,3 -8,-2 Z" fill={fill} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <ellipse cx="-3.6" cy="-1.2" rx="2" ry="1.3" fill={INK} />
      <ellipse cx="3.6" cy="-1.2" rx="2" ry="1.3" fill={INK} />
      <path d="M6,-4 q4,-6 2,-10" fill="none" stroke="#e5484d" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function Mortarboard({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 4},${y + 1} v3 q4,2 8,0 v-3 z`} fill={INK} />
      <path d={`M${x - 8},${y} L${x},${y - 3} L${x + 8},${y} L${x},${y + 3} Z`} fill={INK} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
      <path d={`M${x},${y} L${x + 6},${y + 1} V${y + 6}`} fill="none" stroke="#ffd166" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/** Bouche de canon vue de face, dans un créneau. */
function Cannon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="3.4" fill="#3a3a3a" stroke={INK} strokeWidth="1.3" />
      <circle cx={x} cy={y} r="1.6" fill={INK} />
    </g>
  );
}

function JollyRoger({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 26} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d={`M${x},${y - 26} h15 l-2,5 l2,5 h-15 z`} fill={INK} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx={x + 7} cy={y - 22} r="2.3" fill="#ffffff" />
      <path d={`M${x + 3},${y - 19} l8,3 M${x + 11},${y - 19} l-8,3`} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------- par thème */

interface KeepProps { id: 'none' | DecoratedThemeId; uid: string; keepDown: boolean }
interface GateProps { id: 'none' | DecoratedThemeId; uid: string; states: readonly GateState[] }

/** Sur le donjon : fenêtres, angles, parapet, toit. */
export function KeepOrnaments({ id, uid, keepDown }: KeepProps) {
  if (id === 'none' || keepDown) return null;
  const winTop = KEEP.top + 15;
  const winBottom = KEEP.top + 32;
  let content: React.ReactNode = null;

  switch (id) {
    case 'halloween':
      content = (
        <>
          {/* Fenêtres sculptées comme des citrouilles */}
          {KEEP_WINDOWS.map((wx) => (
            <g key={wx} fill={INK} stroke={INK} strokeWidth="0.6" strokeLinejoin="round">
              <path d={`M${wx + 1.8},${winTop + 9} l1.6,-3 l1.6,3 z M${wx + 5.6},${winTop + 9} l1.6,-3 l1.6,3 z`} />
              <path d={`M${wx + 2},${winTop + 12} l1.5,1.6 l1.5,-1.6 l1.5,1.6 l1.5,-1.6 l1.5,1.6`} fill="none" strokeWidth="1.1" />
            </g>
          ))}
          <Cobweb x={KEEP.x} y={KEEP.top} r={13} />
          <Cobweb x={KEEP.x + KEEP.w} y={KEEP.top} r={11} flip />
          {/* Araignée qui descend du parapet */}
          <g className={`${uid}-float`}>
            <line x1={KEEP.x + KEEP.w - 7} y1={KEEP.top} x2={KEEP.x + KEEP.w - 7} y2={KEEP.top + 18} stroke="#e8e2f3" strokeWidth="0.8" />
            <g transform={`translate(${KEEP.x + KEEP.w - 7} ${KEEP.top + 20})`} stroke={INK} strokeWidth="1" strokeLinecap="round">
              <path d="M-4,-2 l2,1 M-4,1 l2,0 M-4,3 l2,-1 M4,-2 l-2,1 M4,1 l-2,0 M4,3 l-2,-1" />
              <circle r="2.4" fill={INK} />
            </g>
          </g>
        </>
      );
      break;
    case 'automne':
      content = (
        <>
          {[0.35, 0.6, 0.85].flatMap((t, i) => [
            <Leaf key={`l${i}`} {...onRoof(KEEP_ROOF, t, -1)} color={['#e0712c', '#c9452b', '#e8a33a'][i]} rot={i * 60 + 20} />,
            <Leaf key={`r${i}`} {...onRoof(KEEP_ROOF, t + 0.08, 1)} color={['#8f5a2b', '#e0712c', '#c9452b'][i]} rot={i * 45 - 30} />
          ])}
          <Ivy x={KEEP.x + 4} y0={92} y1={KEEP.top + 6} leaves={['#c9452b', '#e0712c', '#e8a33a']} />
          <Ivy x={KEEP.x + KEEP.w - 4} y0={92} y1={KEEP.top + 20} leaves={['#e8a33a', '#c9452b']} />
        </>
      );
      break;
    case 'hiver':
      content = (
        <>
          <SnowCap r={KEEP_ROOF} />
          {/* Stalactites de glace sous le parapet (pas devant la bannière) */}
          <g fill="#e6f6fd" stroke={INK} strokeWidth="1" strokeLinejoin="round">
            {[124, 132, 140, 180, 188, 196].map((x, i) => (
              <path key={x} d={`M${x - 2.5},${KEEP.top} h5 l-2.5,${i % 2 ? 6 : 9} z`} />
            ))}
          </g>
          {/* Lueur chaude aux fenêtres */}
          {KEEP_WINDOWS.map((wx) => (
            <ellipse key={wx} cx={wx + 5} cy={(winTop + winBottom) / 2} rx="9" ry="11" fill="#ffd166" opacity="0.18" />
          ))}
        </>
      );
      break;
    case 'nouvel_an':
      content = (
        <>
          <Star x={KEEP_ROOF.cx} y={KEEP_ROOF.base - KEEP_ROOF.height + 16} r={5.5} />
          <Lights a={[KEEP.x - 5, KEEP.top + 1]} b={[KEEP.x + KEEP.w + 5, KEEP.top + 1]} sag={5} n={10} uid={uid} />
        </>
      );
      break;
    case 'carnaval':
      content = (
        <>
          <Oriflamme x={KEEP.x + 2} y={KEEP.top} h={36} colors={['#e5484d', '#ffd166']} />
          <Oriflamme x={KEEP.x + KEEP.w - 10} y={KEEP.top} h={36} colors={['#6ec1e4', '#ffd166']} />
        </>
      );
      break;
    case 'printemps':
      content = (
        <>
          {/* Jardinières sous les fenêtres */}
          {KEEP_WINDOWS.map((wx, k) => (
            <g key={wx}>
              {[1.5, 5, 8.5].map((dx, i) => (
                <circle key={i} cx={wx + dx} cy={winBottom - 1} r="2" fill={['#f472b6', '#ffffff', '#c084fc'][(i + k) % 3]} stroke={INK} strokeWidth="0.8" />
              ))}
              <rect x={wx - 2} y={winBottom} width="14" height="4" rx="1" fill="#a0662f" stroke={INK} strokeWidth="1.2" />
            </g>
          ))}
          <Ivy x={KEEP.x + 4} y0={92} y1={KEEP.top + 10} leaves={['#5fae3c', '#7ed957']} flowers="#f9a8d4" />
        </>
      );
      break;
    case 'examens': {
      // Horloge dans le toit : l'heure de l'épreuve
      const cy = KEEP_ROOF.base - KEEP_ROOF.height / 2;
      content = (
        <g>
          <circle cx={KEEP_ROOF.cx} cy={cy} r="8.5" fill="#fdfaf4" stroke={INK} strokeWidth="2" />
          {[0, 90, 180, 270].map((a) => (
            <line key={a} x1={KEEP_ROOF.cx} y1={cy - 7} x2={KEEP_ROOF.cx} y2={cy - 5.5} stroke={INK} strokeWidth="1.2" transform={`rotate(${a} ${KEEP_ROOF.cx} ${cy})`} />
          ))}
          <path d={`M${KEEP_ROOF.cx},${cy} V${cy - 5.5} M${KEEP_ROOF.cx},${cy} L${KEEP_ROOF.cx + 3.5},${cy + 1.5}`} stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
      break;
    }
    case 'ete': {
      // Bouée de sauvetage accrochée au mur du donjon, sous un filet de pêche
      const bx = KEEP.x + 7;
      const by = KEEP.top + 42;
      content = (
        <>
          <path d={`M${KEEP.x},${KEEP.top} q8,10 16,0 M${KEEP.x + 4},${KEEP.top + 3} l4,6 l4,-6`} fill="none" stroke="#b07a45" strokeWidth="1.2" />
          <line x1={bx} y1={KEEP.top + 4} x2={bx} y2={by - 5} stroke="#b07a45" strokeWidth="1.2" />
          <circle cx={bx} cy={by} r="5" fill="none" stroke={INK} strokeWidth="5" />
          <circle cx={bx} cy={by} r="5" fill="none" stroke="#ffffff" strokeWidth="3.4" />
          <circle cx={bx} cy={by} r="5" fill="none" stroke="#e5484d" strokeWidth="3.4" strokeDasharray="3.9 3.9" />
        </>
      );
      break;
    }
  }

  return content ? <g aria-hidden="true" pointerEvents="none">{content}</g> : null;
}

/** Sur les châtelets et la courtine : toits, créneaux, portes. */
export function GateOrnaments({ id, uid, states }: GateProps) {
  if (id === 'none') return null;
  const roofs = standingRoofs(states);
  const standing = (i: number) => states[i] !== 'tombee';
  let content: React.ReactNode = null;

  switch (id) {
    case 'halloween':
      content = (
        <>
          {states.map((st, i) => st !== 'tombee' && (
            <Cobweb key={i} x={body(i).visibleLeft} y={GH.bodyTop + 7} r={9} />
          ))}
          {/* Lanternes-citrouilles sur la courtine */}
          {WALLS.map((w, i) => {
            const m = wallMerlons(w)[i % 2];
            return (
              <g key={i} transform={`translate(${r2(m.x + m.w / 2)} ${m.top - 3.5}) scale(0.42)`}>
                <ellipse rx="11" ry="8.5" fill="#ff7a1a" stroke={INK} strokeWidth="3" />
                <path d="M-6.5,-1 l2.5,-4 l2.5,4 z M1.5,-1 l2.5,-4 l2.5,4 z" fill="#ffe08a" className={`${uid}-glow`} />
              </g>
            );
          })}
        </>
      );
      break;
    case 'automne':
      content = (
        <>
          {roofs.flatMap((r, k) => [0.45, 0.8].map((t, i) => (
            <Leaf key={`${k}-${i}`} {...onRoof(r, t, i % 2 ? 1 : -1)} color={['#e0712c', '#c9452b', '#e8a33a'][(k + i) % 3]} rot={(k * 37 + i * 70) % 180} s={0.85} />
          )))}
          {states.map((_, i) => (
            <Ivy key={i} x={body(i).visibleLeft + 2} y0={GROUND} y1={GH.bodyTop + 14} leaves={['#c9452b', '#e0712c', '#e8a33a', '#8f5a2b']} />
          ))}
        </>
      );
      break;
    case 'hiver':
      content = (
        <>
          {roofs.map((r, k) => <SnowCap key={k} r={r} />)}
          {/* Neige sur les merlons de la courtine */}
          <g fill="#ffffff" stroke={INK} strokeWidth="1">
            {WALLS.flatMap((w, i) => wallMerlons(w).map((m, k) => (
              <rect key={`${i}-${k}`} x={r2(m.x - 0.5)} y={m.top - 3} width={r2(m.w + 1)} height="3.5" rx="1.6" />
            )))}
          </g>
          {/* Couronnes de Noël sur les portes encore debout */}
          {states.map((st, i) => standing(i) && (
            <g key={i} transform={`translate(${body(i).cx} ${GROUND - 27})`}>
              <circle r="5" fill="none" stroke="#2f7d4a" strokeWidth="3" />
              <circle r="5" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.5" />
              <path d="M-2.5,4 l2.5,-1.5 l2.5,1.5 l-1,2 l-1.5,-1 l-1.5,1 z" fill="#e5484d" stroke={INK} strokeWidth="0.7" />
            </g>
          ))}
        </>
      );
      break;
    case 'nouvel_an':
      content = (
        <>
          {roofs.map((r, k) => <Star key={k} x={r.cx} y={r.base - r.height + 10} r={3.6} />)}
          {WALLS.map((w, i) => (
            <Lights key={i} a={[w.x - 1, WALL_TOP - 6]} b={[w.x + w.w + 1, WALL_TOP - 6]} sag={4} n={4} uid={uid} />
          ))}
        </>
      );
      break;
    case 'carnaval':
      content = (
        <>
          {/* Fanions tendus entre les deux tourelles d'un même châtelet */}
          {states.map((st, i) => {
            if (!isRoofed(i) || st === 'tombee' || st === 'critique') return null;
            const [l, r] = turretRoofs(i);
            const y = l.base - l.height + 8;
            return <Pennons key={i} a={[l.cx, y]} b={[r.cx, y]} sag={6} n={6} offset={i} />;
          })}
          {/* Oriflammes pendues aux créneaux de la courtine */}
          {WALLS.map((w, i) => (
            <Oriflamme key={i} x={wallGap(w).x - 4} y={WALL_TOP - 1} h={22} colors={i ? ['#c084fc', '#ffffff'] : ['#7ed957', '#ffffff']} />
          ))}
          {/* Un loup de carnaval au-dessus de chaque porte debout */}
          {states.map((st, i) => standing(i) && (
            <Mask key={i} x={body(i).cx} y={GH.bodyTop + 19} fill={['#ffd166', '#c084fc', '#6ec1e4'][i]} />
          ))}
        </>
      );
      break;
    case 'printemps':
      content = (
        <>
          {states.map((_, i) => (
            <Ivy key={i} x={body(i).visibleLeft + 2} y0={GROUND} y1={GH.bodyTop + 14} leaves={['#5fae3c', '#7ed957']} flowers={['#f9a8d4', '#ffffff', '#f472b6'][i]} />
          ))}
        </>
      );
      break;
    case 'examens':
      content = (
        <>
          {roofs.map((r, k) => <Mortarboard key={k} x={r.cx} y={r.base - r.height + 7} />)}
          {/* Copies notées, pendues à la courtine */}
          {WALLS.map((w, i) => {
            const x = wallGap(w).x;
            return (
              <g key={i}>
                <rect x={x - 8} y={WALL_TOP - 2} width="16" height="18" rx="1" fill="#fdf6e3" stroke={INK} strokeWidth="1.2" />
                <line x1={x - 8} y1={WALL_TOP + 1} x2={x + 8} y2={WALL_TOP + 1} stroke={INK} strokeWidth="0.8" opacity="0.5" />
                <text x={x} y={WALL_TOP + 10} textAnchor="middle" fontSize="6" fontWeight="700" fill="#c2272d">{i ? 'A+' : '20/20'}</text>
              </g>
            );
          })}
        </>
      );
      break;
    case 'ete':
      content = (
        <>
          {/* Canons dans les créneaux */}
          {WALLS.map((w, i) => <Cannon key={`w${i}`} {...wallGap(w)} />)}
          {states.flatMap((st, i) => bodyGaps(i, st).map((g, k) => <Cannon key={`b${i}-${k}`} {...g} />))}
          {/* Pavillon noir, sur la tourelle droite du châtelet central */}
          {standing(1) && <JollyRoger x={GH.xs[1] + GH.w - GH.turretW / 2} y={GH.turretTop - 1} />}
        </>
      );
      break;
  }

  return content ? <g aria-hidden="true" pointerEvents="none">{content}</g> : null;
}
