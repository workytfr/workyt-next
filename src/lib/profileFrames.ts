/**
 * Contours de profil — DONNÉES PURES (consommées côté serveur et client).
 *
 * Deux familles cohabitent :
 *  - les contours IMAGE historiques, un fichier dans public/profile/contour/ ;
 *  - les contours ANIMÉS, dessinés en SVG par components/ui/frames. Ils sont
 *    stockés dans `profileBorder.filename` sous la forme `anim:<id>` : le
 *    schéma Mongo ne change pas, et un ancien client qui ne les connaît pas
 *    n'affiche simplement rien.
 *
 * ⚠️ L'identifiant boutique (`cosmeticId`, ce que possède le joueur) et le
 * nom de fichier stocké sont deux choses distinctes. Les comparer directement
 * était le bug de l'inventaire : « gold » ≠ « gold.svg », le contour équipé
 * n'apparaissait jamais comme tel.
 */

export const ANIMATED_PREFIX = 'anim:';

export type FrameRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AnimatedFrameDef {
  /** Identifiant boutique — aussi la clé du composant de dessin */
  id: string;
  label: string;
  price: number;
  rarity: FrameRarity;
  description: string;
  /** Étiquette spéciale : partenaire, hommage… */
  tag?: 'partenaire' | 'hommage' | 'halloween';
}

export const ANIMATED_FRAMES: AnimatedFrameDef[] = [
  { id: 'bubblegum', label: 'Bulle de chewing-gum', price: 25, rarity: 'epic',
    description: 'La bulle gonfle, éclate en petites bulles… et se reforme.' },
  { id: 'yumego_manga', label: 'Sakura Yumego', price: 5, rarity: 'rare', tag: 'partenaire',
    description: 'Une branche de cerisier en fleurs, pétales au vent.' },
  { id: 'aura_ki', label: 'Aura de combat', price: 40, rarity: 'legendary', tag: 'hommage',
    description: 'Une aura dorée qui crépite d’éclairs. Puissance au-delà de 9000.' },
  { id: 'flamme_dragon', label: 'Flammes du dragon', price: 35, rarity: 'epic', tag: 'hommage',
    description: 'Un cercle magique cerné de flammes de dragon.' },
  { id: 'chapeau_paille', label: 'Chapeau de paille', price: 30, rarity: 'epic', tag: 'hommage',
    description: 'Un cordage de navire, les vagues, et le chapeau du futur roi.' },
  { id: 'ninja_spirale', label: 'Ninja de la spirale', price: 30, rarity: 'epic', tag: 'hommage',
    description: 'Un tourbillon de chakra, des shurikens et des feuilles.' },
  { id: 'couronne_or', label: 'Couronne d’or', price: 45, rarity: 'legendary',
    description: 'Un anneau d’orfèvre serti de rubis, couronne comprise.' },
  { id: 'couronne_jade', label: 'Couronne de jade', price: 50, rarity: 'legendary',
    description: 'Jade impérial, perles et filigrane d’or.' },
  { id: 'glitch', label: 'Glitch', price: 30, rarity: 'epic',
    description: 'Erreur 404 : contour introuvable. Ou presque.' },
  { id: 'feux_follets', label: 'Feux follets', price: 35, rarity: 'epic',
    description: 'De petites lueurs espiègles qui tournent autour de toi.' },
  { id: 'nuage', label: 'Nuage', price: 20, rarity: 'rare',
    description: 'Un anneau de nuages moelleux qui dérive doucement.' },
  { id: 'halloween_2026', label: 'Crânes affamés', price: 35, rarity: 'legendary', tag: 'halloween',
    description: 'Halloween 2026 : ils sourient, se fâchent… et se dévorent entre eux.' },
  { id: 'erable_canada', label: 'Érable du Canada', price: 30, rarity: 'epic',
    description: 'Des branches d’érable aux couleurs d’automne, sous la première neige.' },
  { id: 'tempete_sable', label: 'Tempête de sable', price: 35, rarity: 'epic',
    description: 'Le sable tourbillonne, retombe… et une traînée de vent balaie la dune.' }
];

export const ANIMATED_FRAME_BY_ID = new Map(ANIMATED_FRAMES.map((f) => [f.id, f]));

/** Contours image historiques : identifiant boutique → fichier. */
const IMAGE_FRAME_FILES: Record<string, string> = {
  gold: 'gold.svg',
  silver: 'silver.svg',
  eclair_green: 'eclair_green.apng',
  fumee: 'fumee.png',
  poison_orange: 'poison_orange.png',
  halloween_pumpkins_apng: 'halloween_pumpkins_apng.png'
};

/**
 * Anciens fichiers remplacés par un contour animé. Le joueur qui possédait
 * l'ancien garde son achat : il voit la nouvelle version, sans rien racheter.
 */
const LEGACY_TO_ANIMATED: Record<string, string> = {
  'yumego_manga.apng': 'yumego_manga'
};

/** Ce qu'on stocke dans `profileBorder.filename` pour un identifiant boutique. */
export function borderFilename(id: string): string {
  if (ANIMATED_FRAME_BY_ID.has(id)) return `${ANIMATED_PREFIX}${id}`;
  return IMAGE_FRAME_FILES[id] ?? id;
}

/** L'identifiant boutique correspondant à un fichier stocké. */
export function borderIdFromFilename(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const anim = animatedFrameId(filename);
  if (anim) return anim;
  const hit = Object.entries(IMAGE_FRAME_FILES).find(([, f]) => f === filename);
  return hit ? hit[0] : filename;
}

/** L'identifiant du contour animé à dessiner, ou null pour un contour image. */
export function animatedFrameId(filename: string | null | undefined): string | null {
  if (!filename) return null;
  if (filename.startsWith(ANIMATED_PREFIX)) {
    const id = filename.slice(ANIMATED_PREFIX.length);
    return ANIMATED_FRAME_BY_ID.has(id) ? id : null;
  }
  return LEGACY_TO_ANIMATED[filename] ?? null;
}
