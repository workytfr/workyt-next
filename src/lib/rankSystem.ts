export interface Rank {
  name: string;
  level: number;
  color: string;
  gradient: string;
  badge: string;
  minPoints: number;
  description: string;
  world: string;
  worldDescription: string;
  worldLevel: number; // Niveau dans le monde (1-3)
}

export interface PrestigeTier {
  name: string;
  badge: string;
  color: string;
  gradient: string;
  from: number;
  to: number;
}

// 20 tiers × 5 niveaux = 100 niveaux de prestige
export const PRESTIGE_TIERS: PrestigeTier[] = [
  { name: 'Bronze',     badge: '🥉', color: '#B87333', gradient: 'from-amber-700 to-yellow-600',          from: 1,  to: 5  },
  { name: 'Argent',     badge: '🥈', color: '#A8A9AD', gradient: 'from-slate-400 to-gray-300',            from: 6,  to: 10 },
  { name: 'Or',         badge: '🥇', color: '#FFD700', gradient: 'from-yellow-400 to-amber-400',           from: 11, to: 15 },
  { name: 'Émeraude',   badge: '💚', color: '#50C878', gradient: 'from-emerald-500 to-green-400',         from: 16, to: 20 },
  { name: 'Rubis',      badge: '❤️', color: '#E0115F', gradient: 'from-rose-600 to-red-500',              from: 21, to: 25 },
  { name: 'Diamant',    badge: '💎', color: '#4FC3F7', gradient: 'from-sky-300 to-cyan-200',              from: 26, to: 30 },
  { name: 'Cristal',    badge: '🔮', color: '#AA00FF', gradient: 'from-purple-600 to-violet-500',         from: 31, to: 35 },
  { name: 'Saphir',     badge: '💙', color: '#0F52BA', gradient: 'from-blue-700 to-indigo-500',           from: 36, to: 40 },
  { name: 'Améthyste',  badge: '💜', color: '#9966CC', gradient: 'from-violet-600 to-purple-500',        from: 41, to: 45 },
  { name: 'Platine',    badge: '⚡', color: '#B0BEC5', gradient: 'from-slate-300 to-gray-200',            from: 46, to: 50 },
  { name: 'Opale',      badge: '🌈', color: '#90CAF9', gradient: 'from-sky-300 to-pink-300',              from: 51, to: 55 },
  { name: 'Onyx',       badge: '🖤', color: '#37474F', gradient: 'from-gray-800 to-gray-700',             from: 56, to: 60 },
  { name: 'Perle',      badge: '🤍', color: '#ECEFF1', gradient: 'from-gray-100 to-stone-200',            from: 61, to: 65 },
  { name: 'Corail',     badge: '🪸', color: '#FF7043', gradient: 'from-orange-400 to-red-400',            from: 66, to: 70 },
  { name: 'Topaze',     badge: '🌟', color: '#FFA000', gradient: 'from-yellow-300 to-amber-300',          from: 71, to: 75 },
  { name: 'Jade',       badge: '🍃', color: '#00897B', gradient: 'from-teal-600 to-green-500',            from: 76, to: 80 },
  { name: 'Obsidienne', badge: '🌑', color: '#212121', gradient: 'from-gray-900 to-gray-800',             from: 81, to: 85 },
  { name: 'Aurore',     badge: '🌅', color: '#FF5722', gradient: 'from-rose-400 to-orange-300',           from: 86, to: 90 },
  { name: 'Céleste',    badge: '✨', color: '#00BCD4', gradient: 'from-cyan-400 to-sky-300',              from: 91, to: 95 },
  { name: 'Étoile',     badge: '⭐', color: '#FFD700', gradient: 'from-yellow-300 via-amber-400 to-orange-400', from: 96, to: 100 },
];

const PRESTIGE_START = 28000;
const PRESTIGE_PTS_PER_LEVEL = 5000;
const MAX_PRESTIGE = 100;
export const PRESTIGE_ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

export interface PrestigeInfo {
  level: number;
  displayLevel: string;
  tier: PrestigeTier | null;
  rankInTier: number;
  badge: string;
  color: string;
  gradient: string;
  nextLevelPoints: number;
  progressInLevel: number;
}

