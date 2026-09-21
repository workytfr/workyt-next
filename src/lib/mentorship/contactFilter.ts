/**
 * Détection des coordonnées personnelles dans un message de suivi.
 *
 * Règle du dispositif : aucun contact hors de la plateforme entre un bénévole
 * et un élève. Un message qui contient un numéro, un e-mail, un pseudo de
 * réseau social ou un lien externe n'est pas distribué ; il est conservé pour
 * la modération (voir MentorshipMessage) et la modération est alertée.
 *
 * Le filtre préfère les faux positifs aux faux négatifs : un élève qui écrit
 * « 06 12 34 56 78 » par erreur de calcul est prévenu et reformule, c'est un
 * moindre mal. Il ne prétend pas être infaillible — c'est un garde-fou parmi
 * d'autres (conservation intégrale, signalement, charte).
 */

export interface ContactCheck {
  blocked: boolean;
  reasons: string[];
}

// 06 12 34 56 78, 06.12.34.56.78, +33 6 12 34 56 78, 0612345678, 0033612345678.
// Un décimal (« 0,612345678 », « 3.14159265 ») ne correspond pas : après le 0
// initial, le motif exige un chiffre, pas une virgule ni un point.
const PHONE_FR = /(?:(?:\+|00)\s?33[\s.-]?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/;
// Numéro international : un indicatif « +xx » suivi d'au moins 8 chiffres.
// Volontairement PAS de règle « N chiffres d'affilée » : en soutien de maths,
// elle bloquerait les calculs et les décimales.
const PHONE_INTL = /\+\d{1,3}(?:[\s.-]?\d){8,}/;
const EMAIL = /[a-z0-9._%+-]+\s?(?:@|\(at\)|\[at\]|arobase)\s?[a-z0-9.-]+\s?(?:\.|\(dot\)|point)\s?[a-z]{2,}/i;
// Pas de « signal », « zoom » ni « teams » : ce sont aussi des mots de cours
// (physique, géométrie, anglais) et ils bloqueraient des messages légitimes.
const SOCIAL = /\b(?:snap(?:chat)?|insta(?:gram)?|discord|whats\s?app|telegram|tiktok|facebook|messenger|kik|wechat|twitter|x\.com|linkedin|twitch|skype|meet\.google|t\.me|wa\.me)\b/i;
// @pseudo en début de mot, hors mentions d'e-mail déjà traitées
const HANDLE = /(?:^|\s)@[a-z0-9._]{3,}/i;
// Liens externes (les liens vers workyt.fr sont autorisés : c'est le but du suivi)
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s]+/gi;

function hasExternalLink(text: string): boolean {
  const links = text.match(URL_RE) || [];
  return links.some((raw) => {
    const href = raw.startsWith('www.') ? `https://${raw}` : raw;
    try {
      const host = new URL(href).hostname.toLowerCase();
      return !(host === 'workyt.fr' || host.endsWith('.workyt.fr'));
    } catch {
      return true;
    }
  });
}

export function checkForContactDetails(text: string): ContactCheck {
  const reasons: string[] = [];
  if (!text) return { blocked: false, reasons };

  // Les liens workyt.fr contiennent des ids hexadécimaux : on les retire avant
  // la recherche de numéros pour ne pas bloquer un lien de cours légitime.
  const withoutWorkytLinks = text.replace(URL_RE, (m) =>
    /workyt\.fr/i.test(m) ? ' ' : m
  );

  if (PHONE_FR.test(withoutWorkytLinks) || PHONE_INTL.test(withoutWorkytLinks)) {
    reasons.push('numéro de téléphone');
  }
  if (EMAIL.test(withoutWorkytLinks)) reasons.push('adresse e-mail');
  if (SOCIAL.test(withoutWorkytLinks)) reasons.push('réseau social ou messagerie');
  if (HANDLE.test(withoutWorkytLinks)) reasons.push('pseudo');
  if (hasExternalLink(text)) reasons.push('lien externe');

  return { blocked: reasons.length > 0, reasons };
}
