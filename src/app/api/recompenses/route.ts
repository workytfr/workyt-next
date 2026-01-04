import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import Reward from '@/models/Reward';
import { handleApiError } from '@/utils/apiErrorResponse';

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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Filtre par statut (obligatoire, pas d'option "all")
    if (status === 'active') {
        // Récompenses en cours : startDate <= maintenant ET endDate >= maintenant
        filters.$and = [
            { startDate: { $lte: todayEnd } },
            { endDate: { $gte: todayStart } }
        ];
    } else if (status === 'upcoming') {
        // Récompenses à venir : startDate > maintenant
        filters.startDate = { $gt: todayEnd };
    } else if (status === 'ended') {
        // Récompenses terminées : endDate < maintenant
        filters.endDate = { $lt: todayStart };
    } else {
        // Par défaut, afficher les récompenses actives si aucun statut n'est spécifié
        filters.$and = [
            { startDate: { $lte: todayEnd } },
            { endDate: { $gte: todayStart } }
        ];
    }

    // Filtres par dates personnalisées
    const dateFilters: any[] = [];
    
    if (startDate) {
        const customStartDate = new Date(startDate);
        customStartDate.setHours(0, 0, 0, 0);
        dateFilters.push({ startDate: { $gte: customStartDate } });
    }

    if (endDate) {
        const customEndDate = new Date(endDate);
        customEndDate.setHours(23, 59, 59, 999);
        dateFilters.push({ endDate: { $lte: customEndDate } });
    }

    // Combiner les filtres de statut et de dates
    if (filters.$and && dateFilters.length > 0) {
        // Si on a déjà un $and pour le statut, ajouter les filtres de dates
        filters.$and.push(...dateFilters);
    } else if (dateFilters.length > 0) {
        // Si on n'a que des filtres de dates
        if (dateFilters.length === 1) {
            Object.assign(filters, dateFilters[0]);
        } else {
            filters.$and = dateFilters;
        }
    }

    try {
        let query = Reward.find(filters);
        
        // Limiter les résultats selon le statut pour éviter les requêtes trop longues
        if (status === 'ended') {
            // Terminées : limiter à 6 dernières
            query = query.sort({ endDate: -1 }).limit(6);
        } else if (status === 'active') {
            // En cours : limiter à 20 pour éviter les requêtes trop longues
            query = query.sort({ startDate: -1 }).limit(20);
        } else if (status === 'upcoming') {
            // À venir : limiter à 20 pour éviter les requêtes trop longues
            query = query.sort({ startDate: 1 }).limit(20);
        } else {
            // Par défaut (active) : limiter à 20
            query = query.sort({ startDate: -1 }).limit(20);
        }
        
        const rewards = await query.exec();
        return NextResponse.json(rewards);
    } catch (error: any) {
        return handleApiError(error, 'Erreur serveur');
    }
}

export async function POST(req: NextRequest) {
    try {
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
    } catch (error: any) {
        return handleApiError(error, 'Erreur serveur');
    }
}

