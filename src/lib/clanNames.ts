/**
 * Noms de clans de la Guerre des Clans.
 *
 * Tirés à la formation, sans doublon parmi les clans actifs de la semaine
 * (voir clanService.formClans). 160 noms au total : largement de quoi couvrir
 * les 14 clans d'une population de 200 joueurs actifs.
 */

export const ROYAUMES: string[] = [
  // Royaumes (25)
  'Royaume de Valmont', 'Royaume des Cendres', "Royaume du Vent d'Est",
  'Royaume de Pierrefonds', 'Royaume des Trois Rivières', 'Royaume de Roquebrune',
  "Royaume du Cap d'Ambre", 'Royaume de Belleforêt', 'Royaume des Hautes Terres',
  'Royaume de Montclair', 'Royaume du Val Perdu', 'Royaume de Sombreval',
  'Royaume des Brumes', 'Royaume de Clairefontaine', 'Royaume du Pic Blanc',
  'Royaume de Rochenoire', 'Royaume des Sept Collines', 'Royaume de Prévent',
  'Royaume du Lac Miroir', 'Royaume de Chênebourg', 'Royaume des Grands Chênes',
  'Royaume de Fontcombe', 'Royaume du Levant', 'Royaume de Vaudrey',
  'Royaume des Falaises',

  // Duchés (20)
  'Duché de Montfort', 'Duché des Ormes', 'Duché de Bellegarde',
  'Duché du Ponant', 'Duché de Saint-Aubin', 'Duché des Vignes',
  'Duché de Beaulieu', 'Duché de Vieux-Château', 'Duché des Tourelles',
  'Duché de Longpré', 'Duché du Grand Val', 'Duché de Ronceval',
  'Duché des Cyprès', 'Duché de Hautecombe', 'Duché de Brumelune',
  'Duché des Marais', 'Duché de Rochefort', "Duché du Pont d'Argent",
  'Duché de Verlaine', 'Duché des Coteaux',

  // Comtés (20)
  'Comté de Cendrelune', 'Comté des Ardents', 'Comté de Villeneuve',
  'Comté du Bois Dormant', 'Comté de Grisemont', 'Comté des Pierres Levées',
  'Comté de Fauvel', 'Comté du Cerf Blanc', 'Comté de Noirlac',
  'Comté des Trois Ponts', 'Comté de Saulieu', 'Comté du Vieux Puits',
  'Comté de Bramecourt', 'Comté des Landes', 'Comté de Tourvieille',
  'Comté du Guet', 'Comté de Marlonge', 'Comté des Aigles',
  'Comté de Verchamp', 'Comté du Ravin',

  // Marches (15)
  'Marche de Fer', 'Marche des Sentinelles', 'Marche du Nord Sauvage',
  'Marche de Rocheclaire', 'Marche des Confins', 'Marche du Dernier Pont',
  'Marche de Ventebise', 'Marche des Loups Gris', 'Marche de Haute-Garde',
  'Marche du Silence', 'Marche des Neiges', 'Marche de Brisecœur',
  'Marche du Passage', 'Marche des Écus', 'Marche de Trois-Tours',

  // Baronnies (10)
  'Baronnie de Prélombre', 'Baronnie des Roseaux', 'Baronnie du Vieux Moulin',
  'Baronnie de Cendrefeu', 'Baronnie des Sources', 'Baronnie de Malbourg',
  'Baronnie du Chemin Creux', 'Baronnie des Hérons', 'Baronnie de Sablon',
  'Baronnie du Dernier Chêne',

  // Principautés (10)
  "Principauté d'Aurevent", 'Principauté des Îles Claires',
  'Principauté de Solmont', 'Principauté du Croissant', 'Principauté de Vermeil',
  'Principauté des Étoiles', "Principauté d'Orfeuil", "Principauté du Val d'Or",
  'Principauté de Lumeval', 'Principauté des Aurores'
];

export const GUILDES: string[] = [
  // Guildes (20)
  'Guilde des Lames Grises', "Guilde du Marteau d'Or", 'Guilde des Veilleurs',
  "Guilde de la Plume d'Argent", 'Guilde des Forgerons', 'Guilde du Croissant Noir',
  'Guilde des Semeurs', 'Guilde de la Lanterne', "Guilde des Chercheurs d'Aube",
  'Guilde du Fil Rouge', 'Guilde des Bâtisseurs', 'Guilde de la Clé Brisée',
  'Guilde des Cartographes', 'Guilde du Sablier', 'Guilde des Herboristes',
  'Guilde de la Voûte', 'Guilde des Passeurs', "Guilde du Cor d'Ivoire",
  'Guilde des Enlumineurs', 'Guilde de la Balance',

  // Ordres (20)
  'Ordre du Chêne', 'Ordre des Cendres Blanches', 'Ordre du Lion Dormant',
  'Ordre de la Rose de Fer', 'Ordre des Sentinelles', 'Ordre du Serment',
  "Ordre de l'Étoile Polaire", 'Ordre des Braises', 'Ordre du Rempart',
  'Ordre de la Main Ouverte', 'Ordre des Silencieux', 'Ordre du Faucon Gris',
  'Ordre de la Source', 'Ordre des Trois Clés', 'Ordre du Voile',
  'Ordre de la Lame Courbe', 'Ordre des Gardiens', 'Ordre du Crépuscule',
  'Ordre de la Pierre Levée', 'Ordre des Aurores',

  // Compagnies (20)
  'Compagnie des Cendres', 'Compagnie du Vent Franc',
  'Compagnie des Loups Blancs', 'Compagnie de la Bannière Verte',
  'Compagnie des Écorcheurs', 'Compagnie du Sanglier',
  'Compagnie des Deux Rives', 'Compagnie de la Herse', 'Compagnie des Piques',
  'Compagnie du Corbeau', 'Compagnie des Francs-Archers',
  'Compagnie de la Tour Penchée', 'Compagnie des Marcheurs', 'Compagnie du Gué',
  'Compagnie des Étendards', 'Compagnie de la Meute',
  'Compagnie des Braconniers', 'Compagnie du Rempart Sud',
  'Compagnie des Vagabonds', "Compagnie de l'Aube Rouge"
];

export const TOUS_LES_NOMS: string[] = [...ROYAUMES, ...GUILDES];

/**
 * Tire `count` noms distincts, en excluant ceux déjà pris.
 * Mélange de Fisher-Yates sur une copie — l'ordre de la liste source ne
 * doit pas déterminer qui obtient les premiers noms.
 */
export function pickClanNames(count: number, exclude: string[] = []): string[] {
  const taken = new Set(exclude);
  const pool = TOUS_LES_NOMS.filter((n) => !taken.has(n));

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Repli si la population dépasse le catalogue : on suffixe (II, III…)
  const picked = pool.slice(0, count);
  let suffix = 2;
  while (picked.length < count) {
    const base = TOUS_LES_NOMS[(picked.length * 7) % TOUS_LES_NOMS.length];
    picked.push(`${base} ${'I'.repeat(Math.min(suffix, 3))}`);
    suffix++;
  }
  return picked;
}
