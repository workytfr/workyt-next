/**
 * Thèmes saisonniers de la Guerre des Clans.
 *
 * Un thème habille la semaine : décor du château, ambiance de la page, noms
 * des clans tirés le lundi. Il ne touche JAMAIS au jeu — les couleurs des camps
 * (bleu pour soi, rouge pour l'adversaire) et des jauges restent celles de la
 * charte, sinon on ne lit plus le champ de bataille.
 *
 * Le thème se déduit de la seule clé de saison (`2026-W43`) : même résultat
 * côté serveur et côté client, rien à stocker, et une semaine garde son thème
 * du lundi au dimanche même si elle chevauche deux périodes.
 *
 * Aucun import ici : le module est chargé par la page client.
 *
 * Pour ajouter un thème : une entrée dans THEMES, sa période dans CALENDRIER,
 * et son décor dans components/clan/castleDecor.tsx.
 */

export type ClanThemeId =
  | 'classique'
  | 'halloween'
  | 'automne'
  | 'hiver'
  | 'nouvel_an'
  | 'carnaval'
  | 'printemps'
  | 'examens'
  | 'ete';

/** Thèmes qui ont un décor propre (le classique n'en a pas) */
export type DecoratedThemeId = Exclude<ClanThemeId, 'classique'>;

export interface ClanTheme {
  id: ClanThemeId;
  /** Nom de la semaine, affiché dans l'en-tête */
  label: string;
  emoji: string;
  /** Une phrase d'ambiance sous l'en-tête */
  tagline: string;
  /** Noms de clans de la semaine ; à défaut, le catalogue habituel */
  names?: readonly string[];
  castle: {
    /** Ciel derrière le château (haut → bas) ; absent = papier de la charte */
    sky?: readonly [string, string];
    hills: string;
    ground: string;
    grass: string;
    /** Flamme des portes critiques : extérieur, cœur */
    flame: readonly [string, string];
    smoke: string;
    /** Éléments propres au thème, dessinés par castleDecor */
    decor: 'none' | DecoratedThemeId;
  };
  page?: {
    /** Halo de l'en-tête (valeur CSS `background`) */
    headerGlow: string;
    /** Fond de la pastille du thème (texte blanc dessus) */
    accent: string;
    /** Liseré des bannières de guerre du calendrier */
    ring: string;
  };
}

/** Halo d'en-tête : deux taches de couleur dans le coin droit. */
const glow = (a: string, b: string) =>
  `radial-gradient(60% 120% at 85% 0%, ${a} 0%, ${b} 45%, transparent 75%)`;

const FLAMME = ['#ff6a1a', '#ffb547'] as const;

const CLASSIQUE: ClanTheme = {
  id: 'classique',
  label: 'Guerre des Clans',
  emoji: '⚔️',
  tagline: '',
  castle: {
    hills: '#f5efe3',
    ground: '#efe6d4',
    grass: '#5fae3c',
    flame: FLAMME,
    smoke: '#b9ad9b',
    decor: 'none'
  }
};

const HALLOWEEN: ClanTheme = {
  id: 'halloween',
  label: 'La Nuit des Citrouilles',
  emoji: '🎃',
  tagline: 'La lune est pleine, les remparts sont hantés : que le clan le plus courageux l’emporte.',
  names: [
    'Clan des Spectres', 'Confrérie des Goules', 'Ordre de la Lune Rousse',
    'Manoir des Ombres', 'Cercle des Sorcières', 'Légion des Squelettes',
    'Meute des Loups-Garous', 'Crypte de Sombrebois', 'Coven du Chaudron',
    'Fantômes du Vieux Moulin', 'Château de Frissonval', 'Comté de Minuit',
    'Baronnie des Toiles', 'Ordre du Corbeau Noir', 'Garde des Lanternes',
    'Marche des Feux Follets', 'Seigneurie des Tombes', 'Abbaye Hantée',
    'Compagnie des Momies', 'Confrérie du Grimoire', 'Clan des Vampires',
    'Royaume de Brumenuit', 'Duché des Citrouilles', 'Guilde des Épouvantails',
    'Ordre de la Chandelle Noire', 'Cercle des Revenants', 'Marais des Lucioles',
    'Tour des Nécromants', 'Comté des Chauves-Souris', 'Principauté du Brouillard'
  ],
  castle: {
    sky: ['#241a38', '#6b4f93'],
    hills: '#3b2b55',
    ground: '#e3d6bd',
    grass: '#7d8f3a',
    flame: ['#7ed957', '#d9ffb0'],
    smoke: '#a596bd',
    decor: 'halloween'
  },
  page: {
    headerGlow: glow('rgba(107,79,147,0.22)', 'rgba(255,122,26,0.10)'),
    accent: '#3a2a57',
    ring: '#f97316'
  }
};

