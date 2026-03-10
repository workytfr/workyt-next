import { IBadge } from '../models/Badge';

const badges: Partial<IBadge>[] = [
  // ═══════════════════════════════════════
  // FORUM – Reponses deposees
  // ═══════════════════════════════════════
  {
    slug: 'forum_answer_1',
    name: 'Repondeur niveau 1',
    description: 'A poste 1 reponse sur le forum.',
    icon: '/badge/forum_answer_1.svg',
    category: 'engagement',
    condition: { type: 'forum_answer', value: 1 },
    rarity: 'commun',
  },
  {
    slug: 'forum_answer_2',
    name: 'Repondeur niveau 2',
    description: 'A poste 10 reponses sur le forum.',
    icon: '/badge/forum_answer_2.svg',
    category: 'engagement',
    condition: { type: 'forum_answer', value: 10 },
    rarity: 'commun',
  },
  {
    slug: 'forum_answer_3',
    name: 'Repondeur niveau 3',
    description: 'A poste 50 reponses sur le forum.',
    icon: '/badge/forum_answer_3.svg',
    category: 'engagement',
    condition: { type: 'forum_answer', value: 50 },
    rarity: 'rare',
  },
  {
    slug: 'forum_answer_4',
    name: 'Repondeur niveau 4',
    description: 'A poste 200 reponses sur le forum.',
    icon: '/badge/forum_answer_4.svg',
    category: 'engagement',
    condition: { type: 'forum_answer', value: 200 },
    rarity: 'épique',
  },
  {
    slug: 'forum_answer_5',
    name: 'Repondeur niveau 5',
    description: 'A poste 500 reponses sur le forum.',
    icon: '/badge/forum_answer_5.svg',
    category: 'engagement',
    condition: { type: 'forum_answer', value: 500 },
    rarity: 'légendaire',
  },

  // ═══════════════════════════════════════
  // FORUM – Reponses validees
  // ═══════════════════════════════════════
  {
    slug: 'forum_validated_1',
    name: 'Expert niveau 1',
    description: 'A eu 1 reponse validee.',
    icon: '/badge/forum_validated_1.svg',
    category: 'performance',
    condition: { type: 'forum_validated', value: 1 },
    rarity: 'commun',
  },
  {
    slug: 'forum_validated_2',
    name: 'Expert niveau 2',
    description: 'A eu 5 reponses validees.',
    icon: '/badge/forum_validated_2.svg',
    category: 'performance',
    condition: { type: 'forum_validated', value: 5 },
    rarity: 'rare',
  },
  {
    slug: 'forum_validated_3',
    name: 'Expert niveau 3',
    description: 'A eu 20 reponses validees.',
    icon: '/badge/forum_validated_3.svg',
    category: 'performance',
    condition: { type: 'forum_validated', value: 20 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // COURS – Termines
  // ═══════════════════════════════════════
  {
    slug: 'course_completed_1',
    name: 'Etudiant assidu 1',
    description: 'A termine 1 cours.',
    icon: '/badge/course_completed_1.svg',
    category: 'progression',
    condition: { type: 'course_completed', value: 1 },
    rarity: 'commun',
  },
  {
    slug: 'course_completed_2',
    name: 'Etudiant assidu 2',
    description: 'A termine 5 cours.',
    icon: '/badge/course_completed_2.svg',
    category: 'progression',
    condition: { type: 'course_completed', value: 5 },
    rarity: 'rare',
  },
  {
    slug: 'course_completed_3',
    name: 'Etudiant assidu 3',
    description: 'A termine 20 cours.',
    icon: '/badge/course_completed_3.svg',
    category: 'progression',
    condition: { type: 'course_completed', value: 20 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // QUIZ – Reussis
  // ═══════════════════════════════════════
  {
    slug: 'quiz_success_1',
    name: 'Quiz Master 1',
    description: 'A reussi 1 quiz.',
    icon: '/badge/quiz_success_1.svg',
    category: 'performance',
    condition: { type: 'quiz_success', value: 1 },
    rarity: 'commun',
  },
  {
    slug: 'quiz_success_2',
    name: 'Quiz Master 2',
    description: 'A reussi 10 quiz.',
    icon: '/badge/quiz_success_2.svg',
    category: 'performance',
    condition: { type: 'quiz_success', value: 10 },
    rarity: 'rare',
  },
  {
    slug: 'quiz_success_3',
    name: 'Quiz Master 3',
    description: 'A reussi 50 quiz.',
    icon: '/badge/quiz_success_3.svg',
    category: 'performance',
    condition: { type: 'quiz_success', value: 50 },
    rarity: 'épique',
  },
  {
    slug: 'quiz_perfect_1',
    name: 'Perfectionniste',
    description: 'A obtenu un score parfait (100%) sur un quiz.',
    icon: '/badge/quiz_perfect_1.svg',
    category: 'performance',
    condition: { type: 'quiz_perfect', value: 1 },
    rarity: 'rare',
  },
  {
    slug: 'quiz_perfect_2',
    name: 'Sans faute',
    description: 'A obtenu 10 scores parfaits sur des quiz.',
    icon: '/badge/quiz_perfect_2.svg',
    category: 'performance',
    condition: { type: 'quiz_perfect', value: 10 },
    rarity: 'épique',
  },
  {
    slug: 'quiz_perfect_3',
    name: 'Infaillible',
    description: 'A obtenu 50 scores parfaits sur des quiz.',
    icon: '/badge/quiz_perfect_3.svg',
    category: 'performance',
    condition: { type: 'quiz_perfect', value: 50 },
    rarity: 'légendaire',
  },

  // ═══════════════════════════════════════
  // FICHES – Creees
  // ═══════════════════════════════════════
  {
    slug: 'fiche_created_1',
    name: 'Auteur niveau 1',
    description: 'A cree 1 fiche.',
    icon: '/badge/fiche_created_1.svg',
    category: 'engagement',
    condition: { type: 'fiche_created', value: 1 },
    rarity: 'commun',
  },
  {
    slug: 'fiche_created_2',
    name: 'Auteur niveau 2',
    description: 'A cree 5 fiches.',
    icon: '/badge/fiche_created_2.svg',
    category: 'engagement',
    condition: { type: 'fiche_created', value: 5 },
    rarity: 'rare',
  },
  {
    slug: 'fiche_created_3',
    name: 'Auteur niveau 3',
    description: 'A cree 20 fiches.',
    icon: '/badge/fiche_created_3.svg',
    category: 'engagement',
    condition: { type: 'fiche_created', value: 20 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // FICHES – Likes recus
  // ═══════════════════════════════════════
  {
    slug: 'fiche_liked_1',
    name: 'Apprecie',
    description: 'A recu 10 likes sur ses fiches.',
    icon: '/badge/fiche_liked_1.svg',
    category: 'engagement',
    condition: { type: 'fiche_liked', value: 10 },
    rarity: 'commun',
  },
  {
    slug: 'fiche_liked_2',
    name: 'Populaire',
    description: 'A recu 50 likes sur ses fiches.',
    icon: '/badge/fiche_liked_2.svg',
    category: 'engagement',
    condition: { type: 'fiche_liked', value: 50 },
    rarity: 'rare',
  },
  {
    slug: 'fiche_liked_3',
    name: 'Star des fiches',
    description: 'A recu 200 likes sur ses fiches.',
    icon: '/badge/fiche_liked_3.svg',
    category: 'engagement',
    condition: { type: 'fiche_liked', value: 200 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // FICHES – Mises en favoris
  // ═══════════════════════════════════════
  {
    slug: 'fiche_bookmarked_1',
    name: 'Reference',
    description: 'Ses fiches ont ete mises en favoris 10 fois.',
    icon: '/badge/fiche_bookmarked_1.svg',
    category: 'engagement',
    condition: { type: 'fiche_bookmarked', value: 10 },
    rarity: 'rare',
  },
  {
    slug: 'fiche_bookmarked_2',
    name: 'Incontournable',
    description: 'Ses fiches ont ete mises en favoris 50 fois.',
    icon: '/badge/fiche_bookmarked_2.svg',
    category: 'engagement',
    condition: { type: 'fiche_bookmarked', value: 50 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // FICHES – Diversite
  // ═══════════════════════════════════════
  {
    slug: 'fiche_diverse_1',
    name: 'Polyvalent',
    description: 'A cree des fiches dans 5 matieres differentes.',
    icon: '/badge/fiche_diverse_1.svg',
    category: 'engagement',
    condition: { type: 'fiche_diverse', value: 5 },
    rarity: 'rare',
  },

  // ═══════════════════════════════════════
  // STREAK – Flamme consecutive
  // ═══════════════════════════════════════
  {
    slug: 'streak_3',
    name: 'Flamme naissante',
    description: 'A maintenu un streak de 3 jours.',
    icon: '/badge/streak_3.svg',
    category: 'progression',
    condition: { type: 'streak', value: 3 },
    rarity: 'commun',
  },
  {
    slug: 'streak_7',
    name: 'Flamme stable',
    description: 'A maintenu un streak de 7 jours.',
    icon: '/badge/streak_7.svg',
    category: 'progression',
    condition: { type: 'streak', value: 7 },
    rarity: 'commun',
  },
  {
    slug: 'streak_14',
    name: 'Flamme ardente',
    description: 'A maintenu un streak de 14 jours.',
    icon: '/badge/streak_14.svg',
    category: 'progression',
    condition: { type: 'streak', value: 14 },
    rarity: 'rare',
  },
  {
    slug: 'streak_30',
    name: 'Flamme infernale',
    description: 'A maintenu un streak de 30 jours.',
    icon: '/badge/streak_30.svg',
    category: 'progression',
    condition: { type: 'streak', value: 30 },
    rarity: 'rare',
  },
  {
    slug: 'flamme_eternelle',
    name: 'Flamme eternelle',
    description: 'A maintenu un streak de 60 jours.',
    icon: '/badge/flamme_eternelle.svg',
    category: 'progression',
    condition: { type: 'streak', value: 60 },
    rarity: 'épique',
  },
  {
    slug: 'flamme_legendaire',
    name: 'Flamme legendaire',
    description: 'A maintenu un streak de 100 jours.',
    icon: '/badge/flamme_legendaire.svg',
    category: 'progression',
    condition: { type: 'streak', value: 100 },
    rarity: 'légendaire',
  },

  // ═══════════════════════════════════════
  // POINTS – Paliers de monde
  // ═══════════════════════════════════════
  {
    slug: 'points_150',
    name: 'Sensei',
    description: 'A atteint le Monde des Mangas (150 pts).',
    icon: '/badge/points_150.svg',
    category: 'progression',
    condition: { type: 'points', value: 150 },
    rarity: 'commun',
  },
  {
    slug: 'points_500',
    name: 'Etudiant',
    description: 'A atteint le Monde Francais (500 pts).',
    icon: '/badge/points_500.svg',
    category: 'progression',
    condition: { type: 'points', value: 500 },
    rarity: 'commun',
  },
  {
    slug: 'points_1200',
    name: 'Renardeau',
    description: 'A atteint le Monde des Renards et Fees (1 200 pts).',
    icon: '/badge/points_1200.svg',
    category: 'progression',
    condition: { type: 'points', value: 1200 },
    rarity: 'rare',
  },
  {
    slug: 'points_2500',
    name: 'Hockeyeur',
    description: 'A atteint le Monde Quebecois (2 500 pts).',
    icon: '/badge/points_2500.svg',
    category: 'progression',
    condition: { type: 'points', value: 2500 },
    rarity: 'rare',
  },
  {
    slug: 'points_4000',
    name: 'Sphinx',
    description: 'A atteint le Monde Egyptien (4 000 pts).',
    icon: '/badge/points_4000.svg',
    category: 'progression',
    condition: { type: 'points', value: 4000 },
    rarity: 'épique',
  },
  {
    slug: 'points_5500',
    name: 'Nomade',
    description: 'A atteint le Monde des Neiges et des Sables (5 500 pts).',
    icon: '/badge/points_5500.svg',
    category: 'progression',
    condition: { type: 'points', value: 5500 },
    rarity: 'épique',
  },
  {
    slug: 'points_7000',
    name: 'Immortel',
    description: 'A atteint le Monde de l\'Imaginaire (7 000 pts).',
    icon: '/badge/points_7000.svg',
    category: 'progression',
    condition: { type: 'points', value: 7000 },
    rarity: 'légendaire',
  },

  // ═══════════════════════════════════════
  // CHAMPIGNONS – Boosts
  // ═══════════════════════════════════════
  {
    slug: 'mushroom_first',
    name: 'Premier boost',
    description: 'A utilise son premier champignon.',
    icon: '/badge/mushroom_first.svg',
    category: 'special',
    condition: { type: 'mushroom_used', value: 1 },
    rarity: 'commun',
  },
  {
    slug: 'mushroom_10',
    name: 'Mycologue',
    description: 'A utilise 10 champignons.',
    icon: '/badge/mushroom_10.svg',
    category: 'special',
    condition: { type: 'mushroom_used', value: 10 },
    rarity: 'rare',
  },
  {
    slug: 'mushroom_50',
    name: 'Champi-addict',
    description: 'A utilise 50 champignons.',
    icon: '/badge/mushroom_50.svg',
    category: 'special',
    condition: { type: 'mushroom_used', value: 50 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // CALENDRIER – Reclamations
  // ═══════════════════════════════════════
  {
    slug: 'calendar_7',
    name: 'Habitue',
    description: 'A reclame 7 recompenses du calendrier.',
    icon: '/badge/calendar_7.svg',
    category: 'progression',
    condition: { type: 'calendar_claims', value: 7 },
    rarity: 'commun',
  },
  {
    slug: 'calendar_30',
    name: 'Assidu',
    description: 'A reclame 30 recompenses du calendrier.',
    icon: '/badge/calendar_30.svg',
    category: 'progression',
    condition: { type: 'calendar_claims', value: 30 },
    rarity: 'rare',
  },
  {
    slug: 'calendar_100',
    name: 'Fidele',
    description: 'A reclame 100 recompenses du calendrier.',
    icon: '/badge/calendar_100.svg',
    category: 'progression',
    condition: { type: 'calendar_claims', value: 100 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // ANCIENNETE
  // ═══════════════════════════════════════
  {
    slug: 'seniority_1',
    name: 'Pionnier',
    description: 'Inscrit depuis 1 an.',
    icon: '/badge/seniority_1.svg',
    category: 'special',
    condition: { type: 'seniority', value: 1 },
    rarity: 'rare',
  },
  {
    slug: 'seniority_2',
    name: 'Loyal',
    description: 'Inscrit depuis 2 ans.',
    icon: '/badge/seniority_2.svg',
    category: 'special',
    condition: { type: 'seniority', value: 2 },
    rarity: 'épique',
  },

  // ═══════════════════════════════════════
  // EVENEMENTS SPECIAUX
  // ═══════════════════════════════════════
  {
    slug: 'halloween_2025',
    name: 'Halloween 2025',
    description: 'A participe a l\'evenement Halloween 2025.',
    icon: '/badge/halloween2025.png',
    category: 'special',
    condition: { type: 'event', value: 1 },
    rarity: 'légendaire',
  },
];

export default badges;
