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
    image: IMG('Eclaireur.png'), effect: 'reveal', description: "Révèle en direct la porte visée par l'ennemi." },
  { key: 'infirmier', name: 'Infirmier', emoji: '⛑️', kind: 'soutien', cost: 100, atk: 0, def: 0,
    image: IMG('infirmier.png'), effect: 'heal_player', description: "Remet 1 joueur blessé d'aplomb chaque jour." },
  { key: 'medecin', name: 'Médecin de camp', emoji: '🩺', kind: 'soutien', cost: 120, atk: 0, def: 0,
    image: IMG('medecin.png'), effect: 'heal_soldier', description: 'Remet 1 unité à 100 % chaque jour.' },
  { key: 'forgeron', name: 'Forgeron', emoji: '🔨', kind: 'soutien', cost: 140, atk: 0, def: 0,
    image: IMG('forgeron.png'), effect: 'repair', description: 'Répare 40 PV sur sa porte chaque jour.' },
  { key: 'etendard', name: 'Porte-étendard', emoji: '🚩', kind: 'soutien', cost: 160, atk: 0, def: 0,
    image: IMG('Porte.png'), effect: 'banner', description: '+10 % à toutes les unités de sa porte.' }
];

export const SOLDIER_BY_KEY = new Map(SOLDIER_CATALOG.map((s) => [s.key, s]));

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
