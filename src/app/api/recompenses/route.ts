import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import Reward from '@/models/Reward';

export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status'); // 'all', 'active', 'upcoming', 'ended'

    if (id) {
        // Récupérer une récompense spécifique
        const reward = await Reward.findById(id);
        return NextResponse.json(reward);
    }

    // Construire les filtres
    const filters: any = {};
    const now = new Date();

    // Par défaut, afficher les récompenses actives (endDate >= hier)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!status || status === 'active') {
        // Récompenses en cours : startDate <= maintenant ET endDate >= hier
        filters.$and = [
            { startDate: { $lte: now } },
            { endDate: { $gte: yesterday } }
        ];
    } else if (status === 'upcoming') {
        // Récompenses à venir : startDate > maintenant
        filters.startDate = { $gt: now };
    } else if (status === 'ended') {
        // Récompenses terminées : endDate < hier
        filters.endDate = { $lt: yesterday };
    }
    // Si status === 'all', pas de filtre de statut

    // Filtres par dates personnalisées
    if (startDate) {
        const customStartDate = new Date(startDate);
        if (!filters.$and) filters.$and = [];
        filters.$and.push({ startDate: { $gte: customStartDate } });
    }

    if (endDate) {
        const customEndDate = new Date(endDate);
        // Ajouter 23h59m59s pour inclure toute la journée
        customEndDate.setHours(23, 59, 59, 999);
        if (!filters.$and) filters.$and = [];
        filters.$and.push({ endDate: { $lte: customEndDate } });
    }

    try {
        const rewards = await Reward.find(filters).sort({ startDate: -1 });
        return NextResponse.json(rewards);
    } catch (error) {
        console.error('Erreur lors de la récupération des récompenses:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    const user = await authMiddleware(req);
    if (!user?.isAdmin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const payload = await req.json();
    // Valider que payload.startDate < payload.endDate
    if (new Date(payload.startDate) >= new Date(payload.endDate)) {
        return NextResponse.json({ error: 'Date de début doit être avant date de fin' }, { status: 400 });
    }
    // Si méthode 'mostRevisionsInCategory', category est obligatoire
    if (payload.method === 'mostRevisionsInCategory' && !payload.category) {
        return NextResponse.json({ error: 'Category requis pour mostRevisionsInCategory' }, { status: 400 });
    }

    const reward = await Reward.create(payload);
    return NextResponse.json(reward, { status: 201 });
}