const AUTOMNE: ClanTheme = {
  id: 'automne',
  label: 'Les Brumes d’automne',
  emoji: '🍂',
  tagline: 'Les feuilles tombent sur les remparts : à l’abri des brumes, chaque point compte.',
  names: [
    'Clan des Feuilles Rousses', 'Ordre du Chêne Doré', 'Comté des Brumes',
    'Marche des Châtaignes', 'Duché de Roussebois', 'Guilde des Vendangeurs',
    'Baronnie des Champignons', 'Royaume de Feuillemorte', 'Compagnie des Glands',
    'Ordre de l’Érable', 'Seigneurie des Noisetiers', 'Comté des Sous-Bois',
    'Confrérie des Cueilleurs', 'Marche du Vent d’Ouest', 'Duché des Pluies Fines',
    'Principauté de Cuivreval', 'Clan des Hérissons', 'Garde des Vergers',
    'Royaume des Mille Couleurs', 'Ordre de la Lanterne d’Ambre'
  ],
  castle: {
    sky: ['#f2c38f', '#fbeee0'],
    hills: '#d08a4a',
    ground: '#ecdcbf',
    grass: '#b0812f',
    flame: FLAMME,
    smoke: '#b9ad9b',
    decor: 'automne'
  },
  page: {
    headerGlow: glow('rgba(208,138,74,0.24)', 'rgba(201,69,43,0.10)'),
    accent: '#8f4a1f',
    ring: '#e0712c'
  }
};

const HIVER: ClanTheme = {
  id: 'hiver',
  label: 'Le Siège d’hiver',
  emoji: '❄️',
  tagline: 'La neige recouvre les créneaux : gardez le feu allumé et les portes fermées.',
  names: [
    'Clan des Flocons', 'Ordre du Givre', 'Royaume des Neiges Éternelles',
    'Marche du Grand Froid', 'Duché de Blanchecime', 'Comté des Sapins',
    'Guilde des Bûcherons', 'Baronnie du Lac Gelé', 'Compagnie des Ours Blancs',
    'Ordre de l’Étoile d’Hiver', 'Seigneurie des Glaciers', 'Clan des Renards Polaires',
    'Principauté de Cristalval', 'Garde du Solstice', 'Confrérie des Traîneaux',
    'Marche des Aurores Froides', 'Duché des Cheminées', 'Royaume de Frimas',
    'Comté du Vin Chaud', 'Ordre des Bonhommes de Neige'
  ],
  castle: {
    sky: ['#7fb2dc', '#dcf0fa'],
    hills: '#f4f9fc',
    ground: '#f7fbfd',
    grass: '#9fc6d9',
    flame: FLAMME,
    smoke: '#c7d3dc',
    decor: 'hiver'
  },
  page: {
    headerGlow: glow('rgba(127,178,220,0.28)', 'rgba(220,240,250,0.30)'),
    accent: '#2f5f8a',
    ring: '#6ec1e4'
  }
};

const NOUVEL_AN: ClanTheme = {
  id: 'nouvel_an',
  label: 'Les Aurores du Nouvel An',
  emoji: '🎆',
  tagline: 'Une nouvelle année, une nouvelle guerre : que les feux d’artifice saluent les vainqueurs.',
  names: [
    'Clan des Aurores', 'Ordre des Douze Coups', 'Royaume des Étincelles',
    'Marche des Comètes', 'Duché de Minuit Pile', 'Comté des Lanternes Célestes',
    'Guilde des Artificiers', 'Baronnie des Vœux', 'Compagnie des Confettis d’Or',
    'Ordre de l’An Neuf', 'Seigneurie des Constellations', 'Clan des Étoiles Filantes',
    'Principauté du Premier Jour', 'Garde des Résolutions', 'Confrérie des Galettes',
    'Marche des Bulles', 'Duché de l’Aube Nouvelle', 'Royaume du Grand Compte à Rebours',
    'Comté des Cotillons', 'Ordre de la Fève d’Or'
  ],
  castle: {
    sky: ['#101a3f', '#3a3f7d'],
    hills: '#1f2752',
    ground: '#e3dccd',
    grass: '#6c8f6a',
    flame: FLAMME,
    smoke: '#9aa3c7',
    decor: 'nouvel_an'
  },
  page: {
    headerGlow: glow('rgba(58,63,125,0.24)', 'rgba(255,181,71,0.12)'),
    accent: '#1f2752',
    ring: '#ffb547'
  }
};

