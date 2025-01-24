import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        await connectDB();

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: new Date() }, // Vérifie si le token n'a pas expiré
        });

        if (!user) {
            return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 });
        }

        // Mettre à jour le mot de passe
        user.password = await bcrypt.hash(password, 10); // Hachage du nouveau mot de passe
        user.resetPasswordToken = undefined; // Supprime le token
        user.resetPasswordExpiry = undefined; // Supprime la date d'expiration
        await user.save();

        return NextResponse.json({ message: 'Mot de passe mis à jour avec succès' }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
