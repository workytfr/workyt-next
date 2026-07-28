import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { currentUser } from '../../_auth';
import { getProfileFriendInfo } from '@/lib/friendService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/friends/profile/[userId] — bloc « amis » d'une page de profil.
 *
 * Renvoie en une seule requête : le nombre d'amis, un aperçu de 8, et la
 * relation du visiteur avec cette personne (pilote l'état du bouton).
 * Accessible sans session : un visiteur non connecté voit les compteurs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 400 });
    }

    const me = await currentUser(); // null si non connecté — pas une erreur ici
    const data = await getProfileFriendInfo(me?.id ?? null, userId);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur GET /api/friends/profile/[userId]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
