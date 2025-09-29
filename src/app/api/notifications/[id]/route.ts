import { NextRequest, NextResponse } from 'next/server';
import authMiddleware from '@/middlewares/authMiddleware';
import { NotificationService } from '@/lib/notificationService';
import { connectDB } from '@/lib/mongodb';

connectDB();

/**
 * PUT /api/notifications/[id]
 * Marque une notification spécifique comme lue
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentification
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Récupération de l'ID de la notification
        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { error: 'ID de notification requis' },
                { status: 400 }
            );
        }

        // Marquer la notification comme lue
        await NotificationService.markAsRead(id, user._id.toString());

        return NextResponse.json({
            success: true,
            message: 'Notification marquée comme lue'
        });

    } catch (error: any) {
        console.error('Erreur lors du marquage de la notification:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
