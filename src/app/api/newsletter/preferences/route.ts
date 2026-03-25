import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/newsletter/preferences - Recuperer les preferences newsletter
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(session.user.id).select('newsletterOptIn newsletterPreferences').lean();
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        return NextResponse.json({
            newsletterOptIn: user.newsletterOptIn ?? true,
            newsletterPreferences: {
                hebdo: user.newsletterPreferences?.hebdo ?? true,
                classique: user.newsletterPreferences?.classique ?? true,
            },
        });
    } catch (error) {
        console.error('Erreur GET newsletter preferences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * PATCH /api/newsletter/preferences - Modifier les preferences newsletter
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
        }

        const body = await req.json();

        await connectDB();

        const update: Record<string, any> = {};

        // Support ancien format (newsletterOptIn boolean)
        if (typeof body.newsletterOptIn === 'boolean') {
            update.newsletterOptIn = body.newsletterOptIn;
            // Si desabonnement global, desactiver tout
            if (!body.newsletterOptIn) {
                update['newsletterPreferences.hebdo'] = false;
                update['newsletterPreferences.classique'] = false;
            }
        }

        // Support nouveau format (preferences granulaires)
        if (body.newsletterPreferences) {
            if (typeof body.newsletterPreferences.hebdo === 'boolean') {
                update['newsletterPreferences.hebdo'] = body.newsletterPreferences.hebdo;
            }
            if (typeof body.newsletterPreferences.classique === 'boolean') {
                update['newsletterPreferences.classique'] = body.newsletterPreferences.classique;
            }

            // Mettre a jour newsletterOptIn en fonction des preferences
            const user = await User.findById(session.user.id).select('newsletterPreferences').lean();
            const hebdo = body.newsletterPreferences.hebdo ?? user?.newsletterPreferences?.hebdo ?? true;
            const classique = body.newsletterPreferences.classique ?? user?.newsletterPreferences?.classique ?? true;
            update.newsletterOptIn = hebdo || classique;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'Aucune preference valide fournie' }, { status: 400 });
        }

        await User.findByIdAndUpdate(session.user.id, { $set: update });

        const updatedUser = await User.findById(session.user.id).select('newsletterOptIn newsletterPreferences').lean();

        return NextResponse.json({
            success: true,
            newsletterOptIn: updatedUser?.newsletterOptIn ?? true,
            newsletterPreferences: {
                hebdo: updatedUser?.newsletterPreferences?.hebdo ?? true,
                classique: updatedUser?.newsletterPreferences?.classique ?? true,
            },
        });
    } catch (error) {
        console.error('Erreur PATCH newsletter preferences:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