export function getPrestigeInfo(points: number): PrestigeInfo {
  if (points < PRESTIGE_START) {
    return { level: 0, displayLevel: '', tier: null, rankInTier: 0, badge: '', color: '', gradient: '', nextLevelPoints: 0, progressInLevel: 0 };
  }

  const raw = Math.floor((points - PRESTIGE_START) / PRESTIGE_PTS_PER_LEVEL) + 1;
  const level = Math.min(raw, MAX_PRESTIGE + 1);

  if (level > MAX_PRESTIGE) {
    const lastTier = PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1];
    return {
      level: 101,
      displayLevel: '100+',
      tier: lastTier,
      rankInTier: 5,
      badge: `${lastTier.badge} 100+`,
      color: lastTier.color,
      gradient: lastTier.gradient,
      nextLevelPoints: 0,
      progressInLevel: 100,
    };
  }

  const tierIndex = Math.floor((level - 1) / 5);
  const rankInTier = ((level - 1) % 5) + 1;
  const tier = PRESTIGE_TIERS[tierIndex];

  const pointsIntoLevel = (points - PRESTIGE_START) - (level - 1) * PRESTIGE_PTS_PER_LEVEL;
  const progressInLevel = Math.min((pointsIntoLevel / PRESTIGE_PTS_PER_LEVEL) * 100, 100);
  const nextLevelPoints = PRESTIGE_PTS_PER_LEVEL - pointsIntoLevel;

  return {
    level,
    displayLevel: `${tier.name} ${PRESTIGE_ROMAN[rankInTier - 1]}`,
    tier,
    rankInTier,
    badge: `${tier.badge} ${PRESTIGE_ROMAN[rankInTier - 1]}`,
    color: tier.color,
    gradient: tier.gradient,
    nextLevelPoints,
    progressInLevel,
  };
}

