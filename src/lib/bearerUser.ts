import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

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
