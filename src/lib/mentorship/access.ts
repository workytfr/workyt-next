import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import { hasPermission } from '@/lib/roles';
import User from '@/models/User';
import Mentorship, { IMentorship } from '@/models/Mentorship';

export interface SuiviUser {
  id: string;
  username: string;
  role: string;
}

/**
 * Utilisateur courant pour les routes /api/suivi.
 * Le rôle est relu en base, pas dans la session : un bénévole retiré du rôle
 * Helpeur perd l'accès immédiatement, sans attendre l'expiration du jeton.
 */
export async function currentSuiviUser(): Promise<SuiviUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await dbConnect();
  const user = await User.findOne({ email: session.user.email })
    .select('_id username role')
    .lean<{ _id: mongoose.Types.ObjectId; username: string; role: string }>();

  if (!user) return null;
  return { id: user._id.toString(), username: user.username, role: user.role };
}

/** Peut accompagner des élèves (prendre des demandes dans la file) */
export async function canMentor(user: SuiviUser): Promise<boolean> {
  return hasPermission(user.role, 'mentorship.take');
}

/** Peut piloter le dispositif : tout voir, attribuer, modérer */
export async function canManage(user: SuiviUser): Promise<boolean> {
  return hasPermission(user.role, 'mentorship.manage');
}

/**
 * `candidate` : un bénévole qui consulte une demande EN FILE pour décider de la
 * prendre. Il ne voit que la demande (ni messages, ni notes) et ne peut rien
 * modifier — seulement la prendre. Ne jamais le traiter comme `mentor`.
 */
export type SuiviViewerRole = 'student' | 'mentor' | 'moderator' | 'candidate';

/**
 * Charge un suivi et détermine à quel titre l'utilisateur le consulte.
 * Renvoie null si l'utilisateur n'y a pas accès — la route répond alors 404,
 * jamais 403 : on ne confirme pas l'existence d'un suivi privé.
 *
 * Un bénévole qui a passé la main ne voit plus le suivi : seul le bénévole
 * EN COURS y a accès. La modération voit tout.
 */
export async function loadSuiviFor(
  id: string,
  user: SuiviUser
): Promise<{ mentorship: IMentorship; viewer: SuiviViewerRole } | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();

  const mentorship = await Mentorship.findById(id);
  if (!mentorship) return null;

  if (mentorship.student.toString() === user.id) return { mentorship, viewer: 'student' };
  if (mentorship.mentor && mentorship.mentor.toString() === user.id) return { mentorship, viewer: 'mentor' };
  if (await canManage(user)) return { mentorship, viewer: 'moderator' };

  // Un bénévole peut consulter une demande EN FILE (pour décider de la prendre),
  // mais seulement la demande : c'est la route qui filtre ce qu'elle renvoie.
  if (mentorship.status === 'pending' && (await canMentor(user))) {
    return { mentorship, viewer: 'candidate' };
  }
  return null;
}
