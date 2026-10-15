/**
 * Géométrie du château (repère du viewBox), partagée par ClanCastle et par
 * les décors de saison (castleDecor) qui s'accrochent aux toits, fenêtres et
 * remparts : une seule source, sinon les ornements dérivent du dessin.
 */

export const INK = '#1a1512';

export const W = 320;
/** Haut du cadre : la hampe du donjon dépasse au-dessus de zéro */
export const TOP = -36;
export const H = 236;
/** Le sol, sur lequel tout repose */
export const GROUND = 180;

/** Châtelets : corps central + deux tourelles */
export const GH = {
  w: 82,
  xs: [14, 119, 224],
  /** Haut du corps central (sous les merlons) */
  bodyTop: 110,
  /** Haut des tourelles (sous le parapet) */
  turretTop: 92,
  turretW: 20
};

/** Le donjon : plus haut que tout, en retrait */
export const KEEP = { x: 120, w: 80, top: 40 };

/** La courtine : seulement entre les châtelets */
export const WALL_TOP = 124;

/** Toit conique du donjon (voir ConeRoof) */
export const KEEP_ROOF = { cx: KEEP.x + KEEP.w / 2, base: KEEP.top - 12, half: KEEP.w / 2 + 12, height: 44 };

/** Fenêtres du donjon : bord gauche ; 10 de large, de y = top + 15 à top + 32 */
export const KEEP_WINDOWS = [KEEP.x + 14, KEEP.x + KEEP.w - 24];

/** Segments de courtine, entre deux châtelets — avec 4 px de recouvrement */
export const WALLS = GH.xs.slice(0, -1).map((x, i) => {
  const from = x + GH.w - 4;
  const to = GH.xs[i + 1] + 4;
  return { x: from, w: to - from };
});

/** Seuls les châtelets des côtés portent des toits (voir ClanCastle) */
export const isRoofed = (gateIndex: number) => gateIndex !== 1;

/** Toits des deux tourelles d'un châtelet : gauche puis droite */
export function turretRoofs(gateIndex: number) {
  const x = GH.xs[gateIndex];
  return [x, x + GH.w - GH.turretW].map((tx) => ({
    cx: tx + GH.turretW / 2,
    base: GH.turretTop - 7,
    half: GH.turretW / 2 + 5,
    height: 26
  }));
}
