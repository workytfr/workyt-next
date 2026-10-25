import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Identifiant de l'utilisateur porté par le jeton Bearer de l'application
 * mobile (le même que celui vérifié par authMiddleware).
 *
 * Repli des helpers d'authentification qui ne lisent que la session NextAuth
 * (cookie) : sans lui, l'app est vue comme « non connectée ». Renvoie null
 * s'il n'y a pas de jeton, ou s'il est invalide ou expiré.
 */
export async function bearerUserId(): Promise<string | null> {
  const auth = (await headers()).get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
    return decoded?.id && mongoose.isValidObjectId(decoded.id) ? decoded.id : null;
  } catch {
    return null;
  }
}

/**
 * Email de l'utilisateur courant : session NextAuth du site, sinon jeton
 * Bearer de l'application mobile (relu en base). Pour les routes qui
 * retrouvent l'utilisateur par `User.findOne({ email })` et s'en servent
 * comme clé de rate limit : elles restent identiques pour le site.
 */
export async function currentUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) return session.user.email;

  const id = await bearerUserId();
  if (!id) return null;
  await dbConnect();
  const user = await User.findById(id).select('email').lean<{ email?: string }>();
  return user?.email ?? null;
}

/**
 * Identifiant de l'utilisateur courant (session du site, sinon jeton Bearer),
 * pour les routes qui lisaient `session.user.id`.
 */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;
  return bearerUserId();
}
