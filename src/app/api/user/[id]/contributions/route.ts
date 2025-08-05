import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import PointTransaction from '@/models/PointTransaction';
import User from '@/models/User';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await connectDB();
        const resolvedParams = await params;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(resolvedParams.id);
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Calculer la date de début (3 mois en arrière)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        // Récupérer toutes les transactions de points sur la période
        const transactions = await PointTransaction.find({
            user: resolvedParams.id,
            type: 'gain',
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ createdAt: 1 });

        // Créer un objet pour stocker les points par jour
        const dailyContributions: { [key: string]: number } = {};
        
        // Initialiser tous les jours avec 0 points
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyContributions[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Ajouter les points de chaque transaction
        transactions.forEach(transaction => {
            const dateKey = transaction.createdAt.toISOString().split('T')[0];
            if (dailyContributions[dateKey] !== undefined) {
                dailyContributions[dateKey] += transaction.points;
            }
        });

        // Convertir en format pour le graphique
        const contributions = Object.entries(dailyContributions).map(([date, points]) => ({
            date,
            points,
            level: getContributionLevel(points)
        }));

        // Calculer les statistiques
        const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);
        const totalTransactions = transactions.length;
        const averagePointsPerDay = totalPoints / Object.keys(dailyContributions).length;
        const maxPointsInDay = Math.max(...Object.values(dailyContributions));
        const activeDays = Object.values(dailyContributions).filter(points => points > 0).length;

        return NextResponse.json({
            contributions,
            stats: {
                totalPoints,
                totalTransactions,
                averagePointsPerDay: Math.round(averagePointsPerDay * 100) / 100,
                maxPointsInDay,
                activeDays,
                totalDays: Object.keys(dailyContributions).length
            },
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des contributions:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}

// Fonction pour déterminer le niveau de contribution (style GitHub)
function getContributionLevel(points: number): 0 | 1 | 2 | 3 | 4 {
    if (points === 0) return 0;
    if (points <= 5) return 1;
    if (points <= 15) return 2;
    if (points <= 30) return 3;
    return 4;
} 