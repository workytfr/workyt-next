import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { healWithMushroom } from '@/lib/heroService';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hero/heal — ranime/soigne le héros avec 1 champignon.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const rl = rateLimit(`hero-heal:${session.user.email}`, 5, 60_000);
    if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const result = await healWithMushroom(user._id.toString());

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur POST /api/hero/heal:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