export const RANKS: Rank[] = [
  // Monde 1 : Monde des Mangas
  {
    name: "Ninja",
    level: 1,
    color: "#6B7280",
    gradient: "from-slate-500 to-gray-600",
    badge: "🌱",
    minPoints: 0,
    description: "Nouveau sur la plateforme",
    world: "Monde des Mangas",
    worldDescription: "Découvre la culture japonaise et l'art du manga",
    worldLevel: 1
  },
  {
    name: "Kunoichi",
    level: 2,
    color: "#3B82F6",
    gradient: "from-blue-500 to-indigo-600",
    badge: "📚",
    minPoints: 50,
    description: "Commence à s'impliquer",
    world: "Monde des Mangas",
    worldDescription: "Découvre la culture japonaise et l'art du manga",
    worldLevel: 2
  },
  {
    name: "Sensei",
    level: 3,
    color: "#10B981",
    gradient: "from-emerald-400 to-teal-500",
    badge: "🎓",
    minPoints: 150,
    description: "Apprentissage régulier",
    world: "Monde des Mangas",
    worldDescription: "Découvre la culture japonaise et l'art du manga",
    worldLevel: 3
  },

  // Monde 2 : Monde Français
  {
    name: "Élève",
    level: 4,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
    badge: "⭐",
    minPoints: 300,
    description: "Premiers pas dans le savoir",
    world: "Monde Français",
    worldDescription: "Explore la langue et la culture française",
    worldLevel: 1
  },
  {
    name: "Étudiant",
    level: 5,
    color: "#F59E0B",
    gradient: "from-amber-400 to-yellow-500",
    badge: "📖",
    minPoints: 500,
    description: "Connaissances en expansion",
    world: "Monde Français",
    worldDescription: "Explore la langue et la culture française",
    worldLevel: 2
  },
  {
    name: "Professeur",
    level: 6,
    color: "#EF4444",
    gradient: "from-red-500 to-rose-600",
    badge: "🔥",
    minPoints: 800,
    description: "Maître de la langue",
    world: "Monde Français",
    worldDescription: "Explore la langue et la culture française",
    worldLevel: 3
  },

  // Monde 3 : Monde des Renards et Fées
  {
    name: "Renardeau",
    level: 7,
    color: "#EC4899",
    gradient: "from-pink-500 to-fuchsia-600",
    badge: "🌟",
    minPoints: 1200,
    description: "Entré dans le monde magique",
    world: "Monde des Renards et Fées",
    worldDescription: "Plonge dans l'univers magique des contes",
    worldLevel: 1
  },
  {
    name: "Renard",
    level: 8,
    color: "#8B5CF6",
    gradient: "from-purple-500 to-violet-600",
    badge: "🦊",
    minPoints: 1600,
    description: "Renard expérimenté",
    world: "Monde des Renards et Fées",
    worldDescription: "Plonge dans l'univers magique des contes",
    worldLevel: 2
  },
  {
    name: "Renard Sage",
    level: 9,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    badge: "🧙‍♂️",
    minPoints: 2000,
    description: "Renard légendaire",
    world: "Monde des Renards et Fées",
    worldDescription: "Plonge dans l'univers magique des contes",
    worldLevel: 3
  },

  // Monde 4 : Monde Québécois
  {
    name: "Hockeyeur",
    level: 10,
    color: "#EF4444",
    gradient: "from-red-500 to-rose-600",
    badge: "🍁",
    minPoints: 2500,
    description: "Découvreur québécois",
    world: "Monde Québécois",
    worldDescription: "Découvre la culture québécoise unique",
    worldLevel: 1
  },
  {
    name: "Voyageur",
    level: 11,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    badge: "🏔️",
    minPoints: 3000,
    description: "Explorateur du Grand Nord",
    world: "Monde Québécois",
    worldDescription: "Découvre la culture québécoise unique",
    worldLevel: 2
  },
  {
    name: "Québécois",
    level: 12,
    color: "#3B82F6",
    gradient: "from-blue-500 to-sky-600",
    badge: "🇨🇦",
    minPoints: 3500,
    description: "Véritable québécois",
    world: "Monde Québécois",
    worldDescription: "Découvre la culture québécoise unique",
    worldLevel: 3
  },

  // Monde 5 : Monde Égyptien
  {
    name: "Sphinx",
    level: 13,
    color: "#D97706",
    gradient: "from-amber-600 to-yellow-700",
    badge: "🏺",
    minPoints: 4000,
    description: "Gardien des secrets",
    world: "Monde Égyptien",
    worldDescription: "Explore les mystères de l'Égypte ancienne",
    worldLevel: 1
  },
  {
    name: "Scribe",
    level: 14,
    color: "#F59E0B",
    gradient: "from-yellow-500 to-amber-600",
    badge: "📜",
    minPoints: 4500,
    description: "Gardien du savoir",
    world: "Monde Égyptien",
    worldDescription: "Explore les mystères de l'Égypte ancienne",
    worldLevel: 2
  },
  {
    name: "Pharaon",
    level: 15,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    badge: "👑",
    minPoints: 5000,
    description: "Souverain d'Égypte",
    world: "Monde Égyptien",
    worldDescription: "Explore les mystères de l'Égypte ancienne",
    worldLevel: 3
  },

  // Monde 6 : Monde des Neiges et des Sables
  {
    name: "Nomade",
    level: 16,
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-600",
    badge: "🏕️",
    minPoints: 5500,
    description: "Voyageur des déserts",
    world: "Monde des Neiges et des Sables",
    worldDescription: "Voyage entre les déserts et les montagnes",
    worldLevel: 1
  },
  {
    name: "Explorateur",
    level: 17,
    color: "#10B981",
    gradient: "from-teal-500 to-emerald-600",
    badge: "🗺️",
    minPoints: 6000,
    description: "Découvreur de terres",
    world: "Monde des Neiges et des Sables",
    worldDescription: "Voyage entre les déserts et les montagnes",
    worldLevel: 2
  },
  {
    name: "Conquérant",
    level: 18,
    color: "#EF4444",
    gradient: "from-red-600 to-rose-700",
    badge: "⚔️",
    minPoints: 6500,
    description: "Maître des terres",
    world: "Monde des Neiges et des Sables",
    worldDescription: "Voyage entre les déserts et les montagnes",
    worldLevel: 3
  },

  // Monde 7 : Monde de l'Imaginaire et de la Recherche
  {
    name: "Rêveur",
    level: 19,
    color: "#8B5CF6",
    gradient: "from-purple-500 to-violet-600",
    badge: "💭",
    minPoints: 7000,
    description: "Créateur d'imaginaire",
    world: "Monde de l'Imaginaire",
    worldDescription: "Crée et explore des univers infinis",
    worldLevel: 1
  },
  {
    name: "Créateur",
    level: 20,
    color: "#F59E0B",
    gradient: "from-amber-400 to-orange-500",
    badge: "🎨",
    minPoints: 7500,
    description: "Artiste de l'imaginaire",
    world: "Monde de l'Imaginaire",
    worldDescription: "Crée et explore des univers infinis",
    worldLevel: 2
  },
  {
    name: "Visionnaire",
    level: 21,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    badge: "🌌",
    minPoints: 8000,
    description: "Maître de l'imaginaire",
    world: "Monde de l'Imaginaire",
    worldDescription: "Crée et explore des univers infinis",
    worldLevel: 3
  },

  // Monde 8 : Monde Médiéval
  {
    name: "Écuyer",
    level: 22,
    color: "#78716C",
    gradient: "from-stone-500 to-stone-600",
    badge: "⚔️",
    minPoints: 9000,
    description: "Novice du monde médiéval",
    world: "Monde Médiéval",
    worldDescription: "Forge ton destin dans les royaumes d'antan",
    worldLevel: 1
  },
  {
    name: "Chevalier",
    level: 23,
    color: "#0EA5E9",
    gradient: "from-sky-500 to-blue-600",
    badge: "🛡️",
    minPoints: 10500,
    description: "Gardien du royaume",
    world: "Monde Médiéval",
    worldDescription: "Forge ton destin dans les royaumes d'antan",
    worldLevel: 2
  },
  {
    name: "Roi",
    level: 24,
    color: "#D97706",
    gradient: "from-amber-500 to-yellow-600",
    badge: "👑",
    minPoints: 12000,
    description: "Souverain absolu",
    world: "Monde Médiéval",
    worldDescription: "Forge ton destin dans les royaumes d'antan",
    worldLevel: 3
  },

  // Monde 9 : Monde des Sciences
  {
    name: "Apprenti Chercheur",
    level: 25,
    color: "#10B981",
    gradient: "from-emerald-500 to-teal-600",
    badge: "🔬",
    minPoints: 14000,
    description: "Début de l'aventure scientifique",
    world: "Monde des Sciences",
    worldDescription: "Repousse les frontières de la connaissance",
    worldLevel: 1
  },
  {
    name: "Savant",
    level: 26,
    color: "#06B6D4",
    gradient: "from-cyan-500 to-sky-600",
    badge: "🧪",
    minPoints: 16500,
    description: "Maître de la théorie",
    world: "Monde des Sciences",
    worldDescription: "Repousse les frontières de la connaissance",
    worldLevel: 2
  },
  {
    name: "Génie",
    level: 27,
    color: "#6366F1",
    gradient: "from-indigo-500 to-purple-600",
    badge: "🧠",
    minPoints: 19000,
    description: "Intellect hors du commun",
    world: "Monde des Sciences",
    worldDescription: "Repousse les frontières de la connaissance",
    worldLevel: 3
  },

  // Monde 10 : Monde des Anciens
  {
    name: "Titan",
    level: 28,
    color: "#DC2626",
    gradient: "from-red-600 to-rose-700",
    badge: "🏛️",
    minPoints: 22000,
    description: "Force des anciens",
    world: "Monde des Anciens",
    worldDescription: "Atteins la sagesse des civilisations disparues",
    worldLevel: 1
  },
  {
    name: "Archimage",
    level: 29,
    color: "#7C3AED",
    gradient: "from-violet-600 to-purple-700",
    badge: "🌠",
    minPoints: 25000,
    description: "Maîtrise absolue des arcanes",
    world: "Monde des Anciens",
    worldDescription: "Atteins la sagesse des civilisations disparues",
    worldLevel: 2
  },
  {
    name: "Éternel",
    level: 30,
    color: "#F59E0B",
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    badge: "✨",
    minPoints: 28000,
    description: "Au-delà du temps et des mondes",
    world: "Monde des Anciens",
    worldDescription: "Atteins la sagesse des civilisations disparues",
    worldLevel: 3
  }
];

export function calculateUserRank(points: number): Rank {
  // Trouver le rank le plus élevé que l'utilisateur peut avoir
  const userRank = RANKS
    .filter(rank => rank.minPoints <= points)
    .sort((a, b) => b.level - a.level)[0];
  
  return userRank || RANKS[0];
}

export function getNextRank(points: number): Rank | null {
  const nextRank = RANKS.find(rank => rank.minPoints > points);
  return nextRank || null;
}

export function getRankProgress(points: number): {
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
  pointsNeeded: number;
} {
  const currentRank = calculateUserRank(points);
  const nextRank = getNextRank(points);
  
  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progress: 100,
      pointsNeeded: 0
    };
  }
  
  const pointsInCurrentRank = points - currentRank.minPoints;
  const pointsForNextRank = nextRank.minPoints - currentRank.minPoints;
  const progress = Math.min((pointsInCurrentRank / pointsForNextRank) * 100, 100);
  
  return {
    currentRank,
    nextRank,
    progress,
    pointsNeeded: nextRank.minPoints - points
  };
} 