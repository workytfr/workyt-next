/**
 * Catalogue des messages du tchat de clan — DONNÉES PURES.
 *
 * ⚠️ Même règle que clanSoldierCatalog : ce fichier ne doit JAMAIS importer
 * mongoose, un modèle ou dbConnect. Il est lu par le composant client autant
 * que par la validation serveur, et les deux DOIVENT rendre le même texte.
 *
 * Pourquoi pas de texte libre ?
 * ---------------------------------------------------------------------------
 * Le tchat est effacé chaque nuit : il n'y a donc aucun historique à modérer
 * après coup, et le public de Workyt est majoritairement mineur. Un champ de
 * saisie libre y serait un angle mort permanent — impossible à relire, à
 * signaler utilement ou à sanctionner.
 *
 * La réponse n'est pas de filtrer, c'est de retirer la surface : un joueur ne
 * rédige rien. Il choisit une phrase du catalogue et remplit ses emplacements
 * avec des valeurs FERMÉES — un membre de son clan, une porte, une unité, un
 * rôle. Aucun caractère saisi par un humain n'atteint jamais la base.
 *
 * Conséquence à assumer : on ne peut dire que ce que le catalogue prévoit.
 * C'est le prix, et il se paie en enrichissant cette liste — pas en rouvrant
 * la saisie.
 */

import type { GateName } from '@/models/Clan';

/** Nature d'un emplacement à remplir. Toutes les valeurs sont fermées. */
export type SlotKind = 'member' | 'gate' | 'soldier' | 'role';

export interface ChatTemplateDef {
  key: string;
  /** Regroupement dans le compositeur */
  category: 'tactique' | 'demande' | 'etat' | 'social';
  /**
   * Phrase à trous. Les jetons sont {member}, {gate}, {soldier}, {role} —
   * ils doivent correspondre exactement à `slots`.
   */
  pattern: string;
  /** Emplacements à remplir, dans l'ordre où le compositeur les demande */
  slots: SlotKind[];
  /** Libellé court dans la liste de choix */
  label: string;
}

export const GATE_VALUES: GateName[] = ['nord', 'est', 'sud'];
export const ROLE_VALUES = ['attaquant', 'defenseur', 'soigneur'] as const;

/**
 * Les phrases disponibles.
 *
 * Deux principes de rédaction, à respecter pour toute nouvelle entrée :
 *   1. Aucune formulation ne doit pouvoir servir d'insulte ou de pression,
 *      même détournée. « Peux-tu » et jamais « tu dois ».
 *   2. Rien de négatif à propos d'un joueur nommé. On peut féliciter ou
 *      remercier quelqu'un ; on ne peut pas le désigner comme responsable.
 *      C'est ce qui empêche le tchat de devenir un outil de harcèlement ciblé
 *      alors même qu'aucun mot n'est saisi.
 */
