import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import Revision from '@/models/Revision';

/**
 * GET /api/auth/me
 * Retourne le profil complet de l'utilisateur connecté (pour l'app mobile).
 */
export async function GET(req: NextRequest) {
    try {
        const authUser = await authMiddleware(req);
        await connectDB();

        const user = await User.findById(authUser._id)
            .select('-password -resetPasswordToken -resetPasswordExpiry -unsubscribeToken')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
        }

        // Stats
        const [questionCount, answerCount, revisionCount] = await Promise.all([
            Question.countDocuments({ user: authUser._id }),
            Answer.countDocuments({ user: authUser._id }),
            Revision.countDocuments({ author: authUser._id }),
        ]);

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                points: user.points,
                badges: user.badges || [],
                selectedBadge: user.selectedBadge || null,
                bio: user.bio || '',
                image: (user as any).image || null,
                verified: user.verified,
                createdAt: user.createdAt,
            },
            stats: {
                questions: questionCount,
                answers: answerCount,
                revisions: revisionCount,
            },
        });
    } catch (error: any) {
        if (error.message?.includes('Token') || error.message?.includes('auth')) {
            return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
