/**
 * Vacances scolaires françaises — utilisées pour neutraliser le malus
 * d'inactivité du RPG. Sans ça, tous les élèves perdraient un niveau à chaque
 * période de vacances, ce qui punirait exactement le comportement normal.
 *
 * Les dates exactes varient selon la zone (A / B / C) et selon l'année. On
 * retient volontairement **l'union la plus large** des trois zones : mieux vaut
 * ne pas sanctionner un élève qui aurait dû l'être que l'inverse.
 *
 * Ranges récurrents (jour/mois), donc aucune maintenance annuelle.
 * À ajuster ici si le calendrier officiel bouge durablement.
 */

interface HolidayRange {
  name: string;
  from: { month: number; day: number }; // month: 1-12
  to: { month: number; day: number };
}

const HOLIDAY_RANGES: HolidayRange[] = [
  { name: 'Toussaint', from: { month: 10, day: 18 }, to: { month: 11, day: 4 } },
  { name: 'Noël', from: { month: 12, day: 19 }, to: { month: 1, day: 4 } }, // chevauche l'année
  { name: 'Hiver', from: { month: 2, day: 7 }, to: { month: 3, day: 9 } },
  { name: 'Printemps', from: { month: 4, day: 4 }, to: { month: 5, day: 11 } },
  { name: 'Été', from: { month: 7, day: 4 }, to: { month: 8, day: 31 } }
];

/** Numéro de jour dans l'année, indépendant de l'année (1er janvier = 101). */
function dayCode(month: number, day: number): number {
  return month * 100 + day;
}

/**
 * Vrai si la date tombe pendant des vacances scolaires (union des zones A/B/C).
 */
export function isSchoolHoliday(date: Date): boolean {
  const code = dayCode(date.getMonth() + 1, date.getDate());

  return HOLIDAY_RANGES.some(({ from, to }) => {
    const start = dayCode(from.month, from.day);
    const end = dayCode(to.month, to.day);
    // Période qui chevauche le 31/12 (Noël) : on teste les deux morceaux
    return start <= end ? code >= start && code <= end : code >= start || code <= end;
  });
}

/**
 * Nombre de jours **scolaires** (hors vacances) strictement entre deux dates.
 * C'est cette valeur qui alimente le malus d'inactivité.
 *
 * @param from dernière activité connue
 * @param to   maintenant
 * @param cap  plafond de sécurité (un retour après 6 mois ne doit pas anéantir le héros)
 */
export function countSchoolDaysBetween(from: Date, to: Date, cap = 14): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1); // on ne compte pas le jour de la dernière activité

  // Borne dure sur l'itération : au-delà de 400 jours on sort, le cap suffit
  let guard = 0;
  while (cursor < end && count < cap && guard < 400) {
    if (!isSchoolHoliday(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  return count;
}
