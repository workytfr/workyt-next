import User from '@/models/User';

/**
 * Suivi de présence « en ligne », sans polling dédié.
 *
 * On se greffe sur une requête que le client fait déjà (le sondage de la
 * cloche de notifications, toutes les 30 s). Une écriture toutes les 30 s par
 * utilisateur serait absurde, donc on throttle en mémoire : au plus une
 * écriture toutes les 5 minutes par personne.
 *
 * Le cache est par instance : avec plusieurs processus, on écrit au pire une
 * fois par instance et par fenêtre. C'est sans conséquence, `lastSeenAt` n'a
 * pas besoin d'être précis à la seconde.
 */

const THROTTLE_MS = 5 * 60 * 1000;
const lastWrite = new Map<string, number>();

// Purge périodique : sans elle, la Map grossit indéfiniment sur un
// serveur de longue durée (une entrée par utilisateur vu).
let lastCleanup = Date.now();
function cleanup(now: number) {
  if (now - lastCleanup < THROTTLE_MS) return;
  lastCleanup = now;
  for (const [key, at] of lastWrite.entries()) {
    if (now - at > THROTTLE_MS * 2) lastWrite.delete(key);
  }
}

/**
 * Marque l'utilisateur comme actif. Ne throw jamais : la présence est
 * accessoire, elle ne doit pas faire échouer la requête porteuse.
 */
export async function touchPresence(userId: string): Promise<void> {
  try {
    const now = Date.now();
    cleanup(now);

    const previous = lastWrite.get(userId);
    if (previous && now - previous < THROTTLE_MS) return;
    lastWrite.set(userId, now);

    // updateOne et non save() : pas de lecture, pas de validation, une écriture
    await User.updateOne({ _id: userId }, { $set: { lastSeenAt: new Date() } });
  } catch (err) {
    console.error('Erreur touchPresence:', err);
  }
}
