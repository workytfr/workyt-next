/**
 * Catalogue d'équipement RPG « Workyt Quest ».
 * 3 slots (arme/armure/amulette) × 4 raretés.
 * Drop : boss du 15 (pool pondéré) + set de cartes complet (legendary).
 */

export type EquipmentSlot = 'weapon' | 'armor' | 'amulet';
export type EquipmentRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface EquipmentDef {
  id: string;
  name: string;
  emoji: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  stat: number; // +atk pour weapon, +def pour armor, +hpMax pour amulet
  flavor: string; // Description rigolote
}

export const EQUIPMENT_CATALOG: EquipmentDef[] = [
  // --- Armes (+attaque) ---
  { id: 'w_wood', name: 'Épée en Bois', emoji: '🗡️', slot: 'weapon', rarity: 'common', stat: 1, flavor: 'Forgée dans un crayon HB sacré.' },
  { id: 'w_iron', name: 'Épée de Fer', emoji: '⚔️', slot: 'weapon', rarity: 'rare', stat: 2, flavor: 'A tranché 1000 mauvaises réponses.' },
  { id: 'w_drake', name: 'Lame Draconique', emoji: '🔥', slot: 'weapon', rarity: 'epic', stat: 4, flavor: 'Le dragon a donné son écaille. De bonne grâce, paraît-il.' },
  { id: 'w_excel', name: 'Excalibur du Savoir', emoji: '✨', slot: 'weapon', rarity: 'legendary', stat: 7, flavor: 'Seul un héros ayant révisé peut la sortir du rocher.' },
  // --- Armures (+défense) ---
  { id: 'a_cloth', name: 'Tunique Usée', emoji: '👕', slot: 'armor', rarity: 'common', stat: 1, flavor: 'Sent légèrement la craie.' },
  { id: 'a_mail', name: 'Cotte de Mailles', emoji: '🛡️', slot: 'armor', rarity: 'rare', stat: 2, flavor: 'Chaque anneau est une formule apprise par cœur.' },
  { id: 'a_diamond', name: 'Armure de Diamant', emoji: '💎', slot: 'armor', rarity: 'epic', stat: 4, flavor: 'Taillée dans un diamant qui n\'a jamais été dépensé.' },
  { id: 'a_aegis', name: 'Égide Céleste', emoji: '🌟', slot: 'armor', rarity: 'legendary', stat: 6, flavor: 'Les mauvaises réponses rebondissent littéralement dessus.' },
  // --- Amulettes (+HP max) ---
  { id: 'm_simple', name: 'Amulette Simple', emoji: '📿', slot: 'amulet', rarity: 'common', stat: 4, flavor: '+4 PV et un soupçon de confiance.' },
  { id: 'm_sage', name: 'Talisman du Sage', emoji: '🔮', slot: 'amulet', rarity: 'rare', stat: 8, flavor: 'Chuchote des indices. Parfois les bons.' },
  { id: 'm_heart', name: 'Cœur de Dragon', emoji: '❤️‍🔥', slot: 'amulet', rarity: 'epic', stat: 14, flavor: 'Bat au rythme de tes streaks.' },
  { id: 'm_eternal', name: 'Amulette Éternelle', emoji: '🌈', slot: 'amulet', rarity: 'legendary', stat: 20, flavor: 'Légende : elle a survécu à un mois de février complet.' }
];

export function getEquipment(id: string): EquipmentDef | undefined {
  return EQUIPMENT_CATALOG.find(e => e.id === id);
}

/** Tirage pondéré pour le loot de boss : 45% rare, 35% epic, 20% legendary */
export function rollBossLoot(): EquipmentDef {
  const roll = Math.random();
  const rarity: EquipmentRarity = roll < 0.45 ? 'rare' : roll < 0.8 ? 'epic' : 'legendary';
  const pool = EQUIPMENT_CATALOG.filter(e => e.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Tirage epic garanti pour le set de cartes complet (pas de legendary : plafond volontaire) */
export function rollEpicLoot(): EquipmentDef {
  const pool = EQUIPMENT_CATALOG.filter(e => e.rarity === 'epic');
  return pool[Math.floor(Math.random() * pool.length)];
}
