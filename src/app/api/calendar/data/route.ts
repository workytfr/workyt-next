import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCalendarData, initializeCalendarPeriod } from '@/lib/calendarService';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'Dates requises' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Initialiser le calendrier pour la période si nécessaire
    await initializeCalendarPeriod(startDate, endDate);

    const userId = user._id.toString();

    // Les deux sont indépendants : en série on payait deux allers-retours réseau.
    const { getCollection, getMonthKey } = await import('@/lib/adventureService');
    const fallback: import('@/lib/adventureService').CollectionInfo = {
      cards: [],
      totalWeeks: 5,
      setCompleted: false
    };

    const [calendarData, collection] = await Promise.all([
      getCalendarData(userId, startDate, endDate),
      // La collection ne doit jamais bloquer l'affichage du calendrier
      getCollection(userId, getMonthKey(startDate)).catch((err) => {
        console.error('Erreur getCollection:', err);
        return fallback;
      })
    ]);

    return NextResponse.json({ ...calendarData, collection });
  } catch (error: any) {
    console.error('Erreur lors de la récupération du calendrier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du calendrier' },
      { status: 500 }
    );
  }
}