export const CHAT_TEMPLATES: ChatTemplateDef[] = [
  // ------------------------------------------------------------- tactique
  {
    key: 'ask_attack',
    category: 'tactique',
    label: 'Demander une attaque',
    pattern: '{member}, peux-tu attaquer la porte {gate} ?',
    slots: ['member', 'gate']
  },
  {
    key: 'ask_defend',
    category: 'tactique',
    label: 'Demander une défense',
    pattern: '{member}, peux-tu défendre la porte {gate} ?',
    slots: ['member', 'gate']
  },
  {
    key: 'ask_role',
    category: 'tactique',
    label: 'Proposer un rôle',
    pattern: '{member}, peux-tu passer {role} aujourd’hui ?',
    slots: ['member', 'role']
  },
  {
    key: 'focus_all',
    category: 'tactique',
    label: 'Proposer de tout concentrer',
    pattern: 'On concentre tout sur la porte {gate} ?',
    slots: ['gate']
  },
  {
    key: 'enemy_massing',
    category: 'tactique',
    label: "Signaler l'assaut ennemi",
    pattern: 'L’ennemi masse son assaut sur notre porte {gate}.',
    slots: ['gate']
  },
  {
    key: 'gate_critical',
    category: 'tactique',
    label: 'Alerter sur une porte',
    pattern: 'Notre porte {gate} est en mauvais état, il faut la tenir.',
    slots: ['gate']
  },
  {
    key: 'breach_keep',
    category: 'tactique',
    label: 'Viser le donjon',
    pattern: 'Leur porte {gate} est tombée : en la visant, on frappe le donjon.',
    slots: ['gate']
  },

  // -------------------------------------------------------- demandes au capitaine
  {
    key: 'ask_order',
    category: 'demande',
    label: 'Demander un ordre du jour',
    pattern: 'Capitaine, peux-tu donner l’ordre du jour sur la porte {gate} ?',
    slots: ['gate']
  },
  {
    key: 'ask_recruit',
    category: 'demande',
    label: 'Demander un recrutement',
    pattern: 'Capitaine, peux-tu recruter un {soldier} ?',
    slots: ['soldier']
  },
  {
    key: 'ask_deploy',
    category: 'demande',
    label: 'Demander un déploiement',
    pattern: 'Capitaine, peux-tu déployer le {soldier} sur la porte {gate} ?',
    slots: ['soldier', 'gate']
  },

  // ------------------------------------------------------------- mon état
  {
    key: 'im_attacking',
    category: 'etat',
    label: 'Annoncer ma cible',
    pattern: 'Je vise la porte {gate}.',
    slots: ['gate']
  },
  {
    key: 'im_holding',
    category: 'etat',
    label: 'Annoncer ma porte',
    pattern: 'Je tiens la porte {gate}.',
    slots: ['gate']
  },
  {
    key: 'im_switching',
    category: 'etat',
    label: 'Annoncer mon rôle',
    pattern: 'Je passe {role}.',
    slots: ['role']
  },
  {
    key: 'im_wounded',
    category: 'etat',
    label: 'Signaler ma blessure',
    pattern: 'Je suis blessé, un soigneur peut-il m’aider ?',
    slots: []
  },
  {
    key: 'im_done',
    category: 'etat',
    label: 'Annoncer que j’ai fini',
    pattern: 'J’ai marqué mes points pour aujourd’hui.',
    slots: []
  },
  {
    key: 'im_away',
    category: 'etat',
    label: 'Prévenir de mon absence',
    pattern: 'Je ne pourrai pas jouer aujourd’hui, désolé.',
    slots: []
  },

  // --------------------------------------------------------------- social
  {
    key: 'congrats_member',
    category: 'social',
    label: 'Féliciter quelqu’un',
    pattern: 'Bravo {member}, beau travail !',
    slots: ['member']
  },
  {
    key: 'thanks_member',
    category: 'social',
    label: 'Remercier quelqu’un',
    pattern: 'Merci {member} !',
    slots: ['member']
  },
  {
    key: 'welcome_member',
    category: 'social',
    label: 'Souhaiter la bienvenue',
    pattern: 'Bienvenue {member}, content de t’avoir avec nous !',
    slots: ['member']
  },
  {
    key: 'congrats_all',
    category: 'social',
    label: 'Féliciter le clan',
    pattern: 'Bien joué à tous pour cette journée !',
    slots: []
  },
  {
    key: 'good_luck',
    category: 'social',
    label: 'Encourager',
    pattern: 'Bon courage à tous aujourd’hui !',
    slots: []
  },
  {
    key: 'nice_try',
    category: 'social',
    label: 'Remonter le moral',
    pattern: 'On a perdu la journée, mais rien n’est joué. On s’accroche !',
    slots: []
  },
  {
    key: 'hello',
    category: 'social',
    label: 'Dire bonjour',
    pattern: 'Salut tout le monde !',
    slots: []
  }
];

export const TEMPLATE_BY_KEY = new Map(CHAT_TEMPLATES.map((t) => [t.key, t]));

export const CATEGORY_LABEL: Record<ChatTemplateDef['category'], string> = {
  tactique: 'Tactique',
  demande: 'Demandes au capitaine',
  etat: 'Mon état',
  social: 'Encouragements'
};

export const ROLE_LABEL_CHAT: Record<string, string> = {
  attaquant: 'attaquant',
  defenseur: 'défenseur',
  soigneur: 'soigneur'
};

/** Valeurs effectivement retenues pour les emplacements d'un message. */
export interface ChatSlots {
  /** Identifiant du membre visé — doit appartenir au même clan */
  memberId?: string | null;
  /** Pseudo figé à l'écriture, pour un rendu sans jointure */
  memberName?: string | null;
  gate?: string | null;
  /** Clé du catalogue d'unités */
  soldier?: string | null;
  /** Nom lisible de l'unité, figé à l'écriture */
  soldierName?: string | null;
  role?: string | null;
}

/**
 * Rend la phrase finale.
 *
 * Utilisé par le serveur ET par le client. Un emplacement non renseigné
 * n'est jamais remplacé par du vide silencieux : on laisse une marque
 * visible, parce qu'un message tronqué doit se voir plutôt que se lire de
 * travers.
 */
export function renderChatMessage(templateKey: string, slots: ChatSlots): string {
  const def = TEMPLATE_BY_KEY.get(templateKey);
  if (!def) return 'Message indisponible';

  return def.pattern.replace(/\{(member|gate|soldier|role)\}/g, (_, kind: SlotKind) => {
    switch (kind) {
      case 'member':
        return slots.memberName ? `@${slots.memberName}` : '@?';
      case 'gate':
        return slots.gate ?? '?';
      case 'soldier':
        return slots.soldierName ?? '?';
      case 'role':
        return ROLE_LABEL_CHAT[slots.role ?? ''] ?? '?';
      default:
        return '?';
    }
  });
}
