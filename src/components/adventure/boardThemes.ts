/**
 * Configuration visuelle des 10 thèmes saisonniers du Plateau de l'Aventure.
 * Le décor est dessiné en SVG sur mesure (voir SceneArt.tsx) — aucun emoji,
 * aucune image externe : rendu unique et authentique.
 */

export type GroundArt = 'flower' | 'grass' | 'pine' | 'sakura' | 'palm' | 'gift' | 'lantern' | 'diya' | 'maple' | 'bamboo' | 'snowman';
export type AnimalArt = 'fox' | 'rabbit' | 'deer' | 'cat' | 'bird' | 'camel';
export type WeatherArt = 'snow' | 'petals' | 'leaves' | 'sparkles' | 'confetti' | 'none';

export interface SceneConfig {
  weather: WeatherArt; // Particules qui traversent le plateau
  ground: GroundArt[]; // Végétation/décor posé en bas du plateau
  animals: AnimalArt[]; // Animaux qui courent à travers (façon Pokémon)
}

export interface BoardTheme {
  id: string;
  name: string; // Nom affiché dans le header (ex. « Édition Noël »)
  emoji: string; // Petit emoji du header (seul emoji conservé)
  boardBg: string; // Dégradé de fond du plateau
  path: string; // Couleur du chemin (non éclairé)
  cell: string; // Fond/bordure de case normale
  cellFuture: string; // Case future (brouillard)
  accent: string; // Couleur de texte d'accent
  accentBg: string; // Fond d'accent (header, badge thème)
  claimButton: string; // Dégradé du bouton Réclamer
  cardBack: string; // Dégradé du dos des cartes de collection
  cardFace: string; // Dégradé de la face des cartes gagnées
  mapGround: string; // Couleur du sol de la carte (tuiles)
  mapGroundSpeck: string; // Couleur des mouchetures du sol
  scene: SceneConfig; // Décor vivant SVG façon Pokémon
}

