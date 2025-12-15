import { NextRequest, NextResponse } from 'next/server';
import authMiddleware from '@/middlewares/authMiddleware';
import { NotificationService } from '@/lib/notificationService';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
    try {
        // S'assurer que MongoDB est connecté
        await connectDB();

        // Authentification
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Paramètres de pagination
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        // Récupération des notifications
        const result = await NotificationService.getUserNotifications(
            user._id.toString(),
            page,
            limit
        );

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Erreur lors de la récupération des notifications:', error);
        
        // Gérer les erreurs de connexion MongoDB spécifiquement
        if (error.message?.includes('MongoDB') || error.message?.includes('connection') || error.message?.includes('ENOTFOUND')) {
            return NextResponse.json(
                { error: 'Erreur de connexion à la base de données' },
                { status: 503 }
            );
        }
        
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/notifications
 * Marque toutes les notifications comme lues
 */
export async function PUT(req: NextRequest) {
    try {
        // S'assurer que MongoDB est connecté
        await connectDB();

        // Authentification
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Marquer toutes les notifications comme lues
        await NotificationService.markAllAsRead(user._id.toString());

        return NextResponse.json({
            success: true,
            message: 'Toutes les notifications ont été marquées comme lues'
        });

    } catch (error: any) {
        console.error('Erreur lors du marquage des notifications:', error);
        
        // Gérer les erreurs de connexion MongoDB spécifiquement
        if (error.message?.includes('MongoDB') || error.message?.includes('connection') || error.message?.includes('ENOTFOUND')) {
            return NextResponse.json(
                { error: 'Erreur de connexion à la base de données' },
                { status: 503 }
            );
        }
        
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