const CARNAVAL: ClanTheme = {
  id: 'carnaval',
  label: 'Le Grand Carnaval',
  emoji: '🎭',
  tagline: 'Masques, fanions et confettis : la fête est au château, mais la guerre continue !',
  names: [
    'Clan des Masques', 'Ordre des Confettis', 'Royaume des Mille Fanions',
    'Marche des Saltimbanques', 'Duché des Arlequins', 'Comté des Crêpes',
    'Guilde des Jongleurs', 'Baronnie des Grelots', 'Compagnie des Échassiers',
    'Ordre du Grand Défilé', 'Seigneurie des Plumes', 'Clan des Bouffons',
    'Principauté de Mardi Gras', 'Garde des Tambours', 'Confrérie des Serpentins',
    'Marche des Chars Fleuris', 'Duché des Paillettes', 'Royaume de Bigarrure',
    'Comté des Polichinelles', 'Ordre de la Fanfare'
  ],
  castle: {
    sky: ['#ffe2bd', '#fdf3e6'],
    hills: '#f4c6d8',
    ground: '#efe6d4',
    grass: '#5fae3c',
    flame: FLAMME,
    smoke: '#b9ad9b',
    decor: 'carnaval'
  },
  page: {
    headerGlow: glow('rgba(236,72,153,0.16)', 'rgba(255,181,71,0.16)'),
    accent: '#a3266b',
    ring: '#ec4899'
  }
};

const PRINTEMPS: ClanTheme = {
  id: 'printemps',
  label: 'Le Printemps des Cerisiers',
  emoji: '🌸',
  tagline: 'Les cerisiers fleurissent au pied des murs : la guerre repart en douceur… ou pas.',
  names: [
    'Clan des Cerisiers', 'Ordre de la Rosée', 'Royaume des Prés Fleuris',
    'Marche des Hirondelles', 'Duché de Bourgeonval', 'Comté des Tulipes',
    'Guilde des Jardiniers', 'Baronnie des Abeilles', 'Compagnie des Papillons',
    'Ordre du Lilas', 'Seigneurie des Sources Vives', 'Clan des Coquelicots',
    'Principauté de Florimont', 'Garde de l’Équinoxe', 'Confrérie des Semeurs',
    'Marche des Giboulées', 'Duché des Vergers en Fleur', 'Royaume de Primevère',
    'Comté des Lapins Blancs', 'Ordre de l’Arc-en-Ciel'
  ],
  castle: {
    sky: ['#bfe6fb', '#f0fbff'],
    hills: '#a8dc8a',
    ground: '#e9efd2',
    grass: '#4fae3c',
    flame: FLAMME,
    smoke: '#b9ad9b',
    decor: 'printemps'
  },
  page: {
    headerGlow: glow('rgba(244,114,182,0.16)', 'rgba(126,217,87,0.14)'),
    accent: '#b83e7a',
    ring: '#f472b6'
  }
};

const EXAMENS: ClanTheme = {
  id: 'examens',
  label: 'Le Siège des Examens',
  emoji: '📚',
  tagline: 'Brevet, bac, partiels : chaque fiche révisée renforce les remparts. Courage !',
  names: [
    'Clan des Révisions', 'Ordre de la Plume', 'Royaume des Fiches Bristol',
    'Marche des Surligneurs', 'Duché des Annales', 'Comté du Théorème',
    'Guilde des Bibliothécaires', 'Baronnie des Dictées', 'Compagnie des Compas',
    'Ordre de la Mention Très Bien', 'Seigneurie des Dissertations', 'Clan des Équations',
    'Principauté du Grand Oral', 'Garde des Brouillons', 'Confrérie des Cartes Mentales',
    'Marche des Rapporteurs', 'Duché des Conjugaisons', 'Royaume de Pythagore',
    'Comté des Flashcards', 'Ordre du Dernier Chapitre'
  ],
  castle: {
    sky: ['#fdf8ea', '#fffdf6'],
    hills: '#e9dfc7',
    ground: '#efe6d4',
    grass: '#5fae3c',
    flame: FLAMME,
    smoke: '#b9ad9b',
    decor: 'examens'
  },
  page: {
    headerGlow: glow('rgba(110,193,228,0.18)', 'rgba(229,72,77,0.08)'),
    accent: '#2f4f86',
    ring: '#3b82f6'
  }
};

