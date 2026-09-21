import {
  Bell,
  MessageSquare,
  MessageCircle,
  FileText,
  ThumbsUp,
  Heart,
  BadgeCheck,
  Gift,
  ClipboardList,
  GraduationCap,
  AlarmClock,
  UserPlus,
  UserCheck,
  KanbanSquare,
  Swords,
  Trophy,
  Castle,
  HeartHandshake,
  Handshake,
  BookMarked,
  Target,
  ShieldAlert,
  Inbox,
  type LucideIcon
} from 'lucide-react';

/**
 * Apparence des notifications par type.
 *
 * Source unique : la cloche, la page notifications et tout futur écran
 * doivent taper ici. Chaque valeur de l'enum `type` de src/models/Notification.ts
 * doit avoir son entrée, sinon elle retombe sur le style neutre.
 */
/** Regroupement des types pour les bulles de filtre en haut de la cloche */
export type NotificationCategory =
  | 'forum'
  | 'fiche'
  | 'reward'
  | 'evaluation'
  | 'kanban'
  | 'friends'
  | 'challenge'
  | 'clan'
  | 'suivi'
  | 'other';

export interface NotificationStyle {
  icon: LucideIcon;
  /** Libellé court affiché en surtitre (catégorie) */
  label: string;
  /** Classes du pastillage : fond + couleur d'icône */
  className: string;
  category: NotificationCategory;
}

const DEFAULT_STYLE: NotificationStyle = {
  icon: Bell,
  label: 'Notification',
  className: 'bg-gray-100 text-gray-500',
  category: 'other'
};

/**
 * Métadonnées des bulles de filtre. L'ordre du tableau est l'ordre d'affichage.
 * Les bulles vides ne sont pas rendues (voir NotificationBell).
 */
export const NOTIFICATION_CATEGORIES: Array<{
  id: NotificationCategory;
  label: string;
  icon: LucideIcon;
  /** Classes de la bulle quand elle est sélectionnée */
  activeClassName: string;
}> = [
  { id: 'forum', label: 'Forum', icon: MessageSquare, activeClassName: 'bg-blue-600 text-white border-blue-600' },
  { id: 'fiche', label: 'Fiches', icon: FileText, activeClassName: 'bg-indigo-600 text-white border-indigo-600' },
  { id: 'reward', label: 'Récompenses', icon: Gift, activeClassName: 'bg-amber-500 text-white border-amber-500' },
  { id: 'friends', label: 'Amis', icon: UserPlus, activeClassName: 'bg-fuchsia-600 text-white border-fuchsia-600' },
  { id: 'challenge', label: 'Défis', icon: Swords, activeClassName: 'bg-red-600 text-white border-red-600' },
  { id: 'clan', label: 'Clan', icon: Castle, activeClassName: 'bg-orange-600 text-white border-orange-600' },
  { id: 'suivi', label: 'Suivi', icon: HeartHandshake, activeClassName: 'bg-rose-600 text-white border-rose-600' },
  { id: 'evaluation', label: 'Évaluations', icon: ClipboardList, activeClassName: 'bg-violet-600 text-white border-violet-600' },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare, activeClassName: 'bg-cyan-600 text-white border-cyan-600' },
  { id: 'other', label: 'Autres', icon: Bell, activeClassName: 'bg-gray-600 text-white border-gray-600' }
];

