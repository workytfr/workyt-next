/**
 * Catalogue des unités de la Guerre des Clans — DONNÉES PURES.
 *
 * ⚠️ Ce fichier ne doit JAMAIS importer mongoose, un modèle ou dbConnect :
 * il est consommé par des composants client (ClanRules, GarrisonPanel).
 * La logique serveur — recrutement, déploiement, plafonds — vit dans
 * clanSoldiers.ts, qui réexporte tout ceci pour ne rien casser.
 */

export type SoldierKind = 'combat' | 'soutien';

export interface SoldierDef {
  key: string;
  name: string;
  emoji: string;
  kind: SoldierKind;
  cost: number;
  atk: number;
  def: number;
  /** Ne peut frapper que les portes (le Bélier) */
  gatesOnly?: boolean;
  /** Ignore la moitié de la défense adverse (le Sapeur) */
  sapper?: boolean;
  /** Effet quotidien des unités de soutien */
  effect?: string;
  description: string;
  /**
   * Illustration dans /public/clans/soldats.
   * ⚠️ La casse doit correspondre EXACTEMENT au fichier : le VPS de production
   * est sous Linux (système de fichiers sensible à la casse), contrairement
   * au poste de développement Windows. Une majuscule oubliée passe en local
   * et donne un 404 en production.
   */
  image: string;
}

const IMG = (f: string) => `/clans/soldats/${f}`;

export const SOLDIER_CATALOG: SoldierDef[] = [
  // --- combat ---
  { key: 'milicien', name: 'Milicien', emoji: '🪖', kind: 'combat', cost: 50, atk: 10, def: 10,
    image: IMG('Milicien.png'), description: 'Polyvalent et bon marché.' },
  { key: 'archer', name: 'Archer', emoji: '🏹', kind: 'combat', cost: 80, atk: 25, def: 5,
    image: IMG('Archer.png'), description: 'Frappe fort, encaisse mal.' },
  { key: 'piquier', name: 'Piquier', emoji: '🛡️', kind: 'combat', cost: 80, atk: 5, def: 25,
    image: IMG('Piquier.png'), description: 'Encaisse, ne frappe pas.' },
  { key: 'chevalier', name: 'Chevalier', emoji: '⚜️', kind: 'combat', cost: 150, atk: 30, def: 30,
    image: IMG('Chevalier.png'), description: 'Élite polyvalente.' },
  { key: 'baliste', name: 'Baliste', emoji: '🎯', kind: 'combat', cost: 180, atk: 45, def: 10,
    image: IMG('Baliste.png'), description: 'Frappe à distance.' },
  { key: 'belier', name: 'Bélier', emoji: '🐏', kind: 'combat', cost: 200, atk: 60, def: 0, gatesOnly: true,
    image: IMG('Belier.png'), description: "Uniquement contre les portes. C'est une clé, pas une arme." },
  { key: 'sapeur', name: 'Sapeur', emoji: '🔥', kind: 'combat', cost: 220, atk: 50, def: 5, sapper: true,
    image: IMG('Sapeur.png'), description: 'Ignore la moitié de la défense adverse.' },

  // --- soutien ---
  { key: 'eclaireur', name: 'Éclaireur', emoji: '🔭', kind: 'soutien', cost: 90, atk: 0, def: 0,
    image: IMG('Eclaireur.png'), effect: 'reveal', description: "Révèle en direct où l'ennemi masse son assaut." },
  { key: 'infirmier', name: 'Infirmier', emoji: '⛑️', kind: 'soutien', cost: 100, atk: 0, def: 0,
    image: IMG('infirmier.png'), effect: 'heal_player', description: "Remet 1 joueur blessé d'aplomb chaque jour." },
  { key: 'medecin', name: 'Médecin de camp', emoji: '🩺', kind: 'soutien', cost: 120, atk: 0, def: 0,
    image: IMG('medecin.png'), effect: 'heal_soldier', description: 'Remet 1 unité à 100 % chaque jour.' },
  { key: 'forgeron', name: 'Forgeron', emoji: '🔨', kind: 'soutien', cost: 140, atk: 0, def: 0,
    image: IMG('forgeron.png'), effect: 'repair', description: 'Posté en défense, répare 40 PV sur sa porte chaque nuit.' },
  { key: 'etendard', name: 'Porte-étendard', emoji: '🚩', kind: 'soutien', cost: 160, atk: 0, def: 0,
    image: IMG('Porte.png'), effect: 'banner', description: '+10 % à toutes les unités de sa porte.' }
];

export const SOLDIER_BY_KEY = new Map(SOLDIER_CATALOG.map((s) => [s.key, s]));

/** Où poster une unité pour qu'elle serve. */
export type UnitPlacement = 'porte' | 'defense' | 'partout';

export interface UnitGuide {
  /** Ce qu'elle apporte, en une phrase lisible par un débutant */
  headline: string;
  /** Effets concrets, ligne par ligne */
  lines: string[];
  placement: UnitPlacement;
  /** Où la poster, dit simplement */
  where: string;
}

/**
 * Ce que fait réellement chaque unité, en clair.
 *
 * ⚠️ Ces textes décrivent le CALCUL (clanCombat.ts) : si une règle change là-bas,
 * elle change ici. Une fiche qui promet autre chose que la résolution de minuit
 * est pire que pas de fiche.
 */
