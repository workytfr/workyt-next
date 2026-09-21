/**
 * Réglages du suivi personnalisé.
 *
 * Tout ce qui dimensionne la charge des bénévoles est ici, en un seul endroit :
 * c'est la vraie contrainte du dispositif (voir le compte rendu « Forum + Suivi »).
 * Ce fichier ne doit rien importer côté serveur : il est aussi lu par le client.
 */

/** Suivis simultanés par bénévole, par défaut (modifiable dans son profil) */
export const DEFAULT_MAX_ACTIVE = 3;
export const MAX_ACTIVE_LIMIT = 10;

/** Demandes ouvertes (en file, en cours ou en pause) par élève */
export const MAX_OPEN_PER_STUDENT = 2;

/**
 * Taille maximale de la file d'attente. Au-delà, on refuse honnêtement les
 * nouvelles demandes plutôt que d'accumuler des élèves à qui personne ne
 * répondra : une demande personnelle ignorée fait plus de mal qu'une question
 * de forum sans réponse.
 */
export const MAX_PENDING_QUEUE = 40;

/** Délai de réponse annoncé à l'élève */
export const ANNOUNCED_DELAY_HOURS = 48;

/** Demande en file depuis plus longtemps → alerte à la modération */
export const ESCALATE_PENDING_HOURS = 48;
/** Demande en file depuis plus longtemps → fermée, l'élève est prévenu */
export const EXPIRE_PENDING_DAYS = 21;

/** L'élève attend une réponse depuis N jours → rappel au bénévole */
export const MENTOR_REMINDER_DAYS = 3;
/** L'élève attend une réponse depuis N jours → relais automatique */
export const MENTOR_TIMEOUT_DAYS = 7;
/** L'élève ne s'est pas manifesté depuis N jours → petit rappel à l'élève */
export const STUDENT_REMINDER_DAYS = 10;

/** Intervalle entre deux points d'étape */
export const CHECKIN_INTERVAL_DAYS = 14;

/** Limites de contenu */
export const MAX_GOALS = 8;
export const MAX_OPEN_ASSIGNMENTS = 20;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Gamification — barème.
 * On récompense ce qui fait fonctionner un suivi (travail rendu, objectifs,
 * régularité du binôme), JAMAIS le volume (messages, nombre d'élèves) ni la
 * demande d'aide elle-même. Les plafonds quotidiens empêchent un binôme
 * complaisant de « farmer » des points en cochant tout.
 */
export const POINTS = {
  assignmentDone: 5,
  assignmentDailyCap: 30,
  goalReached: 10,
  goalDailyCap: 30,
  checkin: 3,
  /** Versé aux DEUX membres du binôme à chaque palier de série */
  duoStreakMilestone: 15
};
export const DUO_STREAK_MILESTONES = [4, 8, 12, 20, 30];

export const FORMAT_LABELS: Record<string, { label: string; hint: string }> = {
  ponctuel: { label: 'Un coup de main', hint: 'Une séance pour débloquer un point précis' },
  suivi: { label: 'Un suivi régulier', hint: 'Plusieurs semaines avec le même bénévole' }
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  comprendre: 'Comprendre un chapitre',
  moyenne: 'Remonter ma moyenne',
  examen: 'Préparer un examen',
  methode: 'Apprendre à m’organiser',
  decrochage: 'Je décroche, j’ai besoin d’aide'
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente d’un bénévole',
  active: 'En cours',
  paused: 'En pause',
  closed: 'Terminé',
  cancelled: 'Annulé'
};

export const OUTCOME_LABELS: Record<string, string> = {
  goal_reached: 'Objectif atteint',
  partial: 'Objectif en partie atteint',
  stopped: 'Arrêté en cours de route',
  no_response: 'Élève sans nouvelles'
};

export const MOOD_LABELS: Record<string, string> = {
  bien: 'Ça avance bien',
  moyen: 'Moyen',
  bloque: 'Je bloque'
};

export const ASSIGNMENT_KIND_LABELS: Record<string, string> = {
  course: 'Cours',
  lesson: 'Leçon',
  exercise: 'Exercice',
  quiz: 'Quiz',
  fiche: 'Fiche',
  evaluation: 'Évaluation'
};

/**
 * Ressources dont la fin est détectée automatiquement à partir des données de
 * progression. Pour les autres (exercice, fiche), l'élève coche lui-même.
 */
export const AUTO_DETECTED_KINDS = ['course', 'lesson', 'quiz', 'evaluation'];

/** Numéros utiles quand un échange sort du champ scolaire */
export const HELP_LINES = [
  { name: '3018', detail: 'Harcèlement et violences numériques (gratuit, anonyme)' },
  { name: '119', detail: 'Enfance en danger (gratuit, 24 h/24)' },
  { name: 'Fil Santé Jeunes — 0 800 235 236', detail: 'Écoute des 12-25 ans (gratuit, anonyme)' }
];