const STYLES: Record<string, NotificationStyle> = {
  // Forum
  forum_answer: {
    icon: MessageSquare,
    label: 'Forum',
    className: 'bg-blue-100 text-blue-600',
    category: 'forum'
  },
  answer_liked: {
    icon: ThumbsUp,
    label: 'Forum',
    className: 'bg-sky-100 text-sky-600',
    category: 'forum'
  },
  answer_validated: {
    icon: BadgeCheck,
    label: 'Réponse validée',
    className: 'bg-emerald-100 text-emerald-600',
    category: 'forum'
  },

  // Fiches de révision
  fiche_comment: {
    icon: FileText,
    label: 'Fiche',
    className: 'bg-indigo-100 text-indigo-600',
    category: 'fiche'
  },
  comment_liked: {
    icon: Heart,
    label: 'Fiche',
    className: 'bg-rose-100 text-rose-600',
    category: 'fiche'
  },

  // Gamification
  quest_completed: {
    icon: Gift,
    label: 'Récompense',
    className: 'bg-amber-100 text-amber-600',
    category: 'reward'
  },

  // Évaluations
  evaluation_submitted: {
    icon: ClipboardList,
    label: 'Évaluation',
    className: 'bg-violet-100 text-violet-600',
    category: 'evaluation'
  },
  evaluation_graded: {
    icon: GraduationCap,
    label: 'Évaluation',
    className: 'bg-purple-100 text-purple-600',
    category: 'evaluation'
  },
  evaluation_timeout: {
    icon: AlarmClock,
    label: 'Évaluation expirée',
    className: 'bg-orange-100 text-orange-600',
    category: 'evaluation'
  },

  // Kanban
  kanban_assigned: {
    icon: KanbanSquare,
    label: 'Kanban',
    className: 'bg-cyan-100 text-cyan-600',
    category: 'kanban'
  },
  kanban_comment: {
    icon: MessageCircle,
    label: 'Kanban',
    className: 'bg-teal-100 text-teal-600',
    category: 'kanban'
  },

  // Amis
  friend_request: {
    icon: UserPlus,
    label: 'Demande d\'ami',
    className: 'bg-fuchsia-100 text-fuchsia-600',
    category: 'friends'
  },
  friend_accepted: {
    icon: UserCheck,
    label: 'Nouvel ami',
    className: 'bg-green-100 text-green-600',
    category: 'friends'
  },

  // Défis
  challenge_received: {
    icon: Swords,
    label: 'Défi reçu',
    className: 'bg-red-100 text-red-600',
    category: 'challenge'
  },
  challenge_result: {
    icon: Trophy,
    label: 'Résultat du duel',
    className: 'bg-yellow-100 text-yellow-700',
    category: 'challenge'
  },

  // Guerre des Clans
  clan_result: {
    icon: Castle,
    label: 'Guerre des Clans',
    className: 'bg-orange-100 text-orange-600',
    category: 'clan'
  },

  // Suivi personnalisé
  mentorship_request: {
    icon: Inbox,
    label: 'Demande de suivi',
    className: 'bg-rose-100 text-rose-600',
    category: 'suivi'
  },
  mentorship_matched: {
    icon: Handshake,
    label: 'Suivi',
    className: 'bg-rose-100 text-rose-600',
    category: 'suivi'
  },
  mentorship_message: {
    icon: MessageCircle,
    label: 'Suivi',
    className: 'bg-rose-100 text-rose-600',
    category: 'suivi'
  },
  mentorship_resource: {
    icon: BookMarked,
    label: 'Ressource à faire',
    className: 'bg-amber-100 text-amber-700',
    category: 'suivi'
  },
  mentorship_checkin: {
    icon: Target,
    label: 'Point d’étape',
    className: 'bg-emerald-100 text-emerald-600',
    category: 'suivi'
  },
  mentorship_update: {
    icon: HeartHandshake,
    label: 'Suivi',
    className: 'bg-rose-100 text-rose-600',
    category: 'suivi'
  },
  mentorship_alert: {
    icon: ShieldAlert,
    label: 'Modération suivi',
    className: 'bg-red-100 text-red-600',
    category: 'suivi'
  }
};

export function getNotificationStyle(type: string): NotificationStyle {
  return STYLES[type] ?? DEFAULT_STYLE;
}

/**
 * Destination d'une notification quand on clique dessus.
 *
 * ⚠️ L'id stocké dans `relatedEntity` dépend du type — voir notificationService :
 *  - question / answer  → id de la QUESTION (route /forum/[id])
 *  - fiche              → id de la révision (route /fiches/[id])
 *  - evaluation         → id de la soumission (route /evaluation/result/[id])
 *  - kanban_card        → le tableau n'a pas de route par carte : on ouvre le board
 *  - quest              → pas de route par quête : on ouvre la page récompenses
 *
 * @returns le chemin, ou null si la notification n'est pas cliquable
 */
export function getNotificationLink(
  relatedEntity?: { type?: string; id?: string } | null
): string | null {
  if (!relatedEntity?.type || !relatedEntity?.id) return null;

  switch (relatedEntity.type) {
    case 'question':
    case 'answer':
    case 'comment':
      return `/forum/${relatedEntity.id}`;
    case 'fiche':
      return `/fiches/${relatedEntity.id}`;
    case 'evaluation':
      return `/evaluation/result/${relatedEntity.id}`;
    case 'kanban_card':
      return '/dashboard/kanban';
    case 'quest':
      return '/recompenses';
    case 'user':
      return '/amis';
    case 'challenge':
      return `/defis/${relatedEntity.id}`;
    case 'clan':
      return '/clan';
    case 'mentorship':
      return `/suivi/${relatedEntity.id}`;
    default:
      return null;
  }
}
