import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { normalizeDate, startDailyQuizTimer } from '@/lib/dailyQuizService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/daily-quiz/start — démarre le chrono anti-triche.
 *
 * Appelé quand l'élève clique explicitement sur « Commencer le combat ».
 *
 * Pourquoi une route dédiée plutôt qu'un démarrage au GET : la page du jeu
 * charge le quiz dès son ouverture, bien avant que l'élève ait regardé la
 * question. Démarrer le chrono à ce moment-là pénaliserait quelqu'un qui
 * parcourt simplement la page — exactement le comportement qu'on ne veut
 * PAS sanctionner.
 *
 * Le chrono mesure donc le temps entre « je vois la question » et « je
 * réponds », et rien d'autre.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const rl = rateLimit(`daily-quiz-start:${session.user.email}`, 20, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('_id').lean<{ _id: any }>();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    await startDailyQuizTimer(user._id.toString(), normalizeDate(new Date()));
    return NextResponse.json({ success: true, started: true });
  } catch (error) {
    console.error('Erreur POST /api/daily-quiz/start:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
