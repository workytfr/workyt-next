import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import User from '@/models/User';

/**
 * POST /api/auth/badge
 * Sélection du badge affiché — version mobile (auth par token Bearer).
 * Body: { badgeSlug: string | null }  (null = retirer le badge affiché)
 */
export async function POST(req: NextRequest) {
    try {
        const authUser = await authMiddleware(req);
        await connectDB();

        const { badgeSlug } = await req.json();

        const user = await User.findById(authUser._id);
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
        }

        // null = retirer le badge affiché
        if (badgeSlug === null) {
            user.selectedBadge = null;
            await user.save();
            return NextResponse.json({ success: true, selectedBadge: null });
        }

        // L'utilisateur doit posséder le badge
        if (!user.badges?.includes(badgeSlug)) {
            return NextResponse.json({ error: 'Badge non possédé.' }, { status: 400 });
        }

        user.selectedBadge = badgeSlug;
        await user.save();

        return NextResponse.json({ success: true, selectedBadge: badgeSlug });
    } catch (error: any) {
        if (error.message?.includes('Token') || error.message?.includes('autorisé') || error.message?.includes('auth')) {
            return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
        }
        console.error('Erreur sélection badge (mobile):', error.message);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
