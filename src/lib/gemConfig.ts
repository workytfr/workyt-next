// Configuration du système de gemmes
export const GEM_CONFIG = {
  // Taux de conversion points → gemmes
  CONVERSION_RATE: 100, // 100 points = 1 gemme
  
  // Prix des personnalisations en gemmes
  PRICES: {
    usernameColor: {
      // Couleurs basiques
      solid: 3,
      gradient: 5,
      
      // Couleurs spéciales  
      rainbow: 10,
      neon: 15,
      automne: 20,
      galaxy: 25,
      fire: 30,
      ice: 30,
      lightning: 35,
      cosmic: 40,
      diamond: 45,
      legendary: 50,
      
      // Styles typographiques
      glitch: 35,
      stardust: 40,
      nitro: 55,
      typewriter: 25,
      
      // Couleurs personnalisées
      custom: 8
    },
    profileImage: {
      'FoxyMecha.webp': 2,
      'FoxyTerreur.webp': 10,
      'FoxyHallo.webp': 10,
      'FoxyFrenchies.webp': 50,
      'FoxyPink.webp': 10,
      'FoxyWaMe.webp': 2,
      'FoxyWaterMelon.webp': 2,
      'FoxySably.webp': 30,
    },
    profileBorder: {
      gold: 3,
      silver: 2,
      eclair_green: 15,
      fumee: 10,
      poison_orange: 20,
      halloween_pumpkins_apng: 3,
      yumego_manga: 5
    }
  },
  
  // Limites et contraintes
  LIMITS: {
    minPointsForConversion: 100,
    maxPointsPerConversion: 10000,
    maxGemsPerUser: 1000
  },
  
  // Types de personnalisations disponibles
  CUSTOMIZATION_TYPES: {
    usernameColor: ['solid', 'gradient', 'rainbow', 'neon', 'automne', 'galaxy', 'fire', 'ice', 'lightning', 'cosmic', 'diamond', 'legendary', 'glitch', 'stardust', 'nitro', 'typewriter', 'custom'],
    profileImage: [
      'FoxyMecha.webp',
      'FoxyTerreur.webp', 
      'FoxyHallo.webp',
      'FoxyFrenchies.webp',
      'FoxyPink.webp',
      'FoxyWaMe.webp',
      'FoxyWaterMelon.webp',
      'FoxySably.webp',
      'FoxyLmdpc.webp',
      'FoxyStagey.webp',
    ],
    profileBorder: ['gold', 'silver', 'eclair_green', 'fumee', 'poison_orange', 'bronze', 'rainbow', 'halloween_pumpkins_apng', 'yumego_manga']
  },
  
  // Couleurs par défaut
  DEFAULT_COLORS: {
    solid: '#3B82F6',
    gradient: '#3B82F6',
    rainbow: 'rainbow',
    neon: '#00FF00',
    automne: '#FF6B35',
    galaxy: '#4C1D95',
    fire: '#DC2626',
    ice: '#0EA5E9',
    lightning: '#F59E0B',
    cosmic: '#7C3AED',
    diamond: '#10B981',
    legendary: '#F97316',
    custom: '#FF6B6B'
  },
  
  // Messages d'erreur
  MESSAGES: {
    insufficientPoints: 'Points insuffisants pour la conversion',
    insufficientGems: 'Gemmes insuffisantes pour cet achat',
    invalidAmount: 'Montant invalide',
    conversionSuccess: 'Conversion réussie !',
    purchaseSuccess: 'Achat réussi !'
  }
};

// Fonctions utilitaires
export const gemUtils = {
  // Calculer les gemmes à recevoir pour un nombre de points
  calculateGemsFromPoints: (points: number): number => {
    return Math.floor(points / GEM_CONFIG.CONVERSION_RATE);
  },
  
  // Calculer les points nécessaires pour un nombre de gemmes
  calculatePointsFromGems: (gems: number): number => {
    return gems * GEM_CONFIG.CONVERSION_RATE;
  },
  
  // Vérifier si un montant de points est valide pour la conversion
  isValidPointsAmount: (points: number): boolean => {
    return points >= GEM_CONFIG.LIMITS.minPointsForConversion && 
           points <= GEM_CONFIG.LIMITS.maxPointsPerConversion &&
           points % GEM_CONFIG.CONVERSION_RATE === 0;
  },
  
  // Obtenir le prix d'une personnalisation
  getCustomizationPrice: (itemType: string, itemValue?: string): number => {
    if (itemType === 'usernameColor' && itemValue) {
      return GEM_CONFIG.PRICES.usernameColor[itemValue as keyof typeof GEM_CONFIG.PRICES.usernameColor] || 0;
    }
    
    if (itemType === 'profileBorder' && itemValue) {
      return GEM_CONFIG.PRICES.profileBorder[itemValue as keyof typeof GEM_CONFIG.PRICES.profileBorder] || 0;
    }
    
    if (itemType === 'profileImage' && itemValue) {
      return GEM_CONFIG.PRICES.profileImage[itemValue as keyof typeof GEM_CONFIG.PRICES.profileImage] || 0;
    }
    
    return 0;
  },
  
  // Formater le nombre de gemmes pour l'affichage
  formatGems: (gems: number): string => {
    if (gems < 1000) return gems.toString();
    if (gems < 1000000) return (gems / 1000).toFixed(1) + 'k';
    return (gems / 1000000).toFixed(1) + 'M';
  }
};

export default GEM_CONFIG;
