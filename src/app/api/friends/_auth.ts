import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Utilisateur courant pour les routes /api/friends.
 * Renvoie null si la session est absente ou le compte introuvable.
 */
export async function currentUser(): Promise<{ id: string; username: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await dbConnect();
  const user = await User.findOne({ email: session.user.email })
    .select('_id username')
    .lean<{ _id: any; username: string }>();

  if (!user) return null;
  return { id: user._id.toString(), username: user.username };
}