const ETE: ClanTheme = {
  id: 'ete',
  label: 'L’Été des Pirates',
  emoji: '🏴‍☠️',
  tagline: 'Le château est en bord de mer et des voiles noires sont en vue : défendez le trésor !',
  names: [
    'Clan des Flibustiers', 'Ordre de la Boussole', 'Royaume des Îles d’Or',
    'Marche des Corsaires', 'Duché de Sablefin', 'Comté des Coquillages',
    'Guilde des Cartographes de la Mer', 'Baronnie des Mouettes', 'Compagnie du Perroquet',
    'Ordre de l’Ancre', 'Seigneurie des Récifs', 'Clan des Boucaniers',
    'Principauté du Grand Large', 'Garde du Phare', 'Confrérie du Trésor Perdu',
    'Marche des Alizés', 'Duché des Palmiers', 'Royaume de Corail',
    'Comté de la Marée Haute', 'Ordre du Drapeau Noir'
  ],
  castle: {
    sky: ['#7cc8ee', '#e6f6fd'],
    hills: '#3fa4d6',
    ground: '#f2dcaa',
    grass: '#8fb04a',
    flame: FLAMME,
    smoke: '#b9ad9b',
    decor: 'ete'
  },
  page: {
    headerGlow: glow('rgba(63,164,214,0.22)', 'rgba(242,220,170,0.25)'),
    accent: '#1d5f86',
    ring: '#3fa4d6'
  }
};

export const THEMES: Record<ClanThemeId, ClanTheme> = {
  classique: CLASSIQUE,
  halloween: HALLOWEEN,
  automne: AUTOMNE,
  hiver: HIVER,
  nouvel_an: NOUVEL_AN,
  carnaval: CARNAVAL,
  printemps: PRINTEMPS,
  examens: EXAMENS,
  ete: ETE
};

/**
 * Périodes (mois 1-12, jour). Une semaine prend le thème dont la période
 * contient son LUNDI. Hors période — du 1er septembre au 14 octobre, la
 * rentrée — c'est le thème classique.
 */
const CALENDRIER: { id: ClanThemeId; from: [number, number]; to: [number, number] }[] = [
  // Lundis du 15 au 31 octobre : les deux semaines qui mènent à la nuit du 31
  { id: 'halloween', from: [10, 15], to: [10, 31] },
  { id: 'automne', from: [11, 1], to: [11, 30] },
  // Noël compris ; la semaine qui enjambe le 1er janvier passe au Nouvel An
  { id: 'hiver', from: [12, 1], to: [12, 27] },
  { id: 'nouvel_an', from: [12, 28], to: [1, 31] },
  { id: 'carnaval', from: [2, 1], to: [2, 29] },
  { id: 'printemps', from: [3, 1], to: [4, 30] },
  // Brevet, bac, partiels
  { id: 'examens', from: [5, 1], to: [6, 30] },
  { id: 'ete', from: [7, 1], to: [8, 31] }
];

/** Lundi (UTC) d'une semaine ISO `2026-W43`, ou null si la clé est invalide. */
export function seasonMonday(season: string): Date | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(season);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  // Le 4 janvier est toujours en semaine 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  return monday;
}

export function isClanThemeId(id: unknown): id is ClanThemeId {
  return typeof id === 'string' && id in THEMES;
}

/** Thème d'une saison ; le thème classique hors période. */
export function clanThemeFor(season: string | null | undefined): ClanTheme {
  const monday = season ? seasonMonday(season) : null;
  if (!monday) return CLASSIQUE;
  const md = (monday.getUTCMonth() + 1) * 100 + monday.getUTCDate();
  const hit = CALENDRIER.find(({ from, to }) => {
    const a = from[0] * 100 + from[1];
    const b = to[0] * 100 + to[1];
    // Une période peut enjamber le nouvel an (décembre → janvier)
    return a <= b ? md >= a && md <= b : md >= a || md <= b;
  });
  return hit ? THEMES[hit.id] : CLASSIQUE;
}
