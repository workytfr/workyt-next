import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { initializeCalendarPeriod } from '@/lib/calendarService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await (await import('@/models/User')).default.findOne({ email: session.user.email });
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { startDate, endDate } = await req.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Dates requises' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    await initializeCalendarPeriod(start, end);

    return NextResponse.json({ 
      success: true,
      message: 'Calendrier initialisé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation du calendrier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du calendrier' },
      { status: 500 }
    );
  }
}

