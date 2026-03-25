import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import { sendNewsletterBatch } from '@/lib/newsletter/sendBatch';

/**
 * POST /api/newsletter/send - Declencher l'envoi d'un batch newsletter
 * Protege par CRON_SECRET ou session Admin
 */
export async function POST(req: NextRequest) {
    try {
        // Verification : CRON_SECRET ou Admin
        const cronSecret = req.headers.get('x-cron-secret');
        const isValidCron = cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

        if (!isValidCron) {
            const session = await getServerSession(authOptions);
            if (!session?.user?.role || session.user.role !== 'Admin') {
                return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
            }
        }

        await connectDB();
        const result = await sendNewsletterBatch(450);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Erreur envoi newsletter:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