export const boardThemes: Record<string, BoardTheme> = {
  default: {
    id: 'default',
    name: 'Vallée du Savoir',
    emoji: '🌿',
    boardBg: 'from-emerald-50 via-lime-50 to-sky-50',
    path: 'bg-emerald-300',
    cell: 'bg-white border-emerald-200',
    cellFuture: 'bg-slate-800/90 border-slate-600',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-100',
    claimButton: 'from-emerald-500 to-teal-500',
    cardBack: 'from-emerald-600 to-teal-600',
    cardFace: 'from-emerald-400 to-teal-500',
    mapGround: '#A7F3D0',
    mapGroundSpeck: '#6EE7B7',
    scene: {
      weather: 'petals',
      ground: ['flower', 'grass', 'flower', 'grass', 'flower'],
      animals: ['fox', 'rabbit']
    }
  },
  christmas: {
    id: 'christmas',
    name: 'Édition Noël',
    emoji: '🎄',
    boardBg: 'from-sky-50 via-blue-50 to-slate-100',
    path: 'bg-sky-300',
    cell: 'bg-white border-sky-200',
    cellFuture: 'bg-slate-900/90 border-slate-600',
    accent: 'text-sky-600',
    accentBg: 'bg-sky-100',
    claimButton: 'from-sky-500 to-blue-600',
    cardBack: 'from-sky-700 to-blue-800',
    cardFace: 'from-sky-400 to-blue-500',
    mapGround: '#E0F2FE',
    mapGroundSpeck: '#BAE6FD',
    scene: {
      weather: 'snow',
      ground: ['pine', 'gift', 'pine', 'snowman', 'pine'],
      animals: ['deer', 'rabbit']
    }
  },
  newyear: {
    id: 'newyear',
    name: 'Édition Nouvel An',
    emoji: '🎆',
    boardBg: 'from-indigo-100 via-blue-50 to-purple-100',
    path: 'bg-indigo-300',
    cell: 'bg-white border-indigo-200',
    cellFuture: 'bg-indigo-950/90 border-indigo-700',
    accent: 'text-indigo-600',
    accentBg: 'bg-indigo-100',
    claimButton: 'from-indigo-500 to-purple-500',
    cardBack: 'from-indigo-700 to-purple-700',
    cardFace: 'from-indigo-500 to-purple-500',
    mapGround: '#C7D2FE',
    mapGroundSpeck: '#A5B4FC',
    scene: {
      weather: 'sparkles',
      ground: ['grass', 'flower', 'grass', 'flower', 'grass'],
      animals: ['bird', 'rabbit']
    }
  },
  chinese_newyear: {
    id: 'chinese_newyear',
    name: 'Édition Nouvel An Chinois',
    emoji: '🐉',
    boardBg: 'from-red-50 via-amber-50 to-red-50',
    path: 'bg-red-300',
    cell: 'bg-white border-red-200',
    cellFuture: 'bg-red-950/90 border-red-700',
    accent: 'text-red-600',
    accentBg: 'bg-red-100',
    claimButton: 'from-red-600 to-amber-500',
    cardBack: 'from-red-700 to-amber-600',
    cardFace: 'from-red-500 to-amber-500',
    mapGround: '#FECACA',
    mapGroundSpeck: '#FCA5A5',
    scene: {
      weather: 'petals',
      ground: ['lantern', 'bamboo', 'lantern', 'bamboo', 'lantern'],
      animals: ['bird', 'cat']
    }
  },
  eastern: {
    id: 'eastern',
    name: 'Édition Orientale',
    emoji: '🏜️',
    boardBg: 'from-amber-50 via-orange-50 to-yellow-50',
    path: 'bg-amber-300',
    cell: 'bg-white border-amber-200',
    cellFuture: 'bg-amber-950/90 border-amber-700',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-100',
    claimButton: 'from-amber-500 to-orange-500',
    cardBack: 'from-amber-700 to-orange-600',
    cardFace: 'from-amber-500 to-orange-500',
    mapGround: '#FDE68A',
    mapGroundSpeck: '#FCD34D',
    scene: {
      weather: 'leaves',
      ground: ['palm', 'grass', 'palm', 'grass', 'palm'],
      animals: ['camel', 'fox']
    }
  },
  indian: {
    id: 'indian',
    name: 'Édition Diwali',
    emoji: '🪔',
    boardBg: 'from-purple-50 via-fuchsia-50 to-orange-50',
    path: 'bg-purple-300',
    cell: 'bg-white border-purple-200',
    cellFuture: 'bg-purple-950/90 border-purple-700',
    accent: 'text-purple-600',
    accentBg: 'bg-purple-100',
    claimButton: 'from-purple-500 to-fuchsia-500',
    cardBack: 'from-purple-700 to-fuchsia-600',
    cardFace: 'from-purple-500 to-fuchsia-500',
    mapGround: '#E9D5FF',
    mapGroundSpeck: '#D8B4FE',
    scene: {
      weather: 'sparkles',
      ground: ['diya', 'flower', 'diya', 'flower', 'diya'],
      animals: ['deer', 'bird']
    }
  },
  japanese: {
    id: 'japanese',
    name: 'Édition Sakura',
    emoji: '🌸',
    boardBg: 'from-pink-50 via-rose-50 to-pink-100',
    path: 'bg-pink-300',
    cell: 'bg-white border-pink-200',
    cellFuture: 'bg-rose-950/90 border-rose-700',
    accent: 'text-pink-600',
    accentBg: 'bg-pink-100',
    claimButton: 'from-pink-500 to-rose-500',
    cardBack: 'from-pink-700 to-rose-600',
    cardFace: 'from-pink-400 to-rose-500',
    mapGround: '#FBCFE8',
    mapGroundSpeck: '#F9A8D4',
    scene: {
      weather: 'petals',
      ground: ['sakura', 'flower', 'sakura', 'flower', 'sakura'],
      animals: ['cat', 'fox']
    }
  },
  canadian: {
    id: 'canadian',
    name: 'Édition Canadienne',
    emoji: '🍁',
    boardBg: 'from-orange-50 via-amber-50 to-red-50',
    path: 'bg-orange-300',
    cell: 'bg-white border-orange-200',
    cellFuture: 'bg-stone-900/90 border-stone-600',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-100',
    claimButton: 'from-orange-500 to-red-500',
    cardBack: 'from-orange-700 to-red-600',
    cardFace: 'from-orange-500 to-red-500',
    mapGround: '#FED7AA',
    mapGroundSpeck: '#FDBA74',
    scene: {
      weather: 'leaves',
      ground: ['maple', 'grass', 'maple', 'grass', 'maple'],
      animals: ['deer', 'fox']
    }
  },
  french_civil: {
    id: 'french_civil',
    name: 'Édition Française',
    emoji: '🇫🇷',
    boardBg: 'from-blue-50 via-white to-red-50',
    path: 'bg-blue-300',
    cell: 'bg-white border-blue-200',
    cellFuture: 'bg-blue-950/90 border-blue-700',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-100',
    claimButton: 'from-blue-500 to-red-500',
    cardBack: 'from-blue-700 to-red-600',
    cardFace: 'from-blue-500 to-red-500',
    mapGround: '#BFDBFE',
    mapGroundSpeck: '#93C5FD',
    scene: {
      weather: 'confetti',
      ground: ['flower', 'grass', 'flower', 'grass', 'flower'],
      animals: ['bird', 'cat']
    }
  },
  french_cultural: {
    id: 'french_cultural',
    name: 'Édition Culturelle',
    emoji: '🎭',
    boardBg: 'from-violet-50 via-purple-50 to-fuchsia-50',
    path: 'bg-violet-300',
    cell: 'bg-white border-violet-200',
    cellFuture: 'bg-violet-950/90 border-violet-700',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-100',
    claimButton: 'from-violet-500 to-fuchsia-500',
    cardBack: 'from-violet-700 to-fuchsia-600',
    cardFace: 'from-violet-500 to-fuchsia-500',
    mapGround: '#DDD6FE',
    mapGroundSpeck: '#C4B5FD',
    scene: {
      weather: 'confetti',
      ground: ['flower', 'grass', 'flower', 'grass', 'flower'],
      animals: ['cat', 'bird']
    }
  }
};

export function getBoardTheme(themeId: string): BoardTheme {
  return boardThemes[themeId] || boardThemes.default;
}
