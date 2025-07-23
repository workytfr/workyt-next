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

export const RANKS: Rank[] = [
  // Monde 1 : Monde des Mangas
  {
    name: "Ninja",
    level: 1,
    color: "#6B7280",
    gradient: "from-gray-400 to-gray-500",
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
    gradient: "from-blue-400 to-blue-500",
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
    gradient: "from-green-400 to-green-500",
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
    gradient: "from-purple-400 to-purple-500",
    badge: "⭐",
    minPoints: 300,
    description: "Connaissances avancées",
    world: "Monde Français",
    worldDescription: "Explore la langue et la culture française",
    worldLevel: 1
  },
  {
    name: "Étudiant",
    level: 5,
    color: "#F59E0B",
    gradient: "from-yellow-400 to-yellow-500",
    badge: "👑",
    minPoints: 500,
    description: "Niveau maîtrise",
    world: "Monde Français",
    worldDescription: "Explore la langue et la culture française",
    worldLevel: 2
  },
  {
    name: "Professeur",
    level: 6,
    color: "#EF4444",
    gradient: "from-red-400 to-red-500",
    badge: "🔥",
    minPoints: 800,
    description: "Statut légendaire",
    world: "Monde Français",
    worldDescription: "Explore la langue et la culture française",
    worldLevel: 3
  },

  // Monde 3 : Monde des Renards et Fées
  {
    name: "Renardeau",
    level: 7,
    color: "#EC4899",
    gradient: "from-pink-400 to-pink-500",
    badge: "🌟",
    minPoints: 1200,
    description: "Statut immortel",
    world: "Monde des Renards et Fées",
    worldDescription: "Plonge dans l'univers magique des contes",
    worldLevel: 1
  },
  {
    name: "Renard",
    level: 8,
    color: "#8B5CF6",
    gradient: "from-purple-400 to-purple-500",
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
    gradient: "from-yellow-400 to-yellow-500",
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
    gradient: "from-red-400 to-red-500",
    badge: "🍁",
    minPoints: 2500,
    description: "Découvreur québécois",
    world: "Monde Québécois",
    worldDescription: "Découvre la culture québécoise unique",
    worldLevel: 1
  },
  {
    name: "Bagnole",
    level: 11,
    color: "#10B981",
    gradient: "from-green-400 to-green-500",
    badge: "🏠",
    minPoints: 3000,
    description: "Résident québécois",
    world: "Monde Québécois",
    worldDescription: "Découvre la culture québécoise unique",
    worldLevel: 2
  },
  {
    name: "Québécois",
    level: 12,
    color: "#3B82F6",
    gradient: "from-blue-400 to-blue-500",
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
    color: "#6B7280",
    gradient: "from-gray-400 to-gray-500",
    badge: "🏺",
    minPoints: 4000,
    description: "Début de l'aventure égyptienne",
    world: "Monde Égyptien",
    worldDescription: "Explore les mystères de l'Égypte ancienne",
    worldLevel: 1
  },
  {
    name: "Scribe",
    level: 14,
    color: "#F59E0B",
    gradient: "from-yellow-400 to-yellow-500",
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
    gradient: "from-pink-400 to-pink-500",
    badge: "👑",
    minPoints: 5000,
    description: "Roi d'Égypte",
    world: "Monde Égyptien",
    worldDescription: "Explore les mystères de l'Égypte ancienne",
    worldLevel: 3
  },

  // Monde 6 : Monde des Neiges et des Sables
  {
    name: "Nomade",
    level: 16,
    color: "#3B82F6",
    gradient: "from-blue-400 to-blue-500",
    badge: "🏔️",
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
    gradient: "from-green-400 to-green-500",
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
    gradient: "from-red-400 to-red-500",
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
    gradient: "from-purple-400 to-purple-500",
    badge: "💭",
    minPoints: 7000,
    description: "Créateur d'imaginaire",
    world: "Monde de l'Imaginaire et de la Recherche",
    worldDescription: "Crée et explore des univers infinis",
    worldLevel: 1
  },
  {
    name: "Créateur",
    level: 20,
    color: "#F59E0B",
    gradient: "from-yellow-400 to-yellow-500",
    badge: "🎨",
    minPoints: 7500,
    description: "Artiste de l'imaginaire",
    world: "Monde de l'Imaginaire et de la Recherche",
    worldDescription: "Crée et explore des univers infinis",
    worldLevel: 2
  },
  {
    name: "Immortel",
    level: 21,
    color: "#EC4899",
    gradient: "from-pink-400 to-pink-500",
    badge: "🌟",
    minPoints: 8000,
    description: "Maître de l'imaginaire",
    world: "Monde de l'Imaginaire et de la Recherche",
    worldDescription: "Crée et explore des univers infinis",
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