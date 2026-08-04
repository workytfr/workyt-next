import type { ChestRewardType } from '@/models/Chest';

/**
 * Probabilités d'un coffre, à partir des poids stockés en base.
 *
 * ⚠️ UNE SEULE implémentation. Le tirage réel se fait dans
 * `QuestService.openChest` (somme des poids → tirage pondéré) : si le calcul
 * affiché divergeait de celui-là, on afficherait aux joueurs des chances que le
 * serveur ne respecte pas. Toute page qui montre un butin passe donc par ici.
 *
 * Note : `openChest` peut gonfler les poids des récompenses rares quand le
 * boost « éclat de chance » est actif. Les pourcentages calculés ici sont donc
 * les chances DE BASE, hors boost — ce qui est la bonne chose à afficher sur
 * une page qui décrit un coffre non encore ouvert.
 */

export interface ChestRewardOdds {
  type: ChestRewardType;
  amount?: number;
  cosmeticType?: 'profile_image' | 'profile_border' | 'username_color';
  cosmeticId?: string;
  weight: number;
  /** Pourcentage entier, arrondi */
  probability: number;
}

export interface ChestWithOdds {
  _id: string;
  type: string;
  name: string;
  description: string;
  possibleRewards: ChestRewardOdds[];
}

/** Normalise un doc Chest (mongoose ou lean) en objet sérialisable + probabilités. */
export function withOdds(chest: any): ChestWithOdds {
  const rewards: any[] = chest.possibleRewards ?? [];
  const totalWeight = rewards.reduce((sum: number, r: any) => sum + (r.weight ?? 0), 0);

  return {
    _id: chest._id?.toString() ?? '',
    type: chest.type,
    name: chest.name,
    description: chest.description,
    possibleRewards: rewards.map((r: any) => {
      // `.toObject()` n'existe que sur un sous-document mongoose ; un `.lean()`
      // renvoie déjà un objet nu.
      const plain = typeof r.toObject === 'function' ? r.toObject() : r;
      return {
        ...plain,
        // Un coffre sans poids ne doit pas produire NaN% à l'écran.
        probability: totalWeight > 0 ? Math.round((plain.weight / totalWeight) * 100) : 0
      };
    })
  };
}
