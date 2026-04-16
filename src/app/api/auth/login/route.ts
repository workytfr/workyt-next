import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { rateLimit, rateLimitResponse, getIP } from '@/lib/rateLimit';

/**
 * POST /api/auth/login
 * Login pour l'app mobile — retourne un JWT + user.
 */
export async function POST(req: NextRequest) {
    try {
        // Rate limit: 10 tentatives/min par IP
        const ip = getIP(req);
        const rl = rateLimit(`login:${ip}`, 10, 60_000);
        if (!rl.success) {
            return rateLimitResponse(rl.retryAfterMs);
        }

        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email et mot de passe requis.' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return NextResponse.json(
                { error: 'Identifiants incorrects.' },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Identifiants incorrects.' },
                { status: 401 }
            );
        }

        // Générer le JWT (même format que NextAuth)
        const accessToken = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                points: user.points,
                badges: user.badges,
                bio: user.bio,
                isAdmin: user.isAdmin,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '15d' }
        );

        return NextResponse.json({
            accessToken,
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
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur.' },
            { status: 500 }
        );
    }
}