const GUIDES: Record<string, Omit<UnitGuide, 'placement' | 'where'> & Partial<Pick<UnitGuide, 'placement' | 'where'>>> = {
  milicien: {
    headline: 'Le soldat à tout faire : correct partout, excellent nulle part.',
    lines: ["À l'assaut : +10 de force contre la porte visée.", 'En défense : +10 de défense sur ta porte.']
  },
  archer: {
    headline: "Une lame, pas un bouclier : à envoyer à l'assaut.",
    lines: ["À l'assaut : +25 de force.", 'En défense : seulement +5. Mauvais choix pour tenir un mur.']
  },
  piquier: {
    headline: "Un mur, pas une lame : à poster en défense.",
    lines: ['En défense : +25 de défense sur ta porte.', "À l'assaut : seulement +5."]
  },
  chevalier: {
    headline: "L'élite : aussi bon pour frapper que pour tenir.",
    lines: ["À l'assaut : +30 de force.", 'En défense : +30 de défense.']
  },
  baliste: {
    headline: "La grosse artillerie d'assaut, fragile au rempart.",
    lines: ["À l'assaut : +45 de force.", 'En défense : +10 seulement.']
  },
  belier: {
    headline: "Il enfonce les portes… et s'arrête là.",
    lines: [
      "À l'assaut : +60 de force, mais UNIQUEMENT sur une porte encore debout.",
      "Une fois la porte tombée, il ne passe pas la brèche : il ne touche jamais le donjon.",
      'En défense : ne sert à rien (0).'
    ]
  },
  sapeur: {
    headline: 'Il mine les murs : la défense adverse ne compte qu’à moitié contre lui.',
    lines: [
      "À l'assaut : +50 de force, et la défense de la porte visée est divisée par 2 face à lui.",
      'En défense : +5 seulement.'
    ]
  },
  eclaireur: {
    headline: "Il espionne l'ennemi : tu vois où il va frapper.",
    lines: [
      "Tant qu'il est dans ta garnison, ton château affiche en direct la porte où l'ennemi masse son assaut, et quelle part de sa force y part.",
      'Tu peux ainsi renforcer la bonne porte avant minuit.'
    ],
    placement: 'partout',
    where: 'Laisse-le à la caserne : il travaille quand même, sans s’user.'
  },
  infirmier: {
    headline: 'Il relève un joueur blessé chaque nuit.',
    lines: [
      'Un défenseur blessé ne compte qu’à moitié. Chaque nuit, l’Infirmier remet sur pied le blessé le plus ancien.',
      "Utile surtout quand personne ne joue Soigneur dans le clan."
    ],
    placement: 'partout',
    where: 'Laisse-le à la caserne : il soigne quand même, sans s’user.'
  },
  medecin: {
    headline: 'Il répare une unité usée chaque nuit.',
    lines: [
      'Chaque combat use une unité de 25 % (elle disparaît au 4e).',
      'Chaque nuit, le Médecin remet à 100 % l’unité la plus abîmée.'
    ],
    placement: 'partout',
    where: 'Laisse-le à la caserne : il soigne quand même, sans s’user.'
  },
  forgeron: {
    headline: 'Il répare les remparts : +40 PV par nuit sur sa porte.',
    lines: [
      'Chaque nuit, il rend 40 PV à la porte où il est posté (jamais au-delà du maximum).',
      'Une porte tombée ne se répare pas.',
      "Il s'use si sa porte est attaquée, et disparaît si elle tombe."
    ],
    placement: 'defense',
    where: 'Poste-le en « Défense » sur la porte à réparer. À la caserne, il ne fait rien.'
  },
  etendard: {
    headline: 'Il galvanise les unités de sa porte : +10 %.',
    lines: [
      "+10 % d'attaque ou de défense aux UNITÉS postées sur la même porte, dans la même posture (assaut ou défense).",
      "Ne booste pas les joueurs, seulement les unités. Il s'use comme elles."
    ],
    placement: 'porte',
    where: 'Poste-le sur la même porte et la même posture que tes unités. À la caserne, il ne fait rien.'
  }
};

export function unitGuide(key: string): UnitGuide {
  const def = SOLDIER_BY_KEY.get(key);
  const g = GUIDES[key];
  const combat = def?.kind !== 'soutien';
  return {
    headline: g?.headline ?? def?.description ?? '',
    lines: g?.lines ?? [],
    placement: g?.placement ?? 'porte',
    where:
      g?.where ??
      (combat
        ? "Sur une porte : « Assaut » pour frapper la porte ennemie du même nom, « Défense » pour tenir la tienne."
        : 'Sur une porte.')
  };
}

/** Une unité par joueur × 2 — le vrai régulateur de l'économie. */
export const GARRISON_PER_MEMBER = 2;
/**
 * Part maximale des UNITÉS achetées dans la journée sur un même type.
 *
 * ⚠️ Sur le nombre d'unités, jamais sur la dépense. En part de dépense, la
 * règle était mathématiquement intenable : après un Milicien à 50 ⚒️, tout
 * achat plus cher dépassait la moitié du total du jour, et la journée se
 * retrouvait bloquée dès le deuxième recrutement.
 */
export const CATEGORY_CAP = 0.5;

/**
 * Nombre d'unités d'un même type toujours autorisé, quoi qu'il arrive.
 *
 * Sans ce seuil, la règle des 50 % interdirait le deuxième exemplaire d'un
 * type dès qu'on en possède un seul. On peut donc toujours doubler une unité ;
 * c'est à partir de la troisième qu'il faut varier.
 */
export const CATEGORY_FREE_UNITS = 2;
/** Au-delà, l'achat est annulable pendant 12 h par n'importe quel membre. */
export const CANCELLABLE_ABOVE = 150;
export const CANCEL_WINDOW_MS = 12 * 3600_000;
