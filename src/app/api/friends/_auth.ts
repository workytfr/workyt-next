import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { bearerUserId } from '@/lib/bearerUser';

/**
 * Utilisateur courant pour les routes /api/friends, /api/clan et /api/challenges
 * (session du site, ou jeton Bearer de l'application mobile).
 * Renvoie null si la session est absente ou le compte introuvable.
 */
export async function currentUser(): Promise<{ id: string; username: string } | null> {
  type Row = { _id: any; username: string };
  const session = await getServerSession(authOptions);
  let user: Row | null = null;

  if (session?.user?.email) {
    await dbConnect();
    user = await User.findOne({ email: session.user.email }).select('_id username').lean<Row>();
  } else {
    // Application mobile : jeton Bearer au lieu du cookie de session
    const id = await bearerUserId();
    if (!id) return null;
    await dbConnect();
    user = await User.findById(id).select('_id username').lean<Row>();
  }

  if (!user) return null;
  return { id: user._id.toString(), username: user.username };
}
